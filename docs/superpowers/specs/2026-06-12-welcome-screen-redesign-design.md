# Welcome Screen Redesign Spec

This specification details the redesign of the Welcome / Get Started screen (`app/index.tsx`) in the **digest** mobile application. The goal is to replace the current boxy and unpolished layout with a premium, high-fidelity experience featuring organic glassmorphic glows, magazine-style typography, and smooth interactive animations.

---

## 1. Visual Asset Optimization

The boxy welcome hero image will be replaced with a premium 3D clay-render style illustration with a transparent background.

### Hero Image
- **File Path:** `assets/images/welcome-hero.png`
- **Source Prompt:**
  `A premium, high-quality 3D clay-render style illustration of a fresh healthy avocado and a cute green salad bowl, transparent background, soft lighting, pastel colors, isometric view, volumetric shadow below.`
- **Background Removal:** To ensure a clean, borderless transparency, the generated image will be post-processed using a Python PIL script (`scratch/remove_background.py`) that converts non-transparent/solid background colors into alpha transparency with soft edges.
- **Central Registry:** The asset will remain registered in [images.ts](file:///d:/digest/constants/images.ts) as `welcomeHero`.

---

## 2. Layout & UI Refactoring

The boxy elements will be removed and replaced with a clean, borderless, asymmetric editorial layout.

### Ambient Glow Background (Luna AI inspired)
- Replace the three hard-edged background circles (`styles.blobSage`, `styles.blobTerracotta`, `styles.blobGold`) with two large, highly blurred pastel spots positioned behind the content:
  - **Glow 1 (Pastel Sage Green):** Top-left, size `300`x`300`, rounded-full, `opacity-15`, color `#E2ECD7` or `#4C6E58`.
  - **Glow 2 (Pale Peach):** Middle-right, size `300`x`300`, rounded-full, `opacity-10`, color `#E58C73`.
  - **Blur Effect:** On web platforms, use standard CSS filter `filter: 'blur(60px)'`. On native platforms, simulate this using layered very low-opacity views.

### Clean Minimal Header
- Keep the `digest` logo and heart icon on the top left.
- Redesign the language switcher (`عربي / EN`) at the top right:
  - Remove borders, background cards, and padding.
  - Render as simple text: `عربي  •  EN` (separated by a bullet point).
  - **Active state:** Bold weight (`font-outfit-bold`) and primary text color (`text-text-primary`).
  - **Inactive state:** Regular weight (`font-inter`) and muted opacity (`text-text-muted opacity-50`).

### Editorial Typography
- **Title:** Increase size to `text-[48px]` and tighten the tracking/line-height (`tracking-tighter leading-none`). The `/ balance` portion will be styled with an italic font weight and accent brand green (`font-outfit-semibold italic text-accent-sage`).
- **Subtitle:** Wrap in comfortable vertical margins (`my-6`) and constrain the maximum width (`max-w-[280px]`) to present it elegantly.

### Premium Pill CTA Button
- Change the "Get started" button from a standard rounded box to a fully pill-shaped button (`rounded-full py-5 px-8 bg-accent-sage`).
- Wrap the button in the spring-action `PresstoButton` component.
- Add a soft drop shadow matching the green color (`#4C6E58`) for a premium colored-glow effect.

---

## 3. Interactive Floating Animation

To create a feeling of volumetric depth, the hero image will animate dynamically:

### Bobbing Animation
- We will define a shared value `translateY` starting at `0`.
- Using `react-native-reanimated`, we will animate `translateY` between `0` and `-12` continuously with a smooth sinusoidal easing and a duration of `3000ms`.

### Volumetric Drop Shadow
- A separate shadow `View` (styled as a blurred, semi-transparent dark oval) will be rendered directly below the hero image.
- The shadow's scale and opacity will be animated in reverse synchronization to the vertical bobbing:
  - When `translateY` goes to `-12` (image rises), the shadow scales down to `0.85` and its opacity fades to `0.04`.
  - When `translateY` goes to `0` (image sinks), the shadow scales up to `1.0` and its opacity increases to `0.12`.

---

## 4. Verification Plan

### Automated Checks
- Run `npm run typecheck` to verify that there are no TypeScript compile-time errors in the refactored code.

### Manual Verification
- Check the visual layout on web/mobile simulators to verify:
  - Seamless background transparency of the newly generated avocado/salad PNG.
  - Smooth vertical bobbing and synchronized shadow scaling.
  - Active indicator styling on the minimal `عربي  •  EN` language switcher.
  - Exact typography hierarchy matching the editorial style requirements.
