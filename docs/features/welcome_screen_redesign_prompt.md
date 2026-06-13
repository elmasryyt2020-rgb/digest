# Prompt: Redesign Welcome / Get Started Screen & Visual Assets Creation

Copy and paste the prompt below to your UI/UX coding agent in a new chat session to redesign the splash/welcome screen to look premium, cohesive, and visually stunning.

---

```markdown
You are an expert React Native + Expo UI/UX and motion designer. 
Your task is to redesign the Welcome / Get Started screen (`app/index.tsx`) of "digest" to look premium, modern, and aligned with our health, food, and water tracking theme. 

Use the provided design references as visual inspiration:
1. **The 3D Clay Illustration Style (Grab App reference):** Friendly, high-quality 3D clay renders representing food, water, and fitness.
2. **Sleek Glassmorphism (Luna AI reference):** Glowing, floating 3D spheres, soft inner shadows, and frosted glass layers on a clean alabaster background.
3. **Floating Color Blobs (Lacunose reference):** Soft, ambient pastel colored circles with opacity in the background to create depth.

---

### Part 1: REDESIGN DIRECTIVES FOR `app/index.tsx`

1. **Replace the Plain Circles with a 3D Hero Asset:**
   - Remove the three plain gray overlapping circles from the background.
   - Replace them with a stunning, high-quality visual asset at the center-right of the screen. 
   - *Asset Visual:* A 3D clay-render style illustration of a healthy food bowl, an avocado, or a fresh water droplet floating with a soft, blurred drop shadow beneath it.
   - *Technical:* Place the generated asset image (e.g., `assets/images/welcome-hero.png`) in a container and position it elegantly behind or alongside the main text.

2. **Clean Up Overlaps:**
   - **CRITICAL:** Remove the floating blue settings gear icon from the Get Started screen entirely. It does not belong on this screen and breaks the visual hierarchy.

3. **Background & Depth:**
   - Keep the base background color `#F8F9F8` (Warm Alabaster).
   - Add 2-3 extremely soft, glowing background spots with high opacity/blur in pastels (Sage Green, Peach, and Slate Blue) to create a premium, three-dimensional depth (similar to Luna AI / Lacunose).

4. **Typography & CTAs:**
   - Headline: Keep the large Outfit font heading: "Find your daily / balance." with "/ balance" styled in a clean, italic font variant (`font-outfit-italic` or similar).
   - Primary CTA: Redesign the "Get started" button into a pill-shaped button with subtle vertical padding and a premium soft shadow (`shadow-md`). Ensure it wraps in a `pressto` spring animation layer.
   - Secondary link: Muted "Already have an account? Sign in" link aligned below.

---

### Part 2: GENERATING THE 3D ASSETS ("nano banana" / Clay Style)
To keep the entire app's visual system cohesive, generate and use high-end 3D clay-style assets. You can use an image generator or place these placeholders inside `/assets/images/` for:
- `welcome-hero.png`: A 3D clay render of a glowing green avocado resting on a warm background.
- `water-drop.png`: A clean, glossy 3D clay water droplet for the water logging screen.
- `plate-shimmer.png`: A stylized 3D clay plate and fork/knife asset for empty state placeholders.
- `fitness-weight.png`: A 3D clay dumbbell/weight asset for workouts.

All layout constraints, margins, and paddings must be implemented strictly using **NativeWind** Tailwind classes. Ensure the layout is fully responsive and centered on different mobile device viewports.
```
