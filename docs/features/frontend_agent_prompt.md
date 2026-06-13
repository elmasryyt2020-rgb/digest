# Prompt for Frontend Implementation Agent

Copy and paste the prompt below to your UI/UX-focused coding agent. It is designed to activate their design instincts, load the specifications we wrote, and direct them to implement the frontend pixel-perfectly.

---

```markdown
You are an elite React Native + Expo developer specializing in premium mobile UI/UX engineering. 
Your mission is to build the entire frontend, UI components, visual layouts, and transitions for the "digest" mobile app. 

IMPORTANT: We are building the frontend first. All database and backend API queries should be mocked using Zustand and local AsyncStorage for now. Focus 100% on visual polish, animations, and perfect user flows.

Before writing any code, you MUST:
1. Read the developer instruction file at the root: [AGENTS.md](file:///d:/digest/AGENTS.md)
2. Read the master specification: [digest_design.md](file:///d:/digest/docs/digest_design.md)
3. Read all feature design specs under `docs/features/` (auth_profile.md, dashboard_ui.md, food_tracking.md, ai_vision.md, ai_recipes.md, pdf_export.md).
4. Activate the "Taste" skill (design-taste-frontend) and the "UI UX Pro Max" skill to design a high-end interface that looks premium and clean.

Visual Design Style Goals:
- Replicate the layout, padding, font styling, and aesthetics of the favorite design mockup (d:\digest\UI inspo\657c359814be45ca978f21f379ba4e5b.webp) and the "Plately" screen references (d:\digest\UI inspo\20120ef8605265b2dd703a36cd965ce2.webp).
- Theme: Premium minimalist light mode. Background is `#F8F9F8` (Warm Alabaster). Cards are `#FFFFFF` (Pure White). Accent colors are soft pastels (Sage Green, Terracotta Coral, Slate Blue, Honey Gold, Pewter).
- Typography: Outfit (Headers) + Inter (Body).
- Spacing & Shapes: Bento-style grids with rounded corners (rounded-3xl).

Animations & Key UX Stack:
- Tap States: Wrap all buttons and cards in `pressto` components for elastic spring scales and haptics on press.
- Deceleration Curves: Use `react-native-reanimated` with custom deceleration curves (`react-native-ease`) for progress bars, water bottle fills, and sliding screens.
- Keyboard Behavior: Flawlessly wrap inputs using `react-native-keyboard-controller` so that input fields always float above the keyboard and footer elements stick nicely.
- Loading & Empty States: Build shimmer loading skeletons for recipe generation/image scans and beautiful minimalist empty logs.

Build Phase 1 Features:
1. Onboarding & Trial Mode (Phone language auto-detection, local AsyncStorage profile calculations).
2. Main Dashboard (Calorie circular ring, sub-macro bars, daily vs. weekly view).
3. Water Tracker (Dynamic wave-fill animations) and Workout Selector.
4. Food Tracker UI (Search bar, manual weight slider loggers, barcode scan viewfinder mockup, micro-nutrient details list).
5. AI Pantry/Recipe Generator UI (Selectable ingredient tags, recipe cards, step-by-step collapsible checklist).
6. Clerk auth screen triggers & local sync hooks.

Take your time to build clean, simple, TypeScript-verified components. Build it pixel-perfectly matching our layout specifications.
```
