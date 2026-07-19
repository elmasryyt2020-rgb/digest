# Implementation Plan: AI Vision Scanner Pipeline + Auth Auth Cleanup

## Context

The spec `docs/superpowers/specs/2026-07-17-auth-vision-pivot-design.md` calls for two pivots:
1. Banish Clerk → Supabase Auth (email/password + OTP).
2. AI Vision Scanner: Gemini 3.5 Flash detects food items + coordinates → edge function matches against `foods_cache` for verified nutrients → app renders tag overlay + confirmation sliders → logs to diary.

**Discovery:** Pivot #1 is already 100% implemented in code — `app/sign-in.tsx`, `app/sign-up.tsx`, `components/SupabaseSignUpModal.tsx`, and `store/useAuthStore.ts` all use `@supabase/supabase-js` directly with OTP for signup-verification and password-recovery; there are zero Clerk imports anywhere. The only Clerk remnant is `@clerk/clerk-expo` still listed in `package.json` (used by nothing).

Pivot #2 (the real work) is **mocked inside `app/food/search.tsx` mode `'camera'`** (lines ~635-1214): `handleSnapPhoto` doesn't open the device camera, hardcodes an Unsplash image, and fakes 2 `DetectedItemType` items after a 2-second `setTimeout`. The `DetectedItemType` contract already matches the ai_vision.md spec (`anchor_point: [x,y]` on a 0-100 scale, per-100g macros, optional `micros`). The inline tag overlay and confirmation card (weight stepper + macro chips + micros toggle + Log to Diary button wired through `addFoodLog`) already exist.

Reference edge function: `supabase/functions/translate-food/index.ts` (Deno std 0.168, `serve`, CORS `*`, `Deno.env.get('GEMINI_API_KEY')`, hits `generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`).

Schema gaps: `supabase_schema.sql` declares only the `reports` Storage bucket — no `scans` bucket exists. `food_logs.food_id TEXT REFERENCES foods_cache(id)`, so detected items must be upserted into `foods_cache` (with `id = 'gemini:<hash>'` per the schema comment) before logging. `foods_cache` SELECT is public, INSERT/UPDATE is authenticated (RLS).

---

## Decisions (confirmed with user)

- **Camera capture: BOTH** — live `CameraView` take + gallery via `expo-image-picker`. Requires installing `expo-image-picker` + `expo-image-manipulator` (with explicit AGENTS.md note that the user approved both new libs). `expo-camera` (~56.0.8) is already installed.
- **Nutrient source: DB-overrides-Gemini** — edge function normalizes each detected name and matches `foods_cache`; on hit it overrides Gemini's per-100g macros + micros with DB values, on miss it keeps Gemini's and writes a `gemini:<hash>` row.
- **Auth scope: Just remove the dead dep** — `npm uninstall @clerk/clerk-expo`, re-run `npm run typecheck` to confirm zero broken imports.
- **Overlay: Keep inline** — no new component file; update the inline overlay in `search.tsx` to use the real anchor_point math from ai_vision.md.

---

## Files to create / modify

### A. Schema migration (Storage bucket)
**`supabase_schema.sql`** — append a `scans` bucket block, mirroring the existing `reports` block (lines 170-180). New section:
```sql
-- 10. Storage Bucket for AI Vision Scans
INSERT INTO storage.buckets (id, name, public)
VALUES ('scans', 'scans', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can manage their own scans" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'scans' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'scans' AND auth.uid()::text = (storage.foldername(name))[1]);
```
Private bucket, path-scoped to the user's id (`<user_id>/<filename>.jpg`).

### B. Edge function ⭐ (the core new file)
**`supabase/functions/scan-image/index.ts`** — new Deno function, modeled on `translate-food/index.ts`:

