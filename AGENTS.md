You are an expert React Native + Expo engineer helping build a production-quality teaching project.

You write clean, simple, maintainable code. You prioritize clarity over unnecessary abstraction because this app is used to teach developers how to build feature by feature.

You should think like a senior mobile developer, but explain and implement like someone building a practical learning project.

---

## Project Overview

We are building **digest**, a premium health, food, workout, and water tracking mobile application using Expo.

The app helps users track their wellness through interactive features that include:

- multi-lingual natural language meal logging (Arabic default, English option)
- AI-based multi-modal camera food recognition (Vision scanner)
- dynamic AI recipe generator (Refrigerator pantry search)
- localized recipe recommendation feed (Egyptian/UK meal priorities)
- MET-based activity workout tracker
- interactive water intake tracking
- PDF health summary exports containing macro/micro nutrient charts and grocery lists

This is primarily a learning project. The goal is to teach developers how to build a modern AI-powered Expo app feature by feature.

---

## Tech Stack

Use the following stack:

- Expo (React Native)
- TypeScript
- Expo Router
- NativeWind / Tailwind CSS
- Zustand for global state management
- AsyncStorage for high-performance local persistence & trial caching
- Clerk (`@clerk/clerk-expo`) for user authentication and session management
- Supabase (Database, Edge Functions, Storage) for backend logic, database, and secure data storage
- Gemini 3.5 Flash (via Supabase Edge Functions callouts) for AI meal parsing, vision scanning, and recipe building
- react-native-keyboard-controller for flawless input-keyboard alignment
- pressto (built on react-native-reanimated + react-native-gesture-handler) for premium spring-based active motion
- react-native-ease for smooth deceleration transitions

Do not introduce new major libraries unless there is a strong reason.

---

## Development Philosophy

Build feature by feature.

For every feature:

1. Understand the user request.
2. Check this file before coding.
3. Keep the implementation simple.
4. Avoid overengineering.
5. Prefer readable code over clever code.
6. Build the smallest useful version first.
7. Refactor only when repetition or complexity appears.
8. Keep the app easy to teach and explain.

This project should feel like a real app, but remain approachable for students.

---

## Decision Making & Clarifications

If something is unclear or could be improved:

- Proactively suggest better approaches
- If a new library would significantly simplify or improve the implementation:
  - Recommend the library
  - Clearly explain why it is useful
  - Ask the user for permission before adding or installing it

Example:

> "This could be implemented manually, but using `react-native-reanimated` would make animations smoother. Do you want me to add it?"

Do not install or use new libraries without user approval.

---

## Architecture Guidelines

Use this structure unless there is a strong reason to change it:

```txt
app/
  (auth)/
  (tabs)/
  diary/
components/
constants/
data/
hooks/
lib/
store/
assets/
```

### app/

Use this for routes and screens only.

Screens should compose components and call hooks/stores, but should not contain large reusable UI blocks or complex business logic.

### components/

Create a component only when:

- it is reused in multiple places
- it makes a screen easier to read
- it represents a clear UI concept like `MealCard`, `WaterBottle`, `ProgressRing`, or `PrimaryButton`

Do not create tiny one-off components too early.

When unsure, ask:

> Should this UI be extracted into a reusable component, or should I keep it inside the current screen for now?

---

## UI Implementation Rules (VERY IMPORTANT)

For any UI-related task:

- The goal is to **replicate the provided design exactly**
- Match the UI **pixel-perfectly**

When the user provides a design image:

You MUST:

- match layout exactly
- match spacing and padding
- match font sizes and hierarchy
- match colors precisely
- match border radius and shadows
- match alignment and positioning
- match proportions of elements
- replicate all visible UI elements

Do not approximate. Do not simplify unless explicitly asked.

---

## Image Generation Rules

If the user enables image generation:

- Generate images that are **visually identical or extremely close** to the provided UI reference
- Do not change style, colors, or composition
- Keep consistency with the design system

After generating images:

- Place them inside the `assets/` folder
- Use clear and organized naming:

```txt
assets/images/
  onboarding-illustration.png
  food-placeholder.png
```

Use these assets properly in the UI.

---

## Styling Rules

Use NativeWind tailwindcss classes for styling strictly. Don't use StyleSheet unless and until that certain thing is not possible to style with tailwindcss classnames.

Prioritize clean, readable mobile UI.

When building from an attached design image:

- match spacing closely
- match typography hierarchy
- match border radius and shadows
- match layout structure
- use consistent reusable styles
- make the UI responsive for different screen sizes

Prefer reusable class patterns through utilities in `global.css`. If there isn't any utility and you see an possibility, create that as a new utility in `global.css` by following BEM method.

## Avoid large inline styles unless required.

## NativeWind Rule

Use the NativeWind version already installed in this app.

Before implementing styling or NativeWind-related code:

- Check the current NativeWind version in `package.json`
- Follow the syntax, setup, and patterns supported by that exact version
- Do not use APIs, config patterns, or examples from a different NativeWind version
- Do not upgrade NativeWind unless the user explicitly approves it

Refer this for more info: https://www.nativewind.dev/v5/llms-full.txt

---

## Style Exception Rules

Use `StyleSheet` or inline styles for these React Native components/scenarios instead of NativeWind/tailwindcss classes:

