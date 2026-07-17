# Prompt: Fix Profile Screen Spacing & Layout Audit

Copy and paste this prompt to your UI/UX coding agent in a new chat session to fix the spacing and alignment issues on the Profile Screen (`app/(tabs)/profile.tsx`).

---

```markdown
You are an expert React Native + Expo UI/UX developer.
The spacing on the Profile Screen (`app/(tabs)/profile.tsx`) is currently messed up. The layout looks cramped, and margins/paddings between components are inconsistent or failing to apply.

Your task is to audit and fix the spacing across the entire Profile screen.

### The Root Cause: NativeWind v4 `space-y-` Limitation
In NativeWind v4, `space-y-X` utilities compile to sibling selectors. These selectors often fail in React Native when:
1. direct children are conditionally rendered (e.g. `{showBiometrics && ...}`).
2. children are custom components (like `<SegmentedControl>` or `<AnimatedSwitch>`).
3. children are wrapped in custom button animation containers (like `<PresstoButton>`).

### Spacing Correction Plan:

1. **Replace `space-y-` with `gap-y-` (or Explicit Margins):**
   - In all container views currently using `space-y-2`, `space-y-3`, or `space-y-4` (e.g. lines 456, 496, 623, 649, 734, 790, 947), refactor them to use native Flexbox gaps: **`gap-y-2`**, **`gap-y-3`**, or **`gap-y-4`**.
   - React Native 0.85 supports flex gaps natively and renders them perfectly on all platforms, regardless of custom component boundaries or conditional rendering.

2. **Clean Up Card Spacings (`mb-5`):**
   - Ensure the outer cards (Header Card, PDF Export Panel, Targets Summary, Biometrics Settings, Dietary Preferences Button, Macro Ratios Button, Measurement Units, Reminders, App Settings, Help & Legal, Danger Zone) have consistent vertical spacing. Use **`mb-5`** consistently on all primary cards.
   - For lists of options inside the cards (like the Activity Level list and Health Goal list), replace `space-y-2` on the container view with **`gap-y-2`** to ensure clean gaps between touch targets.

3. **In-Card Paddings:**
   - Verify that all bento cards have consistent inner paddings: use **`p-5`** for standard cards and **`p-6`** for major highlighted cards (like the PDF export panel).

4. **Measurement Units Row Alignment:**
   - In the Measurement Units card, the rows displaying the text label on the left and the Segmented Control on the right feel squished.
   - Ensure the row containers have a flex layout (`flex-row justify-between items-center w-full`) and that there is adequate vertical padding or height on each row.

5. **Notification Toggles Layout:**
   - In the Reminders card, the row layout (`flex-row justify-between items-center`) needs proper vertical separation. Use **`gap-y-4`** on the container and ensure the label text does not wrap tightly.

6. **Danger Zone spacing:**
   - In the Danger Zone section, clean up the vertical gap between the three buttons (Clear Cache, Delete Account, Sign Out). Use **`gap-y-3`** on the container instead of `space-y-3` to ensure that even if "Sign Out" is conditionally rendered, the buttons are evenly spaced.

---

### Tech Rules
- Keep layouts fully responsive and handle RTL Arabic translations cleanly using the translations dictionary `t` already in `profile.tsx`.
- Styling must use **NativeWind** Tailwind classes strictly.
- Run `npm run typecheck` to verify that there are no type errors after making layout edits.
```
