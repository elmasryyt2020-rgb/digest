# Welcome Screen Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Welcome / Get Started screen (`app/index.tsx`) to implement a transparent floating 3D hero with soft bobbing animations, ambient pastel background glows, minimal inline language switching, and elegant editorial typography.

**Architecture:** We will generate the 3D asset using `generate_image`, make its background transparent using a Python PIL script, and refactor the welcome screen to use absolute-positioned glow spots, clean minimal headers, and a Reanimated-controlled floating container with an active scaling drop shadow.

**Tech Stack:** Expo (React Native), NativeWind (Tailwind CSS), TypeScript, react-native-reanimated, Pillow (Python PIL library).

---

### Task 1: Generate Visual Asset

**Files:**
- Create: `scratch/welcome_hero_generated.png` (output of generator)

- [ ] **Step 1: Run image generator**

Invoke the `generate_image` tool with the following parameters:
- **Prompt:** `"A premium, high-quality 3D clay-render style illustration of a fresh healthy avocado and a cute green salad bowl, transparent background, soft lighting, pastel colors, isometric view, volumetric shadow below."`
- **ImageName:** `"welcome_hero_generated"`

Expected: Generates a high-quality PNG image saved under the artifacts/scratch folder.

---

### Task 2: Background Removal Post-processing

**Files:**
- Create: `scratch/remove_background.py`
- Modify: `assets/images/welcome-hero.png`

- [ ] **Step 1: Write Python background removal script**

Create the file `scratch/remove_background.py` to process the generated image, convert near-white/solid background pixels to fully transparent, and save it to the assets folder.

```python
import os
from PIL import Image, ImageFilter

def remove_background(input_path, output_path):
    print(f"Processing image: {input_path}")
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        return
        
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    newData = []
    # Identify background color. We inspect the top-left corner pixel.
    bg_color = datas[0]
    print(f"Detected background color (top-left pixel): {bg_color}")
    
    # We define tolerance for matching background color
    tolerance = 25
    
    for item in datas:
        # Check if the pixel is close to the background color (or near white/light grey)
        r_diff = abs(item[0] - bg_color[0])
        g_diff = abs(item[1] - bg_color[1])
        b_diff = abs(item[2] - bg_color[2])
        
        # Also remove any pixel that is very close to pure white (since it's a studio background)
        is_near_white = item[0] > 240 and item[1] > 240 and item[2] > 240
        
        if (r_diff < tolerance and g_diff < tolerance and b_diff < tolerance) or is_near_white:
            # Make pixel transparent
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    
    # Apply a gentle blur to the alpha channel to soften the edges (anti-aliasing)
    alpha = img.getchannel('A')
    alpha_blurred = alpha.filter(ImageFilter.GaussianBlur(1.0))
    img.putalpha(alpha_blurred)
    
    # Ensure directory exists and save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, "PNG")
    print(f"Saved transparent image to: {output_path}")

if __name__ == "__main__":
    # Path of the generated image in the app data/scratch or workspace scratch dir
    # We will locate the file and pass it here
    input_file = "C:/Users/CA/.gemini/antigravity/brain/0971ae03-785b-46e7-93d6-066c48657f1c/scratch/welcome_hero_generated.png"
    if not os.path.exists(input_file):
        # Check workspace scratch folder as fallback
        input_file = "d:/digest/scratch/welcome_hero_generated.png"
    
    output_file = "d:/digest/assets/images/welcome-hero.png"
    remove_background(input_file, output_file)
```

- [ ] **Step 2: Install Pillow library if not present**

Run: `pip install Pillow`
Expected: Pillow library successfully installed.

- [ ] **Step 3: Copy generated image to scratch if needed**

Make sure the generated image from Task 1 is copied to `d:/digest/scratch/welcome_hero_generated.png` if it isn't already there.
Expected: Image is available at the input path.

- [ ] **Step 4: Execute the Python script**

Run: `python d:/digest/scratch/remove_background.py`
Expected: Outputs "Saved transparent image to: d:/digest/assets/images/welcome-hero.png".

- [ ] **Step 5: Verify image exists**

Check that `d:/digest/assets/images/welcome-hero.png` exists and is a valid PNG.

---

### Task 3: Refactor Layout in `app/index.tsx`

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Replace hard-coded blobs with pastel ambient glows**

Modify the render content of `app/index.tsx` to use absolute-positioned glow views behind the content.
Change the container's return block to render:
```tsx
  return (
    <SafeAreaView style={styles.container}>
      {/* Ambient glassmorphic glowing spots */}
      <View style={styles.glowSage} />
      <View style={styles.glowPeach} />

      <View className="flex-1 px-8 justify-between pb-10 pt-4 relative z-10">
```

And define styles:
```tsx
  glowSage: {
    position: 'absolute',
    top: 50,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#E2ECD7',
    opacity: 0.15,
    ...Platform.select({
      web: {
        filter: 'blur(60px)',
      } as any,
    }),
  },
  glowPeach: {
    position: 'absolute',
    top: '35%',
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#E58C73',
    opacity: 0.1,
    ...Platform.select({
      web: {
        filter: 'blur(60px)',
      } as any,
    }),
  },
```

- [ ] **Step 2: Redesign the header language switcher**

