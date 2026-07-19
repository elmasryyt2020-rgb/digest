# Pantry Search & AI Recipe Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive pantry search with autocomplete suggestions from a local curated list of ~150 ingredients and a Supabase Edge Function to generate realistic healthy recipes using Gemini 3.5 Flash, verified against `foods_cache` macros.

**Architecture:** Create a local static dictionary of common ingredients. Add an autocomplete suggestions dropdown in the mobile app pantry view. Create a Supabase Edge Function `generate-recipe` that calls Gemini 3.5 Flash with structured output instructions, queries the `foods_cache` table to resolve verified macros per ingredient, computes precise recipe macros, and returns the grounded recipe.

**Tech Stack:** Expo, TypeScript, NativeWind, Zustand, Supabase client & Edge Functions, Deno.

---

### Task 1: Create Local Ingredients Dictionary File

**Files:**
- Create: `data/ingredients.ts`

- [ ] **Step 1: Write local ingredient database file**
  Create the dictionary of ~150 common foods with their English and Arabic names, categories, and emojis.
  Code for `data/ingredients.ts`:
  ```typescript
  export interface IngredientSuggestion {
    name_en: string;
    name_ar: string;
    category: 'proteins' | 'vegetables' | 'grains' | 'dairy' | 'oils_fats' | 'spices_herbs' | 'fruits' | 'other';
    icon: string;
  }

  export const ingredientSuggestions: IngredientSuggestion[] = [
    // Proteins
    { name_en: 'Chicken breast', name_ar: 'صدر دجاج', category: 'proteins', icon: '🍗' },
    { name_en: 'Fava beans', name_ar: 'فول مدمس', category: 'proteins', icon: '🌱' },
    { name_en: 'Eggs', name_ar: 'بيض', category: 'proteins', icon: '🥚' },
    { name_en: 'Lentils', name_ar: 'عدس', category: 'proteins', icon: '🥣' },
    { name_en: 'Beef', name_ar: 'لحم بقري', category: 'proteins', icon: '🥩' },
    { name_en: 'Salmon', name_ar: 'سلمون', category: 'proteins', icon: '🐟' },
    { name_en: 'Tuna', name_ar: 'تونة', category: 'proteins', icon: '🐟' },
    { name_en: 'Chickpeas', name_ar: 'حمص', category: 'proteins', icon: '🫘' },
    { name_en: 'Turkey', name_ar: 'ديك رومي', category: 'proteins', icon: '🦃' },
    { name_en: 'Shrimp', name_ar: 'جمبري', category: 'proteins', icon: '🍤' },

    // Vegetables
    { name_en: 'Zucchini', name_ar: 'كوسة', category: 'vegetables', icon: '🥒' },
    { name_en: 'Tomatoes', name_ar: 'طماطم', category: 'vegetables', icon: '🍅' },
    { name_en: 'Potatoes', name_ar: 'بطاطس', category: 'vegetables', icon: '🥔' },
    { name_en: 'Onions', name_ar: 'بصل', category: 'vegetables', icon: '🧅' },
    { name_en: 'Garlic', name_ar: 'ثوم', category: 'vegetables', icon: '🧄' },
    { name_en: 'Cucumber', name_ar: 'خيار', category: 'vegetables', icon: '🥒' },
    { name_en: 'Carrots', name_ar: 'جزر', category: 'vegetables', icon: '🥕' },
    { name_en: 'Bell pepper', name_ar: 'فلفل رومي', category: 'vegetables', icon: '🫑' },
    { name_en: 'Spinach', name_ar: 'سبانخ', category: 'vegetables', icon: '🥬' },
    { name_en: 'Eggplant', name_ar: 'باذنجان', category: 'vegetables', icon: '🍆' },
    { name_en: 'Lettuce', name_ar: 'خس', category: 'vegetables', icon: '🥬' },
    { name_en: 'Broccoli', name_ar: 'بروكلي', category: 'vegetables', icon: '🥦' },
    { name_en: 'Cauliflower', name_ar: 'قرنبيط', category: 'vegetables', icon: '🥦' },
    { name_en: 'Cabbage', name_ar: 'كرنب', category: 'vegetables', icon: '🥬' },
    { name_en: 'Okra', name_ar: 'بامية', category: 'vegetables', icon: '🌱' },
    { name_en: 'Mushrooms', name_ar: 'مشروم', category: 'vegetables', icon: '🍄' },

    // Grains
    { name_en: 'Rice', name_ar: 'أرز', category: 'grains', icon: '🍚' },
    { name_en: 'Macaroni', name_ar: 'معكرونة', category: 'grains', icon: '🍝' },
    { name_en: 'Oats', name_ar: 'شوفان', category: 'grains', icon: '🥣' },
    { name_en: 'Bread', name_ar: 'خبز', category: 'grains', icon: '🍞' },
    { name_en: 'Quinoa', name_ar: 'كينوا', category: 'grains', icon: '🌾' },

    // Dairy & Cheese
    { name_en: 'Cheese', name_ar: 'جبنة', category: 'dairy', icon: '🧀' },
    { name_en: 'Milk', name_ar: 'حليب', category: 'dairy', icon: '🥛' },
    { name_en: 'Yogurt', name_ar: 'زبادي', category: 'dairy', icon: '🥣' },
    { name_en: 'Butter', name_ar: 'زبدة', category: 'dairy', icon: '🧈' },

    // Oils & Fats
    { name_en: 'Olive oil', name_ar: 'زيت زيتون', category: 'oils_fats', icon: '🫒' },
    { name_en: 'Vegetable oil', name_ar: 'زيت نباتي', category: 'oils_fats', icon: '🫗' },
    { name_en: 'Peanut butter', name_ar: 'زبدة الفول السوداني', category: 'oils_fats', icon: '🥜' },

    // Fruits
    { name_en: 'Apple', name_ar: 'تفاح', category: 'fruits', icon: '🍎' },
    { name_en: 'Banana', name_ar: 'موز', category: 'fruits', icon: '🍌' },
    { name_en: 'Lemon', name_ar: 'ليمون', category: 'fruits', icon: '🍋' },
    { name_en: 'Berries', name_ar: 'توت', category: 'fruits', icon: '🍓' },
    { name_en: 'Dates', name_ar: 'بلح', category: 'fruits', icon: '🌴' },
    { name_en: 'Orange', name_ar: 'برتقال', category: '🍊' },

    // Spices & Herbs
    { name_en: 'Cumin', name_ar: 'كمون', category: 'spices_herbs', icon: '🧂' },
    { name_en: 'Coriander', name_ar: 'كزبرة', category: 'spices_herbs', icon: '🌿' },
    { name_en: 'Garlic powder', name_ar: 'ثوم بودرة', category: 'spices_herbs', icon: '🧂' },
    { name_en: 'Salt', name_ar: 'ملح', category: 'spices_herbs', icon: '🧂' },
    { name_en: 'Black pepper', name_ar: 'فلفل أسود', category: 'spices_herbs', icon: '🧂' },
  ];
  ```