- `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";`
- `import { createClient } from "https://esm.sh/@supabase/supabase-js@2";` (following `delete-account/index.ts`)
- CORS preflight + `corsHeaders` identical to `translate-food`.
- Env: `Deno.env.get('GEMINI_API_KEY')`, `Deno.env.get('SUPABASE_URL')`, `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` (service-role to read `scans` bucket + insert into `foods_cache`; the function is JWT-verified by default so the user is authenticated, but Storage bucket fetch from within the function uses the service role client).
- Request body from app: `{ "image_path": "<user_id>/<uuid>.jpg" }`.
- Flow:
  1. Authenticate the caller — read the `Authorization: Bearer <jwt>` header, create an anon client from it. If no user, return 401. (This gives us `auth.uid()` for path scoping.)
  2. Sanitize `image_path` — require it to start with `${user.id}/`, rejecting mismatches (prevents path traversal across users).
  3. Fetch image bytes from `scans` bucket via the service-role client: `supabase.storage.from('scans').download(image_path)`.
  4. Convert bytes → base64; set `mimeType` from the Blob type (default `image/jpeg`).
  5. Call Gemini vision: same endpoint as `translate-food` but model `gemini-1.5-flash` (vision-capable, matches existing code; the "3.5 Flash" naming in the spec is the marketing label — `gemini-1.5-flash` is the deployed model already used by `translate-food`). Body:
     ```json
     { "contents": [{ "parts": [ { "text": <vision prompt verbatim from ai_vision.md §2> }, { "inlineData": { "mimeType": "image/jpeg", "data": "<base64>" } } ] }] }
     ```
  6. Parse the response. Gemini wraps JSON inside `candidates[0].content.parts[0].text` — strip any markdown fences (the prompt asks for raw JSON, but we defensively trim ```json fences), `JSON.parse` it. Validate shape: `{ detected_items: [...] }`. Each item has `name_en, name_ar, amount_g, anchor_point:[x,y], calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g`.
  7. **DB-overrides-Gemini step** for each detected item:
     - Normalize `name_en` (lowercase, trim) and query `foods_cache` via the service-role client:
       `supabase.from('foods_cache').select('*').ilike('name_en', normalized).limit(1)`.
     - On hit: override `calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g` and set `micros` from the DB row; set `id = <db.id>`, `source = <db.source>`.
     - On miss: keep Gemini's macros; compute `id = 'gemini:' + <sha256 of name_en + macros>`; `source = 'gemini'`; leave `micros = {}`.
     - `upsert` any gemini-namespaced row into `foods_cache` so future scans (and the FK on `food_logs`) resolve. (Usda/off rows are not re-inserted.)
  8. Return `{ "detected_items": [...] }` to the app — same shape as the mock's `DetectedItemType` (with `id, name_en, name_ar, amount_g, anchor_point, *_per_100g, micros, source`).
- Errors: outer try/catch returns `{ error: <message> }` with HTTP 400, matching `translate-food`.
- **No `config.toml`** — keep default `verify_jwt = true` so the function is callable only with the user's Supabase session token (consistent with `delete-account` which also relies on caller auth).

### C. Client upload + invoke in `app/food/search.tsx`
**Modify `app/food/search.tsx`** — replace the mock in `mode === 'camera'` with a real pipeline. Change `handleSnapPhoto` (currently ~lines 641-657) so it:

1. **Live capture path** — keep the existing `CameraView` (already rendered with a ref), call `cameraRef.current.takePictureAsync()` → local `uri`.
2. **Gallery path** (NEW) — add a small "Pick from Gallery" button under the camera view; on press `expo-image-picker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.85 })` → `uri`.
3. **Compress** (both paths) — `expo-image-manipulator`'s `manipulateAsync(uri, [{ resize: { width: 1024 } }], { compress: 0.85, format: 'jpeg' })` → final `uri`. Per ai_vision.md §1 (max 1024px, 85% JPEG quality).
4. **Upload** — get the user id from `useAuthStore.getState().user?.id` (or `supabase.auth.getUser()`), generate a uuid (`crypto.randomUUID()` is available in RN 0.85 / Expo 56), build `path = ${userId}/${uuid}.jpg`, call `supabase.storage.from('scans').upload(path, { uri, type: 'jpeg', name })`. On error, surface via the existing `error` state.
5. **Invoke edge function** — `const { data, error } = await supabase.functions.invoke('scan-image', { body: { image_path: path } })`. `invoke` auto-injects the session bearer token.
6. **On success** — `setDetectedItems(data.detected_items)`, `setCameraImage(<public URL or signed URL from storage>)`, `setCameraState('detected')`. The existing overlay (lines ~1166-1214) already maps `detectedItems` via `anchor_point` percentages — **apply the real anchor_point math from ai_vision.md §3** (offset the tag by `-40px left / -15px top` to center it on the anchor). Use `onLayout` to capture container `width`/`height` if needed; current code already uses `leftPercent`/`topPercent` which works once the parent has a measured size.
7. **Removal:** delete the `setTimeout` + hardcoded Unsplash URL + hardcoded `items` array.
8. Add a "Retake" button in the detected state to reset `cameraState='idle'` and clear `cameraImage`/`detectedItems`.
- Existing downstream wiring (`handleSelectOverlayTag` → `renderNutrientPreview` → macros card + weight stepper + micros toggle → `handleLogFood` → `addFoodLog` + `foods_cache` upsert + `router.back()`) stays unchanged — the real detected items flow through it identically.
- Bilingual strings (`cameraTitle`, `cameraScanning`, `cameraSuccess`) at lines ~232-235 already exist; reuse them.
- Add a "scanning" loading overlay (the existing `cameraState === 'scanning'` branch) while the upload + function invocation are in flight, with the existing laser-line animation.

### D. Auth cleanup (minimal)
**`package.json`** — run `npm uninstall @clerk/clerk-expo` to remove the unused dep. Re-run `npm run typecheck` and confirm zero Clerk-related errors. (No source code changes — verified zero imports via repo-wide grep.)

---

## Dependency install (with explicit approval note)
Per AGENTS.md, installing new libraries requires user approval. **The user approved "both"** for camera capture, which requires:

- `expo-image-picker` (gallery picker) — Expo module, version matched to SDK 56 (`~16.0.x`).
- `expo-image-manipulator` (resize to 1024px + 85% JPEG compress, per ai_vision.md spec) — version matched to SDK 56 (`~13.0.x`).

Both are first-party Expo packages (not third-party), so they fit the existing stack with no risk. Install with `npx expo install expo-image-picker expo-image-manipulator` so versions lock to the installed SDK.

(No other new libraries. `expo-camera`, `@supabase/supabase-js`, `react-native-reanimated`, `pressto`-compliant `PresstoButton`, NativeWind v4 — all already in place.)

---

## Verification plan
1. `npm run typecheck` — must pass after removing Clerk + adding the two new imports.
2. Manual end-to-end smoke (after the user deploys the function + runs the schema migration):
   - Apply the new `scans` bucket + policy to the Supabase project (`psql` / Supabase SQL editor).
   - `supabase functions deploy scan-image --no-verify-jwt=false` (or default deploy), set `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` secrets.
   - From the app: go to a meal card → `/food/search?meal_type=breakfast` → switch to camera mode → snap a real photo (or pick from gallery) → confirm the overlay shows real Gemini-detected tags at the right coordinates → select an item → adjust weight → tap "Log to Diary" → verify a row appears in today's breakfast on the dashboard and in Supabase `food_logs`, and that the matched `foods_cache` row's nutrients were used (when the DB had a hit).
3. Failure paths: missing `GEMINI_API_KEY` → function returns 400 with a message; no session → 401; empty/detection from Gemini → app shows the existing empty `cameraState==='detected'` state with no tags (need a small empty-state string, both languages).

---

## Out of scope (deliberate)
- No new reusable `ImageTagOverlay` component (user chose inline).
- No change to auth screens, `useAuthStore`, `lib/supabase.ts`, or routing (already done).
- No new `supabase/config.toml` (default JWT verification is the safer behavior for a function that handles user photos).
- No micronutrient derivation changes in `app/diary/index.tsx` (orthogonal; the scanner already attaches `micros` to `foods_cache` rows, which could later be consumed there).
- No rewrite of the pre-seeded hardcoded ID list in `handleSelectFood` (out of scope for this feature).

---

## Order of execution (during implement phase)
1. Append `scans` bucket DDL to `supabase_schema.sql`.
2. Create `supabase/functions/scan-image/index.ts`.
3. Install `expo-image-picker` + `expo-image-manipulator` via `npx expo install`.
4. Modify `app/food/search.tsx` `mode === 'camera'` real pipeline (capture + gallery + compress + upload + invoke + real overlay math).
5. `npm uninstall @clerk/clerk-expo`.
6. `npm run typecheck` — confirm green.