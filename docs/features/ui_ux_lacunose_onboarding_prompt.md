# Prompt: Lacunose-Inspired Onboarding Results Funnel & Pixel-Perfect Spacing Audit

Copy and paste this prompt to your UI/UX coding agent in a new chat session to implement the onboarding, plan results preview screen, Clerk signup gate, and spacing cleanups.

---

```markdown
You are an expert React Native + Expo UI/UX and motion engineer. 
Your task is to refactor the onboarding flow to use a Lacunose-inspired "Quiz-to-Results-Funnel" model, fix button spacing/alignment issues, remove layout overlaps, and perform a complete spacing audit using NativeWind.

Before coding, you MUST:
1. Read the instructions in [AGENTS.md](file:///d:/digest/AGENTS.md)
2. Read the master specification [digest_design.md](file:///d:/digest/docs/digest_design.md)
3. Activate the "Taste" (design-taste-frontend) and "UI UX Pro Max" skills.
4. Focus strictly on the frontend UI, UX, and animations (mocking database/API calls locally).

---

### Part 1: Lacunose-Inspired Onboarding Results Funnel Flow
Rather than dropping the user straight onto the dashboard or signing them up immediately, implement the gated "results preview" onboarding funnel:

1. **Welcome Screen (`app/index.tsx`):**
   - Clean warm-alabaster base background (`bg-[#F8F9F8]`).
   - Visual detail: Render 3 soft ambient floating color blobs in the background with opacity (Sage Green, Honey Gold, Slate Blue) to create a premium textured feel.
   - Headline: Large, elegant Outfit font headings with italic styling: "Find your daily / balance."
   - CTAs: A single large, centered primary "Get started" button (`bg-[#4C6E58]`, `rounded-full`, `py-5`, `h-14`) and an underline link "Already have an account? Sign in" (routes to `/sign-in`).

2. **Onboarding Questionnaire (`app/onboarding.tsx`):**
   - Create a reusable `OnboardShell` component matching Lacunose's shell:
     - Header: A row showing progressive step dots (representing steps 0 to 3) and a "Skip" link on the right.
     - Content area for current step questions.
     - Footer: A single large primary "Next" button at the bottom of the screen with spring animations (`pressto`).
     - **CRITICAL:** Remove any floating settings gear icon from the onboarding screens. Actions must sit only in the bottom CTA row.
   - **Step 0: Identity & Country Preference:**
     - Text input for user's name (rounded-2xl, standard styling).
     - Country selection row cards (Egypt / UK) for localized recipe priorities.
   - **Step 1: Biometrics:**
     - Gender selection selector cards (Male/Female) side-by-side.
     - Year of birth input box (must match the rounded-2xl style of Step 0).
     - Height (cm) and Weight (kg) fields side-by-side in a clean row with a 16px spacing gap (`flex-row space-x-4` or `gap-4`). Ensure they are aligned horizontally and not squished.
   - **Step 2: Activity & Goals:**
     - List selectors for activity level and goal (lose/maintain/gain weight).
   - **Step 3: "Calculating Plan..." Loading Transition:**
     - Triggered on clicking "Next" in Step 2.
     - A beautiful, short shim loading state: "Analyzing biometrics...", "Computing BMR and metabolic rate...", "Selecting localized recipes..." with smooth progress bar fill.

3. **Plan Results Preview Screen (`app/onboarding_results.tsx` or inline Step 4):**
   - Triggered when the loader completes. Displays their calculated nutrition plan preview:
     - Calculated Daily Calories target (e.g. "1,850 kcal") and Macro badges (Protein, Carbs, Fats) styled with our sophisticated pastels.
     - Localized meal preview cards: Displays 2-3 local food suggestions based on their selected country (e.g. "Grilled Kofta & Baladi Bread" for Egypt, or "Oatmeal with Berries" for UK).
     - Predicted weight loss trajectory line graph (rendered using SVG curves/lines).
     - **The Lock Overlay:** Overlay a beautiful linear gradient at the bottom of the scroll view. Render a locked card:
       - *Lock icon + Title:* "More details waiting"
       - *Text:* "Sign up free to unlock your full health plan, interactive food diary, and grocery shopping list."
       - *Primary CTA:* "Sign up to reveal" (routes to Clerk `/sign-up` screen).

4. **Clerk Sign Up Stage (`app/sign-up.tsx`):**
   - Standard Clerk sign-up screen with email/pass and mock Google/Apple placeholders.
   - Upon completion, saves biometrics to Zustand, disables trial mode (`isTrial: false`), and routes to the **Main Dashboard Tab**.

---

### Part 2: Layout Spacing & Spacing Audit
Review the current screenshots and files, cleaning up these specific spacing bugs:
1. **Remove Gear Icon Overlaps:** The gear settings icon floats in the bottom-right corner, overlapping next buttons and barcode viewfinders. Remove it entirely from all screens except the Dashboard header and Profile tab.
2. **Dashboard Card Balance:** In `app/(tabs)/index.tsx`, the Calorie Progress Ring card has excessive whitespace. Adjust padding (`p-5`) and center the circular ring.
3. **Grid Cell Balancing:** The 2x2 grid cell categories (Breakfast, Lunch, Dinner, Snacks) must have equal heights and spacings. The "+ Add Log" button should sit cleanly at the bottom using a `flex-1 justify-between` layout, preventing the "Not Logged Yet" text from looking squished at the top of the cell.
4. **Strict NativeWind Refactor:** Remove all custom `StyleSheet.create` margins, paddings, and background colors that are causing layout breaks. Use NativeWind tailwind classes strictly. Only use inline styles for dynamic animated values or safe area contexts.

Verify the TypeScript code runs cleanly with:
`npm run typecheck`
```
