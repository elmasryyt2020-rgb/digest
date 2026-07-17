# Prompt: Premium Profile Settings & Account Customizations

Copy and paste this prompt to your UI/UX coding agent in a new chat session to implement the comprehensive Profile screen setting sections, modals, sliders, and account control actions.

---

```markdown
You are an expert React Native + Expo UI/UX and motion designer.
Your task is to completely refactor and expand the Profile screen (`app/(tabs)/profile.tsx`) to match industry-standard best practices, implementing a premium, feature-rich set of configurations matching competitor health apps (MyFitnessPal, Cronometer).

Before coding, you MUST:
1. Read the instructions in [AGENTS.md](file:///d:/digest/AGENTS.md)
2. Read the Profile spec in [profile_settings.md](file:///d:/digest/docs/features/profile_settings.md)
3. Activate the "Taste" (design-taste-frontend) and "UI UX Pro Max" skills.
4. Focus strictly on the frontend UI, UX, and animations (mocking database/API calls locally).

---

### Step-by-Step Refactoring Tasks for `app/(tabs)/profile.tsx`

1. **User Profile Header & Avatar:**
   - Place a premium card at the top of the settings scroll.
   - Render a circular avatar container (displaying user initials e.g. "JD" or a clean default person icon) with name, email, and a premium sage-green account badge.
   - Show a subtext summary caption: *"Goal: Lose Weight · Target Weight: 70 kg"*.

2. **Goal Weight Input (Biometrics Section):**
   - Add a **Goal Weight** input field (numeric) inside the collapsible Biometrics settings section, styled consistently with Height/Weight fields.

3. **Macro Split Adjuster Modal:**
   - Create a button row in the profile settings called: **"Adjust Macro Ratios"**.
   - Clicking it opens a bottom sheet or modal:
     - Segmented selectors for presets: **Balanced** (40% C / 30% P / 30% F), **High Protein** (30% C / 40% P / 30% F), and **Keto** (10% C / 30% P / 60% F).
     - Include a **Custom** option showing numeric percentage inputs for Carbs, Protein, and Fats.
     - Add validation ensuring the sum of Custom percentages equals exactly 100%.
     - Tapping "Save" calculates the new targets (based on their daily target calories) and updates Zustand state.

4. **Measurement Units Toggle Section:**
   - Create a new settings card containing toggles for unit preferences:
     - *Weight:* `kg` vs. `lbs`
     - *Height:* `cm` vs. `ft/in`
     - *Water:* `ml` vs. `fl oz`
   - Use clean, segmented controls with slide animations when toggling. Store state in Zustand.

5. **Reminders & Push Notification Toggles:**
   - Create a settings card containing switch controls:
     - *Meal Reminders:* Toggle switch to enable notifications for log updates.
     - *Water Reminders:* Toggle switch to enable hydration logs.
     - *Workout Reminders:* Toggle switch for MET activity reminder.
   - Implement switches using standard React Native `Switch` components (or custom Tailwind-animated slider switches).

6. **Help & Legal Settings:**
   - Keep the Weekly PDF summary card.
   - Below it, add rows for:
     - `Help & FAQ` (opens a mock Q&A modal).
     - `Privacy Policy` & `Terms of Service` links.
     - App Version: `v1.0.0 (Build 42)`.

7. **Danger Zone & Account Management:**
   - Add a clean card styled in muted red outlines at the very bottom:
     - **Clear Local Cache:** Clears stored Zustand state and local logs (requires confirmation alert).
     - **Delete Account:** Opens a confirmation modal stating that deleting the account will erase all history, following App Store review guidelines.
     - **Sign Out:** Standard sign out button.

---

### Styling & Tech Rules
- Keep layouts fully responsive and handle RTL Arabic translations cleanly using the translations dictionary `t` already in `profile.tsx`.
- Styling must use **NativeWind** Tailwind classes strictly. Use StyleSheet only for animated values.
- Verify that the TypeScript build runs cleanly with `npm run typecheck`.
```
