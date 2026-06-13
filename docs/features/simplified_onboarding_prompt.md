# Prompt: Simplified Onboarding Funnel, 4-Meal Plan Teaser, & Meal Swap Bottom Sheet

Copy and paste this prompt to your UI/UX coding agent in a new chat session to implement the simplified onboarding, results preview, meal swap bottom sheet, auto-location check, and profile dietary preferences.

---

```markdown
You are an expert React Native + Expo UI/UX and motion engineer.
Your task is to refactor the onboarding flow and results screen of the **digest** app to make the onboarding fast, interactive, and aligned with competitors like Eat This Much and Cronometer, focusing on a 4-meal plan preview (Breakfast, Lunch, Dinner, Snack) with a interactive "Swap Meal" feature.

Before coding, you MUST:
1. Read the instructions in [AGENTS.md](file:///d:/digest/AGENTS.md)
2. Read the onboarding specification in [auth_profile.md](file:///d:/digest/docs/features/auth_profile.md)
3. Activate the "Taste" (design-taste-frontend) and "UI UX Pro Max" skills.
4. Focus strictly on the frontend UI, UX, and animations (mocking database/API calls locally).

---

### Part 1: Refactor Onboarding Questionnaire (`app/onboarding.tsx`)

Simplify the onboarding to **3 quick, interactive steps** plus a loading step. 
*   **Remove Inputs:** Do not ask for the user's name or country during onboarding.

1. **Step 1: Body Details:**
   - Gender selection cards (Male/Female) side-by-side.
   - Year of birth input box (numeric, rounded-2xl).
   - Height (cm) and Weight (kg) fields side-by-side in a clean row with equal spacing (`flex-row gap-4`).
2. **Step 2: Goals & Activity:**
   - Daily activity level selection list (Sedentary, Lightly Active, Moderately Active, Very Active).
   - Wellness goal selection list (Lose Weight, Maintain Weight, Gain Weight).
3. **Step 3: Diet & Preferences (New Screen):**
   - *Diet Type Grid:* Select one (Classic/Anything, Vegetarian, Vegan, Keto, Low Carb) displayed as clean cards with subtle borders.
   - *Common Exclusions Grid:* Multi-select checkboxes/tags (Gluten-Free, Dairy-Free, Nut-Free, Seafood-Free) styled with modern pastel toggles.
4. **Step 4: "Calculating Plan..." Loading Transition:**
   - Triggered on clicking "Calculate plan" in Step 3.
   - A short loading state showing: *"Analyzing biometrics...", "Detecting country from IP...", "Compiling custom meal plan..."* with a clean progress bar.
   - *Auto-Location logic:* Mocks location detection based on system locale/IP to determine country (EG or GB) and loads the corresponding regional recipe database automatically.

---

### Part 2: Refactor Results Screen (`app/onboarding_results.tsx`)

Redesign the results preview screen to showcase the daily 4-meal plan:

1. **Targets Summary & Trajectory:**
   - Keep the calculated Daily Calories target and Macro badges (Protein, Carbs, Fats).
   - Keep the predicted weight trajectory graph (SVG line curve).
2. **Daily 4-Meal Plan Preview (Breakfast, Lunch, Dinner, Snack):**
   - Render 4 clean cards, one for each meal type: **Breakfast, Lunch, Dinner, and Snack**.
   - Each card displays the meal name (e.g. *"Breakfast: Fava Beans & baked Falafel - 380 kcal"* or *"Lunch: Grilled Chicken Salad - 450 kcal"*) and estimated calorie/macros totals.
   - **The Lock Overlay:** Cover the detailed ingredients list, portion sizes, and step-by-step preparation steps on each card with a frosted glassmorphic overlay containing a lock icon.
   - **Quick Swap Button:** Next to each card title, render a `[Swap]` icon (loop/refresh icon). Tapping it triggers the **Meal Swap Bottom Sheet**.

---

### Part 3: Create Meal Swap Bottom Sheet (`components/MealSwapBottomSheet.tsx`)

Build a new component `MealSwapBottomSheet` which slides up from the bottom when `Swap` is pressed on a meal card:
- Displays 2 alternative meal card options matching their target calories and diet preferences.
- Includes a toggle checkbox: *"Exclude [ingredient] (e.g., Bread / Rice) from future plans"*.
- Checking it immediately updates the preference, swaps the meal on the results screen, and stores the exclusion in Zustand.

---

### Part 4: Add Profile Dietary Preferences (`app/(tabs)/profile.tsx`)

1. Add a **"Dietary Preferences"** row inside the Profile settings page.
2. Clicking it opens a screen/modal allowing users to:
   - Edit their Diet Type (Classic, Veg, etc.).
   - Edit their Excluded Ingredients / Allergies.
   - Add/remove disliked ingredients (e.g. Bread, Rice, Fish).
   - Edit skipped info like Name or Country.
3. Excluded foods list must sync to the Zustand store (`useDiaryStore.ts`).

---

### Part 5: Tech Rules & Styling
- Use **NativeWind** Tailwind classes strictly for all layouts and cards.
- Ensure all images are imported/exported through `constants/images.ts`.
- Verify the TypeScript build runs cleanly with `npm run typecheck`.
```
