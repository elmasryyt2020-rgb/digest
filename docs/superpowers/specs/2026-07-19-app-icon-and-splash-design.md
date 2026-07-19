# Design Spec: Custom Splash Screen and Green Heart App Icon

We are replacing the generic Expo splash screen and app icons with custom assets featuring the green heart logo from the onboarding flow. We are also building a custom animated splash screen that serves as the premium transition into the app.

## Proposed Design

### 1. Centralized Image Assets
We will generate pixel-perfect PNG assets using a Python script with the `Pillow` library to draw a smooth, mathematically precise sage green heart (`#4C6E58`).

The assets will be saved to:
* `assets/images/icon.png`: 1024x1024 app icon with a solid `#F8F9F8` background and the sage green heart in the center.
* `assets/images/android-icon-foreground.png`: 1024x1024 transparent foreground with the sage green heart.
* `assets/images/splash-icon.png`: 1024x1024 transparent foreground with the sage green heart.
* `assets/images/favicon.png`: 48x48 icon for web.

### 2. Custom Animated Splash Screen (`app/index.tsx`)
We will move the current welcome screen from `app/index.tsx` to `app/welcome.tsx` and turn `app/index.tsx` into the custom splash screen.
* **Layout**: A clean, centered logo containing the green heart and the text "digest" in Outfit-Bold.
* **Theme**: Responsive to the user's theme (off-white `#F8F9F8` / `#101412`).
* **Animations**:
  * The green heart fades in and scales up smoothly from `0.3` to `1.0` using `react-native-reanimated`.
  * The text "digest" fades in right after.
* **Routing Logic**:
  * After the animation completes (approx. 1.2s), the screen reads the Zustand store state.
  * If the user is logged in and onboarded, it redirects to `/(tabs)`.
  * Otherwise, it redirects to `/welcome`.

### 3. Native Splash Screen Clean-up
To prevent any visual flash, we will configure the native splash screen in `app.json` to have a solid background matching the custom splash screen and hide it as early as possible in `app/_layout.tsx`.

## Verification Plan

* **Visual Check**: Run the app and observe the seamless transition from native splash to custom animated splash.
* **Functional Routing**: Verify that:
  * Signed-in + onboarded users land directly in the diary tab after the splash screen.
  * New users land on the welcome screen after the splash screen.
* **Build / Lint**: Run `npm run typecheck` and `npm run lint` to ensure no errors.
