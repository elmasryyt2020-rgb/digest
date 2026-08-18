# Design Spec: Budget-Based Weekly Meal Plan Tracker

## Goal Description
Introduce a budget selection step in the user onboarding funnel and allow users to manage their meal plans based on three budget tiers derived from Egyptian food basket prices (`سلة الغذاء.md`). 

The Supabase Edge Function `generate-meal-plan` will be updated to plan an entire 7-day week using ingredients from the chosen budget. The "My Plan" tab will feature a daily weekday tracker (Sunday-Saturday calendar bar), a weekly unified grocery list, a budget selector, grocery cost displays, and live recalculations with user alerts.

---

## User Review Required
No major architectural blockers are anticipated. The budget tiers are structured as follows:
- **Low Budget**: 600 EGP / month (~150 EGP / week)
- **Medium Budget**: 1000 EGP / month (~250 EGP / week)
- **High Budget**: 1400 EGP / month (~350 EGP / week)

---

## Proposed Changes

### Component 1: Zustand Store & Models

#### [MODIFY] [useDiaryStore.ts](file:///d:/digest/store/useDiaryStore.ts)
- Add `budget: 'low' | 'medium' | 'high'` to `UserProfile` state interface (defaults to `'medium'`).
- Update `MealPlan` and related types to store a weekly structured plan containing 7 days (`sunday` to `saturday`), each consisting of 4 meals (`breakfast`, `lunch`, `dinner`, `snack`).
- Modify `syncToSupabase` and `fetchFromSupabase` to handle weekly meal plan payloads correctly.

### Component 2: Onboarding Funnel

#### [MODIFY] [onboarding.tsx](file:///d:/digest/app/onboarding.tsx)
- Insert a new budget selection step before the loading screen.
- Adjust progressive step dots to handle 4 questionnaire steps (0: Body Details, 1: Goals & Activity, 2: Diet & Preferences, 3: Budget Details, 4: Calculations Loading).
- Pass the selected `budget` to the `generate-meal-plan` Supabase Edge Function call.

### Component 3: Supabase Edge Function

#### [MODIFY] [index.ts](file:///d:/digest/supabase/functions/generate-meal-plan/index.ts)
- Parse `budget` parameter in the request payload.
- Update the system prompt for Gemini 3.5 Flash to generate a 7-day plan (Sunday to Saturday) mapping to breakfast, lunch, dinner, and snack.
- Inject constraints derived from the Egyptian budget baskets:
  - **Low (600 EGP/mo, 150 EGP/wk)**: Staples (flour, rice, pasta, fava beans, yellow lentils, chicken/fish, cottage cheese, milk, fruit, vegetables, oil, tea, sugar).
  - **Medium (1000 EGP/mo, 250 EGP/wk)**: All Low items, plus eggs, black honey, tahini.
  - **High (1400 EGP/mo, 350 EGP/wk)**: All Medium items, plus ghee, halva, and imported beef.
- Optimize grounding pipeline: Collect all unique ingredients from all 28 generated meals, query `foods_cache` or USDA in parallel, and map back to meals.
- Compile and return a single consolidated weekly grocery list.

### Component 4: App Screen UIs

#### [MODIFY] [onboarding_results.tsx](file:///d:/digest/app/onboarding_results.tsx)
- Update results screen to preview Sunday's meals from the new weekly meal plan structure.

#### [MODIFY] [recipes.tsx](file:///d:/digest/app/(tabs)/recipes.tsx)
- Rebuild the "My Plan" tab interface:
  - Add a calendar selector bar at the top (Sunday to Saturday) to select the active weekday.
  - Show Breakfast, Lunch, Dinner, Snack for the active day.
  - Add a pill-segmented budget control (Low, Medium, High).
  - Changing budget will:
    1. Show a loading overlay.
    2. Call the Edge Function to generate the new budget plan.
    3. Update the Zustand store and Supabase.
    4. Fire an alert: "Meal plan successfully updated to [budget] budget!"
    5. Dismiss loading and re-render.
  - Display the weekly grocery list with a badge showing the cost per week:
    - Low: `Cost: 150 EGP / week`
    - Medium: `Cost: 250 EGP / week`
    - High: `Cost: 350 EGP / week`

---

## Verification Plan

### Automated Verification
- Run `npm run typecheck` to ensure type safety.
- Run `npm run lint` to confirm code style validity.

### Manual Verification
- Go through the onboarding flow and select "Low Budget". Confirm the generated plan loading progress finishes.
- Verify Sunday's meal plan preview loads correctly on the onboarding results screen.
- Verify the calendar day bar on the "My Plan" tab allows switching days (Sunday-Saturday) and displays different meals.
- Toggle between Low, Medium, and High budgets on the My Plan tab, ensuring the loading screen shows, the alert fires, and the grocery cost update badge matches the selected tier.
