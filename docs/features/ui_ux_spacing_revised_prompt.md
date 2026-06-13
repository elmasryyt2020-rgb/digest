# Prompt: Onboarding Results Funnel, Spacing Audit & Pixel-Perfect UI Cleanups

Copy and paste this prompt to your UI/UX coding agent in a new chat session to implement the onboarding quiz flow, fix layout spacings, and align buttons pixel-perfectly.

---

```markdown
You are an expert React Native + Expo UI/UX and motion engineer. 
Your task is to refactor the onboarding flow, build an onboarding results funnel, clean up visual overlapping issues, and perform a complete spacing audit to deliver a pixel-perfect, premium light-themed mobile UI.

Before coding, you MUST:
1. Read the instructions in [AGENTS.md](file:///d:/digest/AGENTS.md)
2. Read the master specification [digest_design.md](file:///d:/digest/docs/digest_design.md)
3. Activate the "Taste" (design-taste-frontend) and "UI UX Pro Max" skills.
4. Focus strictly on the frontend UI, UX, and animations (mocking database/API calls locally).

---

### Part 1: Restructure Onboarding Flow (Onboarding-First Funnel & Results Preview)
We want to implement the "results funnel" onboarding experience (like Noom, BetterMe, or Eat This Much "Try our generator"):
1. **Welcome Screen:** The app starts on a clean Welcome Screen:
   - *Headline:* "digest: Eat smarter. Live better."
   - *Primary CTA Button:* "Get Started" (routes to Onboarding Quiz).
   - *Secondary Link:* "I already have an account / Log In" (routes to login).
2. **Onboarding Quiz (Steps 1 to 3):**
   - *Step 1:* User Name & Country (detects and highlights Egyptian/UK food recommendations).
   - *Step 2:* Biometrics (Gender selector, Year of birth, Height, Weight).
   - *Step 3:* Activity level & Goal selection.
3. **Loading Transition Screen ("Calculating Plan..."):**
   - A short, beautiful shim loading state: "Analyzing biometrics...", "Computing metabolic targets...", "Customizing local recipes..."
4. **Plan Results Screen (The Hook):**
   - Before signing up, display their calculated plan results:
     - Total Daily Calories target (e.g. "1,850 kcal") and Macro splits (Protein, Carbs, Fats targets visual badges).
     - Localized meal preview cards (showing 2-3 local food suggestions based on their selected country).
     - Predicted weight loss trajectory line graph over 8 weeks.
   - *Primary CTA Button:* "Claim My Plan & Start Tracking" (routes to Clerk Auth Screen).
5. **Clerk Sign Up & Main Dashboard Unlock:**
   - Sign Up screen with Email/Password inputs, and placeholder buttons for "Sign Up with Google" and "Sign Up with Apple".
   - Tapping Sign Up completes auth, saves the biometrics to Zustand, and unlocks the **Main Dashboard Tab**.

---

### Part 2: Layout Spacing, Button Alignments & Overlap Audits
We have audited the current screens and identified several spacing bugs that need fixing:

1. **Floating Gear Icon Overlap (CRITICAL):**
   - The settings gear icon is floating randomly in the bottom-right corner, overlapping the onboarding Next buttons (Steps 1 & 2) and the barcode scanner viewfinder window. 
   - **Fix:** Remove this floating gear icon entirely from the Onboarding and Barcode scanner screens. The settings/profile navigation trigger must reside ONLY in the Dashboard header or the Profile tab.
2. **Onboarding Input Alignments (Step 2):**
   - The "Year of Birth" text input is currently massive and stretched. It should match the standard rounded border input style of the Name field.
   - The "Height" and "Weight" inputs must be positioned side-by-side in a two-column row with clean, consistent horizontal spacing (`flex-row space-x-4` or `gap-4`). Ensure they are aligned horizontally and don't look squished.
3. **Bottom Navigation & Action Buttons:**
   - In Onboarding, the "Back" and "Next" buttons must be anchored in a clean bottom row with standard, equal margins and padding. Eliminate absolute positioning or overlapping borders.
   - Ensure the "Next" button uses our primary Sage Green color (`bg-[#4C6E58]`) and the "Back" button uses a clean, light-bordered or light-gray button design.
4. **Bento Card Balance (Dashboard):**
   - The Calorie Progress Ring card has excessive empty whitespace. Adjust the card padding (`p-5`) and vertically center the progress ring and macro labels.
   - The 2x2 grid cell containers for Breakfast, Lunch, Dinner, and Snacks must have equal height and spacing. The "+ Add Log" button should sit cleanly at the bottom using a `flex-1 justify-between` layout, preventing the "Not Logged Yet" text from looking squished at the top of the cell.
5. **Strict NativeWind Refactor:**
   - Remove all custom `StyleSheet.create` margins, paddings, and background colors that are causing layout breaks. Use NativeWind tailwind classes strictly. Only use inline styles for dynamic animated values or safe area contexts.

Verify the TypeScript code runs cleanly with:
`npm run typecheck`
```
