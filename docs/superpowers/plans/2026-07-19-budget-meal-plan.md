# Budget-Based Weekly Meal Plan Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a budget selection questionnaire step in the onboarding flow, update the `generate-meal-plan` Supabase Edge Function to output a week-long meal plan fitting the Egypt 2026 budget baskets, and update the "My Plan" tab with a weekday calendar tracker, budget switcher, weekly grocery list, and weekly cost displays.

**Architecture:** 
1. Add `budget` field to `UserProfile` in Zustand `store/useDiaryStore.ts`.
2. Add step 3 (Budget Selection) to the `app/onboarding.tsx` flow and pass it to the Edge Function payload.
3. Update `supabase/functions/generate-meal-plan/index.ts` to parse the budget and query Gemini for a 7-day plan, using bulk foods caching/USDA lookups.
4. Render the day selector bar, segmented budget picker, weekly grocery panel, cost displays, and interactive budget re-generation on the My Plan tab in `app/(tabs)/recipes.tsx`.

**Tech Stack:**
- React Native / Expo (Expo Router)
- Zustand
- NativeWind (Tailwind CSS)
- Supabase Client & Edge Functions
- Gemini 3.5 Flash

---

### Task 1: Extend Zustand Store & Models

**Files:**
- Modify: [useDiaryStore.ts](file:///d:/digest/store/useDiaryStore.ts)

- [ ] **Step 1: Update type definitions for UserProfile and MealPlan**
  Modify the `UserProfile` interface to include the `budget` field, and redefine the `MealPlan` structure to represent a weekly meal plan layout:
  ```typescript
  export interface WeeklyMeals {
    sunday: { breakfast: MealPlanMeal; lunch: MealPlanMeal; dinner: MealPlanMeal; snack: MealPlanMeal };
    monday: { breakfast: MealPlanMeal; lunch: MealPlanMeal; dinner: MealPlanMeal; snack: MealPlanMeal };
    tuesday: { breakfast: MealPlanMeal; lunch: MealPlanMeal; dinner: MealPlanMeal; snack: MealPlanMeal };
    wednesday: { breakfast: MealPlanMeal; lunch: MealPlanMeal; dinner: MealPlanMeal; snack: MealPlanMeal };
    thursday: { breakfast: MealPlanMeal; lunch: MealPlanMeal; dinner: MealPlanMeal; snack: MealPlanMeal };
    friday: { breakfast: MealPlanMeal; lunch: MealPlanMeal; dinner: MealPlanMeal; snack: MealPlanMeal };
    saturday: { breakfast: MealPlanMeal; lunch: MealPlanMeal; dinner: MealPlanMeal; snack: MealPlanMeal };
  }

  export interface UserProfile {
    // ... existing fields ...
    budget?: 'low' | 'medium' | 'high';
  }

  export interface MealPlan {
    id?: string;
    title: string;
    meals: WeeklyMeals; // changed from breakfast/lunch/dinner/snack to WeeklyMeals
    grocery_list: { name_en: string; name_ar: string; weight_g: number }[];
    created_at?: string;
  }
  ```

- [ ] **Step 2: Add default budget value to state initialization**
  Update `initializeDefaultProfile` in `useDiaryStore.ts` to include `budget: 'medium'` in `defaultRawProfile`:
  ```typescript
  const defaultRawProfile: Omit<UserProfile, 'target_calories' | 'target_protein_g' | 'target_carbs_g' | 'target_fat_g' | 'target_water_ml'> = {
    // ... existing fields ...
    budget: 'medium',
  };
  ```

- [ ] **Step 3: Update `syncToSupabase` profile upsert**
  In the profile upsert section of `syncToSupabase` (around line 648), map the `budget` property so it is persisted:
  ```typescript
  const { error: profileErr } = await supabase.from('profiles').upsert({
    // ... existing mappings ...
    budget: profile.budget || 'medium',
  });
  ```

- [ ] **Step 4: Verify type correctness**
  Run compilation to verify there are no store-level syntax errors.
  Run: `npm run typecheck`
  Expected output: Pass (no errors in `useDiaryStore.ts`).

- [ ] **Step 5: Commit changes**
  ```bash
  git add store/useDiaryStore.ts
  git commit -m "store: extend UserProfile and MealPlan types for budget-based weekly meal plans"
  ```

---

### Task 2: Insert Budget Step into Onboarding Flow

**Files:**
- Modify: [onboarding.tsx](file:///d:/digest/app/onboarding.tsx)

- [ ] **Step 1: Extend Step States and Navigation**
  Extend `step` state from `0 | 1 | 2 | 3` to `0 | 1 | 2 | 3 | 4`. 
  `3` will be the new Budget Selection step, and `4` will represent the Calculations Loading step.
  Add `budget` local state defaulting to `'medium'`:
  ```typescript
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [budget, setBudget] = useState<'low' | 'medium' | 'high'>('medium');
  ```
  Update `handleStep2Next` to transition to step 3, and add `handleStep3Next` to transition to step 4:
  ```typescript
  const handleStep2Next = () => {
    setStep(3);
  };
  const handleStep3Next = () => {
    setStep(4);
  };
  ```

- [ ] **Step 2: Update the Simulation hook for step 4**
  Change the loading simulation `useEffect` to trigger when `step === 4` (previously `step === 3`):
  ```typescript
  useEffect(() => {
    if (step === 4) {
      // ... loading progress animation logic ...
  ```
  Pass the selected `budget` to the `supabase.functions.invoke('generate-meal-plan')` payload:
  ```typescript
  const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
    body: {
      gender,
      age: ageVal,
      weight_kg: weightVal,
      height_cm: heightVal,
      activity_level: activity,
      health_goal: goal,
      diet_type: dietType,
      exclusions,
      country: detectedCountry,
      budget, // Pass budget string to Edge Function
    }
  });
  ```
  And when setting the profile after generation:
  ```typescript
  setProfile({
    ...baseProfile,
    budget,
    target_calories: data.target_calories || targets.target_calories,
    // ...
  });
  ```

- [ ] **Step 3: Render Budget Step UI in onboarding template**
  Render the Budget Selection layout inside the main return block:
  ```tsx
  {step === 3 && (
    <OnboardShell
      step={3}
      ctaLabel="Calculate plan"
      onNext={handleStep3Next}
    >
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <Text className="font-outfit-semibold text-[11px] text-text-muted uppercase tracking-wider mb-2">
          Step 4 of 4 · Weekly Budget
        </Text>
        <Text className="font-outfit-bold text-3xl text-text-primary tracking-tight mb-3">
          Choose your grocery budget.
        </Text>
        <Text className="font-inter text-sm text-text-muted leading-relaxed mb-6">
          Choose a weekly grocery tier. The app plans nutritious meals using localized Egyptian market prices.
        </Text>

        <View className="gap-3">
          {[
            { id: 'low', label: 'Low Budget', desc: '600 EGP/month (~150 EGP/week)\nFocuses on staples, cottage cheese, eggs, pasta, lentils' },
            { id: 'medium', label: 'Medium Budget', desc: '1000 EGP/month (~250 EGP/week)\nAdds eggs, black honey, tahini, and more variety' },
            { id: 'high', label: 'High Budget', desc: '1400 EGP/month (~350 EGP/week)\nAdds ghee, imported beef, halva, and premium items' }
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setBudget(item.id as any)}
              className={`p-4 border rounded-2xl bg-bg-card flex-row justify-between items-center ${
                budget === item.id ? 'border-accent-sage bg-[#F3F6F3] dark:bg-[#1F2E25]' : 'border-border-muted'
              }`}
            >
              <View className="flex-1 pr-3">
                <Text className={`text-sm font-outfit-bold ${budget === item.id ? 'text-text-primary' : 'text-text-primary'}`}>
                  {item.label}
                </Text>
                <Text className="text-xs text-text-muted mt-1 leading-normal">
                  {item.desc}
                </Text>
              </View>
              <Ionicons
                name={budget === item.id ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={budget === item.id ? "#4C6E58" : "#8A9690"}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </OnboardShell>
  )}
  ```

- [ ] **Step 4: Update progressive dots shell step mappings**
  Update the loading step 4 rendering conditions (change `step === 3` to `step === 4` on lines 580 and in the onboarding progress dots at the top of the shell):
  ```tsx
  {/* Progressive step dots */}
  {Array.from({ length: 4 }).map((_, i) => (
    <View
      key={i}
      style={{
        height: 6,
        width: i === (step === 4 ? 3 : step) ? 20 : 6,
        // ...
  ```

- [ ] **Step 5: Verify typecheck passes**
  Run: `npm run typecheck`
  Expected: Pass.

- [ ] **Step 6: Commit changes**
  ```bash
  git add app/onboarding.tsx
  git commit -m "onboarding: integrate budget selection questionnaire step"
  ```

---

### Task 3: Update onboarding results preview

**Files:**
- Modify: [onboarding_results.tsx](file:///d:/digest/app/onboarding_results.tsx)

- [ ] **Step 1: Adapt results meals load selection to handle weekly model**
  Modify `useEffect` (around line 41) to pull from `activeMealPlan.meals.sunday` if it exists:
  ```typescript
  useEffect(() => {
    if (activeMealPlan && activeMealPlan.meals) {
      if ('sunday' in activeMealPlan.meals) {
        setSelectedMeals(activeMealPlan.meals.sunday);
      } else {
        setSelectedMeals(activeMealPlan.meals);
      }
      return;
    }
  ```
  Ensure swaps of recipes update active meal plan safely:
  ```typescript
  const handleSelectMeal = (recipe: RecipeType) => {
    setSelectedMeals((prev) => {
      const updated = {
        ...prev,
        [recipe.category]: recipe,
      };

      if (activeMealPlan) {
        const currentMeals = activeMealPlan.meals;
        const updatedMeals = 'sunday' in currentMeals ? {
          ...currentMeals,
          sunday: {
            ...currentMeals.sunday,
            [recipe.category]: recipe as any
          }
        } : {
          ...currentMeals,
          [recipe.category]: recipe as any
        };

        setActiveMealPlan({
          ...activeMealPlan,
          meals: updatedMeals as any
        });
      }
      return updated;
    });
  };
  ```

- [ ] **Step 2: Verify typecheck passes**
  Run: `npm run typecheck`
  Expected: Pass.

- [ ] **Step 3: Commit changes**
  ```bash
  git add app/onboarding_results.tsx
  git commit -m "onboarding: adapt results screen to support weekly meal plan structure"
  ```

---

### Task 4: Update the generate-meal-plan Edge Function

**Files:**
- Modify: [index.ts](file:///d:/digest/supabase/functions/generate-meal-plan/index.ts)

- [ ] **Step 1: Read budget and format System Prompt constraints**
  Update the handler to parse `budget` (defaulting to `'medium'`) and dynamically construct the budget guidelines:
  ```typescript
  const {
    gender,
    age,
    weight_kg,
    height_cm,
    activity_level,
    health_goal,
    diet_type = 'classic',
    exclusions = [],
    country = 'EG',
    budget = 'medium'
  } = body;
  ```
  Map the budget baskets for the prompt:
  ```typescript
  const budgetGuides = {
    low: {
      limit: "600 EGP/month (~150 EGP/week)",
      staples: "Flour, rice, pasta, fava beans, yellow lentils, chicken/fish (NO beef), cottage cheese, milk, fruit, vegetables, sunflower oil, tea, sugar."
    },
    medium: {
      limit: "1000 EGP/month (~250 EGP/week)",
      staples: "Flour, rice, pasta, fava beans, yellow lentils, chicken/fish, cottage cheese, milk, fruit, vegetables, sunflower oil, tea, sugar, eggs, black honey, tahini."
    },
    high: {
      limit: "1400 EGP/month (~350 EGP/week)",
      staples: "Flour, rice, pasta, fava beans, yellow lentils, chicken, imported beef, frozen fish, cottage cheese, milk, fruit, vegetables, ghee, sunflower oil, tahini, tea, sugar, black honey, halva."
    }
  };
  const chosenGuide = budgetGuides[budget as 'low' | 'medium' | 'high'] || budgetGuides.medium;
  ```

- [ ] **Step 2: Redefine the Prompt to request a 7-day plan**
  Rewrite the Gemini system prompt to return a JSON structure nested by day of the week:
  ```typescript
  const systemPrompt = `You are a professional dietitian and sports nutritionist.
Create a highly customized weekly 7-day meal plan consisting of the days: "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday".
For each day, provide 4 meals: "breakfast", "lunch", "dinner", and "snack".

Biometric Profiles & Guidelines:
- Target Calories: ${targets.target_calories} kcal / day
- Target Protein: ${targets.target_protein_g}g / day
- Target Carbs: ${targets.target_carbs_g}g / day
- Target Fat: ${targets.target_fat_g}g / day
- Diet Type Preference: ${diet_type}
- Food Exclusions / Allergies: ${exclusions.join(', ') || 'none'}
- Localized Style Priority: ${country === 'EG' ? 'Egyptian/Middle Eastern' : 'British/Western'}
- Grocery Budget Tier: ${budget} (${chosenGuide.limit})
- Mandatory Baskets Ingredients: ${chosenGuide.staples}

Constraints:
1. Every single day's total calories and macros must be close to the targets above.
2. The recipes across the week must primarily utilize the allowed ingredients matching the selected budget tier.
3. Every recipe must have descriptions and steps in BOTH English and Arabic.
4. For ingredients, provide both english name (name_en) and arabic name (name_ar).
5. For each ingredient, estimate realistic nutrient values per 100g: "est_calories_per_100g", "est_protein_per_100g", "est_carbs_per_100g", "est_fat_per_100g".
6. Provide a search query 'unsplash_query' for food photography images.

Return a raw JSON payload matching this exact schema. Do not output markdown code fences or conversational text:
{
  "meals": {
    "sunday": {
      "breakfast": {
        "title_en": "English breakfast title",
        "title_ar": "اسم الفطور بالعربية",
        "description_en": "English description",
        "description_ar": "وصف عربي",
        "ingredients": [
          {
            "name_en": "Ingredient name in English (e.g. Oats)",
            "name_ar": "اسم المكون بالعربية",
            "weight_g": 50,
            "est_calories_per_100g": 389,
            "est_protein_per_100g": 16.9,
            "est_carbs_per_100g": 66.3,
            "est_fat_per_100g": 6.9
          }
        ],
        "steps_en": ["Step 1", "Step 2"],
        "steps_ar": ["الخطوة 1", "الخطوة 2"],
        "tags": ["Healthy"],
        "unsplash_query": "oatmeal"
      },
      "lunch": { ... },
      "dinner": { ... },
      "snack": { ... }
    },
    "monday": { ... },
    ...
  }
}`;
  ```

- [ ] **Step 3: Update grounding to map over 7 days in bulk**
  Update the grounding loop to process all 7 days of weekly meals.
  To optimize database calls, gather all unique ingredients across the week, verify them from `foods_cache` or query USDA in parallel, and map the nutrition back.
  ```typescript
  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const categories = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

  // Gather unique ingredients
  const uniqueIngs = new Map<string, any>();
  for (const day of weekdays) {
    const dayMeals = parsedPlan.meals[day];
    if (!dayMeals) continue;
    for (const cat of categories) {
      const meal = dayMeals[cat];
      if (!meal || !Array.isArray(meal.ingredients)) continue;
      for (const ing of meal.ingredients) {
        if (!ing || !ing.name_en) continue;
        uniqueIngs.set(ing.name_en.toLowerCase().trim(), ing);
      }
    }
  }

  // Fetch grounding values in parallel/batches
  const groundedMap = new Map<string, any>();
  await Promise.all(Array.from(uniqueIngs.keys()).map(async (normalized) => {
    // 1. Check cache
    const { data: cachedRows } = await supabase
      .from('foods_cache')
      .select('*')
      .ilike('name_en', normalized)
      .limit(1);

    if (cachedRows && cachedRows.length > 0) {
      groundedMap.set(normalized, cachedRows[0]);
    } else {
      // 2. Query USDA
      let calories_per_100g = Number(uniqueIngs.get(normalized).est_calories_per_100g ?? 0);
      let protein_per_100g = Number(uniqueIngs.get(normalized).est_protein_per_100g ?? 0);
      let carbs_per_100g = Number(uniqueIngs.get(normalized).est_carbs_per_100g ?? 0);
      let fat_per_100g = Number(uniqueIngs.get(normalized).est_fat_per_100g ?? 0);
      let fdcId = null;

      try {
        const usdaUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(normalized)}&pageSize=1&api_key=${usdaApiKey}`;
        const usdaRes = await fetch(usdaUrl);
        if (usdaRes.ok) {
          const usdaData = await usdaRes.json();
          if (usdaData.foods && usdaData.foods.length > 0) {
            const food = usdaData.foods[0];
            fdcId = food.fdcId;
            const getNutrientVal = (id: number) => {
              const nut = food.foodNutrients?.find((n: any) => n.nutrientId === id || n.nutrientNumber === String(id));
              return nut ? Number(nut.value) : 0;
            };
            const usdaKcal = getNutrientVal(1008);
            if (usdaKcal > 0) {
              calories_per_100g = usdaKcal;
              protein_per_100g = getNutrientVal(1003);
              carbs_per_100g = getNutrientVal(1005);
              fat_per_100g = getNutrientVal(1004);
            }
          }
        }
      } catch (err) {
        console.error('USDA API lookup failed:', err);
      }

      const ingObject = {
        calories_per_100g,
        protein_per_100g,
        carbs_per_100g,
        fat_per_100g,
        name_en: uniqueIngs.get(normalized).name_en,
        name_ar: uniqueIngs.get(normalized).name_ar,
      };

      groundedMap.set(normalized, ingObject);

      // Write to foods_cache in background
      const cacheId = fdcId ? `usda:${fdcId}` : `gemini:${await sha256Hex(`${normalized}|${calories_per_100g}`)}`;
      await supabase.from('foods_cache').upsert({
        id: cacheId,
        name_en: ingObject.name_en,
        name_ar: ingObject.name_ar,
        source: fdcId ? 'usda' : 'gemini',
        calories_per_100g,
        protein_per_100g,
        carbs_per_100g,
        fat_per_100g,
        micros: {},
      });
    }
  }));

  // Re-map and ground all week meals
  const finalMeals: Record<string, any> = {};
  const rawGroceryMap: Record<string, { name_ar: string; weight_g: number }> = {};

  for (const day of weekdays) {
    finalMeals[day] = {};
    const dayMeals = parsedPlan.meals[day];
    
    for (const cat of categories) {
      const meal = dayMeals[cat];
      if (!meal) continue;
      
      let total_calories = 0;
      let total_protein_g = 0;
      let total_carbs_g = 0;
      let total_fat_g = 0;
      const finalIngredients = [];

      for (const ing of meal.ingredients) {
        const key = ing.name_en.toLowerCase().trim();
        const grounded = groundedMap.get(key) || ing;
        
        const weight_g = Number(ing.weight_g || 0);
        const calories = (Number(grounded.calories_per_100g || 0) / 100) * weight_g;
        const protein = (Number(grounded.protein_per_100g || 0) / 100) * weight_g;
        const carbs = (Number(grounded.carbs_per_100g || 0) / 100) * weight_g;
        const fat = (Number(grounded.fat_per_100g || 0) / 100) * weight_g;

        total_calories += calories;
        total_protein_g += protein;
        total_carbs_g += carbs;
        total_fat_g += fat;

        finalIngredients.push({
          name_en: grounded.name_en,
          name_ar: grounded.name_ar || ing.name_ar,
          weight_g,
          calories_per_100g: grounded.calories_per_100g,
          protein_per_100g: grounded.protein_per_100g,
          carbs_per_100g: grounded.carbs_per_100g,
          fat_per_100g: grounded.fat_per_100g,
        });

        // Consolidate grocery map
        if (rawGroceryMap[key]) {
          rawGroceryMap[key].weight_g += weight_g;
        } else {
          rawGroceryMap[key] = {
            name_ar: grounded.name_ar || ing.name_ar,
            weight_g,
          };
        }
      }

      finalMeals[day][cat] = {
        title_en: String(meal.title_en),
        title_ar: String(meal.title_ar),
        description_en: String(meal.description_en),
        description_ar: String(meal.description_ar),
        ingredients: finalIngredients,
        steps_en: meal.steps_en || [],
        steps_ar: meal.steps_ar || [],
        total_calories: Math.round(total_calories),
        total_protein_g: Math.round(total_protein_g * 10) / 10,
        total_carbs_g: Math.round(total_carbs_g * 10) / 10,
        total_fat_g: Math.round(total_fat_g * 10) / 10,
        image_url: `https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80`,
        tags: meal.tags || ['AI Generated'],
        category: cat,
      };
    }
  }

  const groceryList = Object.entries(rawGroceryMap).map(([name_en, data]) => ({
    name_en: name_en.charAt(0).toUpperCase() + name_en.slice(1),
    name_ar: data.name_ar,
    weight_g: Math.round(data.weight_g),
  }));
  ```

- [ ] **Step 4: Update the return response payload**
  Return the nested 7-day meal plan:
  ```typescript
  const responsePayload = {
    target_calories: targets.target_calories,
    target_protein_g: targets.target_protein_g,
    target_carbs_g: targets.target_carbs_g,
    target_fat_g: targets.target_fat_g,
    target_water_ml: targets.target_water_ml,
    meals: finalMeals, // WeeklyMeals
    grocery_list: groceryList,
  };
  ```

- [ ] **Step 5: Commit changes**
  ```bash
  git add supabase/functions/generate-meal-plan/index.ts
  git commit -m "edge-function: restructure meal plan prompt and response to generate budget-based weekly meal plans"
  ```

---

### Task 5: Implement My Plan Calendar & Budget UI

**Files:**
- Modify: [recipes.tsx](file:///d:/digest/app/(tabs)/recipes.tsx)

- [ ] **Step 1: Setup Local Weekday Tracking & Budget Generation Action**
  Inside `app/(tabs)/recipes.tsx`, define state hooks for the active weekday (defaults to today's weekday name) and loading states:
  ```typescript
  const weekdaysList = [
    { id: 'sunday', label_en: 'Sun', label_ar: 'الأحد' },
    { id: 'monday', label_en: 'Mon', label_ar: 'الإثنين' },
    { id: 'tuesday', label_en: 'Tue', label_ar: 'الثلاثاء' },
    { id: 'wednesday', label_en: 'Wed', label_ar: 'الأربعاء' },
    { id: 'thursday', label_en: 'Thu', label_ar: 'الخميس' },
    { id: 'friday', label_en: 'Fri', label_ar: 'الجمعة' },
    { id: 'saturday', label_en: 'Sat', label_ar: 'السبت' },
  ];
  
  // Get current weekday name in lowercase
  const getTodayWeekday = () => {
    const dayIndex = new Date().getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayIndex];
  };

  const [activeDay, setActiveDay] = useState<string>(getTodayWeekday());
  const [updatingBudget, setUpdatingBudget] = useState(false);
  const profile = useDiaryStore((state) => state.profile);
  const setProfile = useDiaryStore((state) => state.setProfile);
  ```
  Add a helper to trigger Edge Function update when changing budget:
  ```typescript
  const handleUpdateBudget = async (newBudget: 'low' | 'medium' | 'high') => {
    if (!profile) return;
    setUpdatingBudget(true);
    try {
      const currentYear = new Date().getFullYear();
      const ageVal = profile.age || 28;
      const birthYear = currentYear - ageVal;

      const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
        body: {
          gender: profile.gender,
          age: ageVal,
          weight_kg: profile.weight_kg,
          height_cm: profile.height_cm,
          activity_level: profile.activity_level,
          health_goal: profile.health_goal,
          diet_type: profile.diet_type,
          exclusions: profile.exclusions,
          country: profile.country,
          budget: newBudget,
        }
      });

      if (error || !data) {
        throw new Error(error?.message || 'Failed to update budget plan');
      }

      setProfile({
        budget: newBudget,
      });

      setActiveMealPlan({
        title: 'My Custom Plan',
        meals: data.meals,
        grocery_list: data.grocery_list,
      });

      // Sync updated store state to Supabase
      const sessionUser = (await supabase.auth.getUser()).data.user;
      if (sessionUser) {
        await useDiaryStore.getState().syncToSupabase(sessionUser.id);
      }

      Alert.alert(
        isRtl ? 'تم تحديث خطة الوجبات' : 'Meal Plan Updated',
        isRtl 
          ? `تم بنجاح تحديث وتوليد خطة الوجبات للميزانية ${newBudget === 'low' ? 'المنخفضة' : newBudget === 'medium' ? 'المتوسطة' : 'المرتفعة'}.`
          : `Your meal plan has been updated to the ${newBudget} budget successfully!`
      );
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        isRtl ? 'خطأ في التحديث' : 'Update Error',
        err.message || 'Failed to update plan'
      );
    } finally {
      setUpdatingBudget(false);
    }
  };
  ```

- [ ] **Step 2: Add full screen Loading overlay for live updates**
  Add a loading view layout showing when `updatingBudget` is true:
  ```tsx
  {updatingBudget && (
    <View className="absolute inset-0 z-50 bg-black/60 items-center justify-center">
      <View className="bg-bg-card p-6 rounded-3xl border border-border-muted items-center max-w-[280px]">
        <ActivityIndicator size="large" color="#4C6E58" className="mb-4" />
        <Text className="font-outfit-bold text-center text-text-primary text-sm">
          {isRtl ? 'جاري إعادة حساب الميزانية...' : 'Recalculating plan...'}
        </Text>
        <Text className="font-inter text-center text-text-muted text-xs mt-1">
          {isRtl ? 'يرجى الانتظار، جاري توليد خطة الأسبوع.' : 'Compiling weekly meal plan...'}
        </Text>
      </View>
    </View>
  )}
  ```

- [ ] **Step 3: Render weekday calendar row and budget segment selector**
  Rebuild the "My Plan" view in `recipes.tsx` inside the render section (lines 610-756):
  ```tsx
  {/* Segmented Budget Picker */}
  <View className="mb-4 bg-bg-card rounded-2xl border border-border-muted p-1 flex-row">
    {([
      { id: 'low', label_en: 'Low', label_ar: 'منخفضة' },
      { id: 'medium', label_en: 'Medium', label_ar: 'متوسطة' },
      { id: 'high', label_en: 'High', label_ar: 'مرتفعة' },
    ] as const).map((tier) => {
      const active = profile?.budget === tier.id;
      return (
        <TouchableOpacity
          key={tier.id}
          onPress={() => active ? null : handleUpdateBudget(tier.id)}
          className={`flex-1 py-2.5 rounded-xl items-center justify-center ${active ? 'bg-accent-sage' : ''}`}
        >
          <Text className={`text-xs font-outfit-bold ${active ? 'text-white' : 'text-text-muted'}`}>
            {isRtl ? tier.label_ar : tier.label_en}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>

  {/* Weekday Calendar Selector bar */}
  <View className="flex-row justify-between mb-6">
    {weekdaysList.map((day) => {
      const selected = activeDay === day.id;
      return (
        <TouchableOpacity
          key={day.id}
          onPress={() => setActiveDay(day.id)}
          className={`items-center justify-center p-2 rounded-2xl w-[13%] border ${
            selected 
              ? 'bg-[#EBF1ED] border-accent-sage dark:bg-[#1D2B22]' 
              : 'bg-bg-card border-border-muted'
          }`}
        >
          <Text className={`text-[10px] font-inter-semibold uppercase ${selected ? 'text-accent-sage' : 'text-text-muted'}`}>
            {isRtl ? day.label_ar.substring(0, 3) : day.label_en}
          </Text>
          <View className={`w-1.5 h-1.5 rounded-full mt-1.5 ${selected ? 'bg-accent-sage' : 'bg-transparent'}`} />
        </TouchableOpacity>
      );
    })}
  </View>
  ```

- [ ] **Step 4: Update Grocery List Cost display badge**
  Render the weekly cost breakdown based on selected budget next to the shopping list header:
  ```tsx
  {/* Unified Grocery List Panel */}
  {activeMealPlan.grocery_list && activeMealPlan.grocery_list.length > 0 && (
    <View className="bg-bg-card rounded-3xl border border-border-muted p-5 mb-6 shadow-sm">
      <View className={`flex-row justify-between items-center mb-3.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
          <Ionicons name="basket-outline" size={20} color={isDark ? '#5C856C' : '#4C6E58'} />
          <Text className={`font-outfit-bold text-sm text-text-primary ${isRtl ? 'mr-2' : 'ml-2'}`}>
            {isRtl ? 'قائمة البقالة الموحدة' : 'Unified Grocery List'}
          </Text>
        </View>
        <View className="bg-accent-mint px-2.5 py-1 rounded-full">
          <Text className="text-[10px] font-outfit-bold text-accent-sage">
            {profile?.budget === 'low' 
              ? (isRtl ? '١٥٠ جنيهاً / أسبوع' : '150 EGP / week') 
              : profile?.budget === 'high' 
                ? (isRtl ? '٣٥٠ جنيهاً / أسبوع' : '350 EGP / week') 
                : (isRtl ? '٢٥٠ جنيهاً / أسبوع' : '250 EGP / week')}
          </Text>
        </View>
      </View>
      {/* ... list map items ... */}
  ```

- [ ] **Step 5: Load active day's planned meals**
  Fetch meals dynamically from `activeMealPlan.meals[activeDay]`:
  ```typescript
  const dayMeals = 'sunday' in activeMealPlan.meals 
    ? activeMealPlan.meals[activeDay as keyof WeeklyMeals] 
    : activeMealPlan.meals; // Fallback to legacy daily schema if not weekly nested
  ```
  Map categories from `dayMeals[category]`.

- [ ] **Step 6: Verify typecheck passes**
  Run: `npm run typecheck`
  Expected: Pass.

- [ ] **Step 7: Commit changes**
  ```bash
  git add app/\(tabs\)/recipes.tsx
  git commit -m "recipes: build calendar day selectors, grocery cost badges, and budget toggles on the My Plan tab"
  ```

---

## Verification & Walkthrough Spec

- Run type checking and linting to guarantee code safety.
- Walk the user through a simulated run showing:
  - Onboarding questionnaire with budget options cards.
  - The weekly calendar day selector changing the rendered meal recipes.
  - Toggling the budget segment triggers the recalculation spinner and successful alert.