Replace the old segmented control `styles.langSelector` with a minimal inline text switcher:
```tsx
          {/* Language minimal switcher */}
          <View className="flex-row items-center">
            <Pressable onPress={() => toggleLanguage('ar')} className="px-1 py-2">
              <Text className={`font-inter text-xs ${language === 'ar' ? 'font-outfit-bold text-text-primary' : 'text-text-muted opacity-50'}`}>
                عربي
              </Text>
            </Pressable>
            <Text className="text-text-muted mx-2 text-xs opacity-30">•</Text>
            <Pressable onPress={() => toggleLanguage('en')} className="px-1 py-2">
              <Text className={`font-inter text-xs ${language === 'en' ? 'font-outfit-bold text-text-primary' : 'text-text-muted opacity-50'}`}>
                EN
              </Text>
            </Pressable>
          </View>
```

- [ ] **Step 3: Implement asymmetric editorial typography**

Refactor the Title and Subtitle sections:
```tsx
        {/* Value Proposition */}
        <View style={[styles.textWrapper, isRtl && styles.rtlAlign]} className="px-2 mt-4">
          <Text className="font-outfit-bold text-[48px] leading-[52px] text-text-primary tracking-tighter mb-4">
            {t.titleLine1}{'\n'}/ <Text className="font-outfit-semibold italic text-accent-sage">{t.titleLine2}</Text>
          </Text>
          <Text className="font-inter text-base text-text-muted leading-relaxed max-w-[280px] my-4">
            {t.subtitle}
          </Text>
        </View>
```

- [ ] **Step 4: Update CTA button shadow**

Change the "Get started" button in `app/index.tsx` to look like a smooth, deep forest green pill with a matching soft shadow:
```tsx
        {/* CTA Actions */}
        <View className="w-full">
          <PresstoButton
            onPress={() => router.push('/onboarding')}
            style={styles.ctaButton}
            className="bg-accent-sage rounded-full py-5 items-center justify-center"
          >
            <Text className="text-white font-outfit-bold text-base tracking-wide">
              {t.getStarted}
            </Text>
          </PresstoButton>
```

Add the style definition for `ctaButton`:
```tsx
  ctaButton: {
    borderRadius: 9999,
    shadowColor: '#4C6E58',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
```

---

### Task 4: Add Floating Animation & Volumetric Shadow

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Import Reanimated components and hooks**

At the top of `app/index.tsx`, import the necessary Reanimated utilities:
```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
```

- [ ] **Step 2: Initialize translation shared value and continuous bobbing loop**

Inside the `WelcomeScreen` component:
```tsx
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-12, {
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1, // Infinite loops
      true // Reverse direction on repeat
    );
  }, []);
```

- [ ] **Step 3: Define animated styles for image and volumetric shadow**

Inside the `WelcomeScreen` component:
```tsx
  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedShadowStyle = useAnimatedStyle(() => {
    const scale = interpolate(translateY.value, [-12, 0], [0.85, 1.0], Extrapolate.CLAMP);
    const opacity = interpolate(translateY.value, [-12, 0], [0.04, 0.12], Extrapolate.CLAMP);
    return {
      transform: [{ scale }],
      opacity,
    };
  });
```

- [ ] **Step 4: Refactor the Hero container to render the floating image and shadow**

Replace `heroWrapper` inside `app/index.tsx`:
```tsx
        {/* Floating Transparent Hero */}
        <View style={styles.heroContainer}>
          {/* Bobbing Image Wrapper */}
          <Animated.View style={[styles.heroImageWrapper, animatedImageStyle]}>
            <Image
              source={images.welcomeHero}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </Animated.View>
          
          {/* Synchronized Volumetric Shadow */}
          <Animated.View style={[styles.volumetricShadow, animatedShadowStyle]} />
        </View>
```

Add the following style definitions in `StyleSheet.create`:
```tsx
  heroContainer: {
    height: '38%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 12,
  },
  heroImageWrapper: {
    width: '100%',
    height: '85%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  heroImage: {
    width: '90%',
    height: '100%',
  },
  volumetricShadow: {
    position: 'absolute',
    bottom: 0,
    width: 140,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#000000',
    zIndex: 1,
  },
```

---

### Task 5: Verify & Clean Up

**Files:**
- Modify: `app/index.tsx` (remove unused old styles)

- [ ] **Step 1: Remove old unused Styles**

In `app/index.tsx`, delete the unused style entries in `styles` left over from the refactor:
- Remove: `blob`, `blobSage`, `blobTerracotta`, `blobGold`, `langSelector`, `langBtn`, `langBtnActive`, `langText`, `langTextActive`, `heroWrapper`, `glowMint`, `glowTerracotta`, `bentoCard`.

- [ ] **Step 2: Run TypeScript Type Check**

Run: `npm run typecheck`
Expected: PASS with no compilation errors.

- [ ] **Step 3: Test on Simulator/Web**

Start the development server using: `npm run web` (or `npm run android` / `npm run ios`) and verify the UI aesthetics.
Expected:
- Avocado/salad floats smoothly up and down.
- Shadow shrinks and expands in opposite rhythm.
- Minimal `عربي  •  EN` switches correctly.
- Background displays soft pastel glows.