- [ ] **Step 2: Commit files**
  ```bash
  git add data/ingredients.ts
  git commit -m "feat(pantry): add local ingredients list database"
  ```

---

### Task 2: Implement Pantry Autocomplete Search UI in recipes.tsx

**Files:**
- Modify: `app/(tabs)/recipes.tsx`

- [ ] **Step 1: Import ingredients list and update state**
  Replace lines 96-106 (the old `commonIngredients` list) with the imported `ingredientSuggestions` and build the autocomplete dropdown component in the render tree.
  Import code to add:
  ```typescript
  import { ingredientSuggestions, IngredientSuggestion } from '@/data/ingredients';
  ```
  State variables to add:
  ```typescript
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  ```

- [ ] **Step 2: Implement Search Suggestions Dropdown Overlay**
  Update the "Add custom ingredient" input block. When the user types, filter the `ingredientSuggestions` list for matches in English or Arabic. Show a dropdown below the text input.
  Example search logic:
  ```typescript
  const filteredSuggestions = searchQuery.trim()
    ? ingredientSuggestions.filter(item =>
        item.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name_ar.includes(searchQuery)
      ).slice(0, 5)
    : [];
  ```
  Dropdown Component UI: Render a floating card with options that can be tapped to toggle/select.

- [ ] **Step 3: Commit files**
  ```bash
  git add app/(tabs)/recipes.tsx
  git commit -m "feat(pantry): add autocomplete UI suggestions to recipes page"
  ```

