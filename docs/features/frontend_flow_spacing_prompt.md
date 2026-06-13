# Prompt: 100% Production UI/UX Polish, Onboarding Flow & Spacing Audit

Copy and paste this prompt to your UI/UX-focused coding agent. It points out specific spacing issues and missing flows in the current codebase, directing them to bring the frontend to a 100% finished, premium state.

---

```markdown
You are an elite React Native + Expo UI/UX and motion engineer. 
Your task is to audit the current codebase, fix spacing/styling inconsistencies, and implement the missing user onboarding and settings screens to achieve 100% production-ready UI/UX polish.

Before you begin, read the instructions in:
1. [AGENTS.md](file:///d:/digest/AGENTS.md)
2. [digest_design.md](file:///d:/digest/docs/digest_design.md)
3. The feature specifications in `docs/features/`

You must activate the "Taste" (design-taste-frontend) and "UI UX Pro Max" skills. We are building the frontend first. All database and API actions must be mocked via Zustand and local AsyncStorage.

---

### Part 1: Spacing Audit & NativeWind Styling Refactor
Currently, the screens in `app/(tabs)/index.tsx`, `app/(tabs)/profile.tsx`, `app/(tabs)/recipes.tsx`, `app/food/search.tsx`, and `app/diary/index.tsx` use a mixed styling pattern. They declare layout margins, paddings, borders, and flex boxes in a large `StyleSheet.create` block while using NativeWind `className` classes only for text formatting. 

This breaks the Styling Rules in `AGENTS.md` and causes inconsistent spacing. You must:
1. **Refactor styles to strictly use NativeWind classes** for all container layouts, margins, paddings, flex boxes, border radius, backgrounds, and shadows.
2. **Apply StyleSheet ONLY for allowed style exceptions** (e.g., SafeAreaView background, absolute coordinate positioning for camera overlays, animated styles, and custom SVG styling).
3. **Audit the Spacing Scale:** 
   - Ensure a strict 8pt grid spacing system (`p-4`, `p-5`, `p-6`, `space-y-6`, `gap-4`).
   - Fix crowded elements by providing generous white space around bento grids.
   - Align text elements precisely. For example, ensure dates, headers, and descriptions are left-aligned (or right-aligned in RTL Arabic layout) with identical horizontal margins.

---

### Part 2: Implement Missing Onboarding & Setup Flows
Currently, the app skips onboarding entirely and drops a guest user directly into the dashboard. Implement a premium, multi-step onboarding screen:
1. **Onboarding Route:** Create a new route `app/onboarding.tsx` (or `app/onboarding/index.tsx`).
2. **Setup Steps:** 
   - *Step 1:* Name & Country (Egyptian / UK preference detection preview).
   - *Step 2:* Biometrics (Gender selector, Date of birth, Height, Weight).
   - *Step 3:* Activity Level & Health Goals (sedentary/active, lose/gain/maintain weight).
3. **Target Calculation:** At the final step, calculate BMR, TDEE, Calories, and macro goals using the Mifflin-St Jeor formula in `store/useDiaryStore.ts`, save them to the Zustand store, and navigate to the dashboard.
4. **Trial-First Entry:** If a user opens the app, they first enter this onboarding flow (if not completed before), then land on the dashboard in Trial Mode.

---

### Part 3: Re-organize & Polish Settings
Currently, `app/(tabs)/profile.tsx` is a crowded mix of account status, PDF triggers, biometrics modification inputs, and app configurations on a single screen.
1. **Layout Separation:** Separate this page into clean sections. Use a premium bento grid of settings:
   - *Section 1 (Card):* Account Status (Clerk Sign In/Sign Out triggers).
   - *Section 2 (Card):* Health Target Summary (displays calculated daily calories & macros in a clean table).
   - *Section 3 (Card):* Biometrics Settings (collapsible or clearly categorized selectors to update Weight, Height, Age, Activity, and Goal).
   - *Section 4 (Card):* App Configurations (Language, Country priority toggles).
2. **PDF Action Card:** Style the PDF export button and loading indicators in an elegant container matching our Sage Green/Mint visual system.

---

### Part 4: Component Routing Refactor (Expo Router)
Avoid using inline state switches for entire detailed layouts. Refactor these to utilize clean Expo Router navigation paths:
1. **Recipe Detail Route:** Move the recipe details layout from `app/(tabs)/recipes.tsx` into a separate route under `app/recipes/[id].tsx` (or as a separate route inside the `diary` directory). Tapping a recipe card in the feed should route to this detail view.
2. **AI Vision & Image Scanner Overlay:** Refactor the camera scanning view in `app/food/search.tsx` to display coordinates overlay tags over the image using clean, absolute positioned badges as planned in `docs/features/ai_vision.md`.

Verify that the code complies with TypeScript types and runs without warnings using:
`npm run typecheck`
```