| Component / Scenario           | Why                                                                                      | Use Instead                           |
| ------------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------- |
| **SafeAreaView**               | From `react-native` or `react-native-safe-area-context` — className not supported        | Inline styles or `StyleSheet`         |
| **Button**                     | Only supports `title` and `onPress` props — cannot customize background, border, padding | `TouchableOpacity` with custom styles |
| **KeyboardAvoidingView**       | Behavior props not supported by className                                                | Inline styles or `StyleSheet`         |
| **Modal**                      | `visible`, `transparent` props                                                           | Inline styles                         |
| **ScrollView**                 | `contentContainerStyle`, `indicatorStyle`                                                | `StyleSheet`                          |
| **TextInput**                  | Input-specific props like `underlineColorAndroid`                                        | Inline styles                         |
| **Animated.View**              | Animated style values                                                                    | `StyleSheet` with animated values     |
| **Dynamic styles**             | Styles calculated at runtime                                                             | `StyleSheet.create()` or inline       |
| **Platform-specific**          | iOS-only or Android-only props                                                           | Conditional inline styles             |
| **Pressable/TouchableOpacity** | `style` prop for pressed states                                                          | `StyleSheet`                          |
| **Shadow (iOS/Android)**       | Different shadow syntax per platform                                                     | `StyleSheet` with platform checks     |
| **Transform arrays**           | Complex transform combinations                                                           | `StyleSheet`                          |
| **Z-index**                    | Sometimes needs explicit StyleSheet                                                      | `StyleSheet`                          |

### When to Use StyleSheet

Use `StyleSheet` or inline styles when:

- The prop is React Native-specific (not web-equivalent)
- The value is dynamic/calculated at runtime
- Platform-specific behavior is needed
- NativeWind doesn't map the property to a style

### SafeAreaView Example

```tsx
// ✅ CORRECT - Use inline styles or StyleSheet
import { SafeAreaView } from "react-native-safe-area-context";

function MyScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* content */}
    </SafeAreaView>
  );
}

// ❌ INCORRECT - Do not use NativeWind/tailwindcss classes
function MyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">{/* content */}</SafeAreaView>
  );
}
```

And similar for above mentioned exception components. Otherwise, alaways stick to nativewind utilities.

---

## UI Quality Bar

The app should feel:

- premium minimalist
- polished
- friendly
- mobile-first
- visually close to the provided design references

Use:

- rounded cards
- soft shadows
- clear spacing
- progress indicators
- friendly empty states
- large touch targets
- simple animations when useful

---

## Image Rule

Use centralized image imports.

Before using any image asset:

1. Check if `constants/images.ts` exists.
2. If it does not exist, create it.
3. Import and export all app images from `constants/images.ts`.
4. Use images through the centralized object.

Example:

```ts
import foodPlaceholder from "@/assets/images/food-placeholder.png";

export const images = {
  foodPlaceholder,
};
```

Use images like this,

```tsx
<Image source={images.foodPlaceholder} />
```

Do not require/import image assets directly inside screens or components unless there is a reason.

---

## data/

Use this for hardcoded localized default database items (like list of activities and standard MET scores).

Example:

```txt
data/
  activities.ts
  localRecipes.ts
```

Content should be typed.

---

## store/

Use Zustand stores here.

Use Zustand for:

- selected language (ar/en)
- current trial state (true/false)
- local unsynced logs (food_logs, water_logs, workout_logs)
- cached profile data
- theme configuration settings

Use AsyncStorage persistence where needed.

---

## lib/

Use this for external service helpers.

Examples:

```txt
lib/
  clerk.ts
  supabase.ts
  api.ts
  cn.ts
```

Never expose secret keys in the mobile app.

---

## State Management Rules

Use Zustand for global client state.

Use local state for temporary UI state.

Persist using AsyncStorage when needed.

---

## TypeScript Rules

Use TypeScript strictly.

Avoid `any` where possible.

Keep types simple and readable.

---

## Feature Implementation Rules

When the user asks to build a feature:

1. Read this file first.
2. Identify files to change.
3. Keep changes focused.
4. Do not rewrite unrelated code.
5. Follow existing patterns.
6. Ensure feature works end-to-end.
7. Fix errors before finishing.

---

## AI / Supabase / Edge Functions Rules

Use Supabase Edge Functions for:

- Gemini API sessions (NLP parsing, vision scanning, recipe generator)
- Deno PDFKit report rendering
- Barcode database synchronizations

Never expose secrets in the frontend.

---

## Clerk Auth Rules

Use Clerk for user authentication.

Do not build custom auth logic.

---

## Code Simplicity Rules

Avoid overengineering.

Refactor only when needed.

---

## Component Creation Rule

Only create reusable components when necessary.

Ask if unsure.

---

## Linting and Validation

Run:

```bash
npm run lint
npm run typecheck
```

Fix errors.

---

## Communication Style

Be concise.

Explain what changed and how to test.

---

## Important Constraints

- Use Zustand for state
- Use AsyncStorage for local trial persistence
- Use Clerk for authentication
- Use Supabase Edge Functions only for secure, secret-key backend operations
- NativeWind tailwind css is preferred strictly for styling, adhering to exceptions where native layout styles require StyleSheet.

---

## Final Reminder

Before every feature implementation:

- Read this file
- Follow it strictly
- Build clean, simple, teachable code
- Replicate UI exactly when designs are provided