---

### Task 3: Create the Supabase generate-recipe Edge Function

**Files:**
- Create: `supabase/functions/generate-recipe/index.ts`

- [ ] **Step 1: Write Deno Edge Function code**
  Create the folder `supabase/functions/generate-recipe/` and create `index.ts` in Deno format. It should query Gemini 3.5 Flash, parse the recipe JSON, lookup macros in the `foods_cache` table, and write fallback values if they do not exist.
  Code for `supabase/functions/generate-recipe/index.ts`:
  ```typescript
  import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
  import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  function stripFences(raw: string): string {
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    }
    return cleaned;
  }

  async function sha256Hex(input: string): Promise<string> {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  serve(async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('Missing Authorization header');
      const token = authHeader.replace('Bearer ', '');

      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      const geminiKey = Deno.env.get('GEMINI_API_KEY') || '';

      if (!supabaseUrl || !supabaseServiceKey || !geminiKey) {
        throw new Error('Missing environment keys on server');
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }

      const { ingredients, language, country, health_goal, diet_type, exclusions } = await req.json();
      if (!ingredients || !Array.isArray(ingredients) || ingredients.length < 2) {
        throw new Error('At least 2 ingredients are required');
      }

      const systemPrompt = `You are a professional chef and nutritionist. Generate a realistic, culinary-sound, healthy recipe using these available ingredients: ${ingredients.join(', ')}.
Preferences & Constraints:
- Country Preference: ${country || 'EG'}
- Health Goal: ${health_goal || 'maintain_weight'}
- Diet Type: ${diet_type || 'classic'}
- Exclusions: ${(exclusions || []).join(', ')}

Return a raw JSON payload matching this exact schema. Do not output markdown code fences or conversational text:
{
  "title_en": "Recipe name in English",
  "title_ar": "Recipe name in Arabic",
  "description_en": "Brief English description summarizing nutrition & health benefits",
  "description_ar": "Brief Arabic description summarizing nutrition & health benefits",
  "ingredients": [
    {
      "name_en": "Ingredient name in English (e.g. Chicken breast)",
      "name_ar": "Ingredient name in Arabic",
      "weight_g": Number - weight in grams,
      "est_calories_per_100g": Number - estimation of calories per 100g for macro verification fallback,
      "est_protein_per_100g": Number,
      "est_carbs_per_100g": Number,
      "est_fat_per_100g": Number
    }
  ],
  "steps_en": [
    "Step 1 in English",
    "Step 2 in English"
  ],
  "steps_ar": [
    "الخطوة الأولى بالعربية",
    "الخطوة الثانية بالعربية"
  ],
  "category": "lunch", // one of: breakfast, lunch, dinner, snack
  "tags": ["Healthy", "High Protein", "Low Carb"]
}`;

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
          }),
        }
      );

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
      }

      const geminiData = await geminiResponse.json();
      const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const cleaned = stripFences(rawText);
      const parsedRecipe = JSON.parse(cleaned);

      // Verify and enrich ingredients macros against foods_cache DB
      let total_calories = 0;
      let total_protein_g = 0;
      let total_carbs_g = 0;
      let total_fat_g = 0;
      const finalIngredients = [];

      for (const ing of parsedRecipe.ingredients) {
        const normalized = ing.name_en.toLowerCase().trim();
        const { data: cachedRows } = await supabase
          .from('foods_cache')
          .select('*')
          .ilike('name_en', normalized)
          .limit(1);

        let macroSource = null;
        if (cachedRows && cachedRows.length > 0) {
          macroSource = cachedRows[0];
        }

        let calories_per_100g = Number(ing.est_calories_per_100g || 0);
        let protein_per_100g = Number(ing.est_protein_per_100g || 0);
        let carbs_per_100g = Number(ing.est_carbs_per_100g || 0);
        let fat_per_100g = Number(ing.est_fat_per_100g || 0);

        if (macroSource) {
          calories_per_100g = Number(macroSource.calories_per_100g);
          protein_per_100g = Number(macroSource.protein_per_100g);
          carbs_per_100g = Number(macroSource.carbs_per_100g);
          fat_per_100g = Number(macroSource.fat_per_100g);
        } else {
          // Store fallback in DB
          const hash = await sha256Hex(`${normalized}|${calories_per_100g}|${protein_per_100g}|${carbs_per_100g}|${fat_per_100g}`);
          const id = `gemini:${hash}`;
          await supabase.from('foods_cache').upsert({
            id,
            name_en: ing.name_en,
            name_ar: ing.name_ar || ing.name_en,
            source: 'gemini',
            calories_per_100g,
            protein_per_100g,
            carbs_per_100g,
            fat_per_100g,
            micros: {},
          });
        }

        const weight_g = Number(ing.weight_g || 0);
        total_calories += (calories_per_100g / 100) * weight_g;
        total_protein_g += (protein_per_100g / 100) * weight_g;
        total_carbs_g += (carbs_per_100g / 100) * weight_g;
        total_fat_g += (fat_per_100g / 100) * weight_g;

        finalIngredients.push({
          name_en: ing.name_en,
          name_ar: ing.name_ar,
          weight_g,
        });
      }

      // Return the completed recipe object
      const generatedRecipe = {
        title_en: parsedRecipe.title_en,
        title_ar: parsedRecipe.title_ar,
        description_en: parsedRecipe.description_en,
        description_ar: parsedRecipe.description_ar,
        ingredients: finalIngredients,
        steps_en: parsedRecipe.steps_en,
        steps_ar: parsedRecipe.steps_ar,
        total_calories: Math.round(total_calories),
        total_protein_g: Math.round(total_protein_g * 10) / 10,
        total_carbs_g: Math.round(total_carbs_g * 10) / 10,
        total_fat_g: Math.round(total_fat_g * 10) / 10,
        image_url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80',
        country_origin: country || 'EG',
        category: parsedRecipe.category || 'lunch',
        tags: parsedRecipe.tags || ['AI Generated'],
      };

      return new Response(JSON.stringify(generatedRecipe), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error(err);
      return new Response(JSON.stringify({ error: err.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
  });
  ```

- [ ] **Step 2: Commit files**
  ```bash
  git add supabase/functions/generate-recipe/index.ts
  git commit -m "feat(pantry): add generate-recipe supabase edge function"
  ```

---

### Task 4: Connect Autocomplete Page to Real Edge Function API

**Files:**
- Modify: `app/(tabs)/recipes.tsx`

- [ ] **Step 1: Replace mock API implementation**
  In `recipes.tsx`, modify `handleGenerateRecipe` to call the newly created Edge Function `generate-recipe`.
  Replacement Code:
  ```typescript
  const handleGenerateRecipe = async () => {
    if (selectedIngredients.length < 2) return;

    const allowed = incrementRecipesCount();
    if (!allowed) return;

    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const { data, error } = await supabase.functions.invoke('generate-recipe', {
        body: {
          ingredients: selectedIngredients,
          language,
          country: userCountry,
          health_goal: profile?.health_goal,
          diet_type: profile?.diet_type,
          exclusions: profile?.exclusions,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (error || !data) {
        throw new Error(error?.message || 'Failed to generate recipe');
      }

      // Add to store generated list and navigate to detail page
      const recipeToSave: RecipeType = {
        ...data,
        id: `ai_${Date.now()}`, // Temporary prefix until database upserts it
      };
      
      const generated = addGeneratedRecipe(recipeToSave);
      router.push(`/recipes/${generated.id}` as any);
    } catch (err) {
      console.error('Error generating AI recipe:', err);
      alert(isRtl ? 'عذرًا، حدث خطأ أثناء ابتكار الوصفة.' : 'Error generating recipe. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  ```

- [ ] **Step 2: Commit files**
  ```bash
  git add app/(tabs)/recipes.tsx
  git commit -m "feat(pantry): link UI to real generate-recipe Edge Function"
  ```

---

### Task 5: Run Linting and Type Verification

- [ ] **Step 1: Verify TypeScript compiler**
  Run: `npm run typecheck`
  Expected: Success, no compilation errors in workspace.

- [ ] **Step 2: Verify Linting**
  Run: `npm run lint`
  Expected: Success, no code structure violations.
