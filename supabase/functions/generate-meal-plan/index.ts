import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha256Hex(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function stripFences(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

async function callGemini(geminiKey: string, payload: any): Promise<any> {
  const models = ['gemini-flash-lite-latest', 'gemini-2.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-1.5-flash'];
  let lastError = '';
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        return await res.json();
      }
      const errText = await res.text();
      lastError = `${model}: ${res.status} - ${errText}`;
      console.warn(`Gemini model ${model} failed, trying fallback...`, lastError);
    } catch (e: any) {
      lastError = `${model}: ${e.message}`;
    }
  }
  throw new Error(`All Gemini models failed. Last error: ${lastError}`);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const geminiKey = Deno.env.get('GEMINI_API_KEY') || '';
    const usdaApiKey = Deno.env.get('USDA_API_KEY') || 'DEMO_KEY';

    if (!supabaseUrl || !supabaseServiceKey || !geminiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing environment keys on server' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const {
      gender = 'male',
      age = 25,
      weight_kg = 75,
      height_cm = 175,
      activity_level = 'sedentary',
      health_goal = 'lose_weight',
      diet_type = 'classic',
      exclusions = [],
      country = 'EG',
      budget = 'medium',
    } = body;

    // Calculate Mifflin-St Jeor targets
    const calculateTargets = (
      g: string,
      a: number,
      w: number,
      h: number,
      act: string,
      goal: string
    ) => {
      let bmr = 10 * w + 6.25 * h - 5 * a;
      if (g.toLowerCase() === 'female') {
        bmr -= 161;
      } else {
        bmr += 5;
      }

      let multiplier = 1.2;
      if (act === 'lightly_active') multiplier = 1.375;
      else if (act === 'moderately_active') multiplier = 1.55;
      else if (act === 'very_active') multiplier = 1.725;

      let tdee = Math.round(bmr * multiplier);

      let target_calories = tdee;
      if (goal === 'lose_weight') {
        target_calories = Math.max(1200, tdee - 500);
      } else if (goal === 'gain_weight') {
        target_calories = tdee + 300;
      }

      const target_protein_g = Math.round(w * 2.0);
      const fatCalories = target_calories * 0.25;
      const target_fat_g = Math.round(fatCalories / 9);
      const remainingCalories = target_calories - (target_protein_g * 4 + target_fat_g * 9);
      const target_carbs_g = Math.max(50, Math.round(remainingCalories / 4));
      const target_water_ml = Math.round((w * 35) / 250) * 250;

      return {
        target_calories,
        target_protein_g,
        target_carbs_g,
        target_fat_g,
        target_water_ml,
      };
    };

    const targets = calculateTargets(
      gender,
      Number(age),
      Number(weight_kg),
      Number(height_cm),
      activity_level,
      health_goal
    );

    const budgetGuides = {
      low: {
        limit: "600 EGP/month (~150 EGP/week)",
        staples: "Flour (دقيق), rice (ارز), pasta (مكرونة), fava beans (فول مدمس), yellow lentils (عدس أصفر), chicken (فراخ) or frozen fish (سمك مكرونة/ماكريل مجمد), cottage cheese (جبن قريش), milk (لبن), fruit (فاكهة), vegetables (خضراوات), sunflower oil (زيت عباد), tea (شاي), sugar (سكر)."
      },
      medium: {
        limit: "1000 EGP/month (~250 EGP/week)",
        staples: "Flour (دقيق), rice (ارز), pasta (مكرونة), fava beans (فول مدمس), yellow lentils (عدس أصفر), chicken (فراخ), frozen fish (سمك مكرونة/ماكريل مجمد), cottage cheese (جبن قريش), milk (لبن), fruit (فاكهة), vegetables (خضراوات), sunflower oil (زيت عباد), tea (شاي), sugar (سكر), eggs (بيض), black honey (عسل أسود), tahini (طحينة)."
      },
      high: {
        limit: "1400 EGP/month (~350 EGP/week)",
        staples: "Flour (دقيق), rice (ارز), pasta (مكرونة), fava beans (فول مدمس), yellow lentils (عدس أصفر), chicken (فراخ), imported beef (لحم مستورد), frozen fish (سمك مكرونة/ماكريل مجمد), cottage cheese (جبن قريش), milk (لبن), fruit (فاكهة), vegetables (خضراوات), ghee (سمن بلدي), sunflower oil (زيت عباد), tahini (طحينة), tea (شاي), sugar (سكر), black honey (عسل أسود), halva (حلاوة طحنية)."
      }
    };
    const chosenGuide = budgetGuides[budget as 'low' | 'medium' | 'high'] || budgetGuides.medium;

    const systemPrompt = `You are a professional sports nutritionist and dietitian.
Create a diverse pool of healthy recipes for a 7-day meal plan matching these daily targets:
- Daily Calories: ~${targets.target_calories} kcal
- Daily Protein: ~${targets.target_protein_g}g
- Daily Carbs: ~${targets.target_carbs_g}g
- Daily Fat: ~${targets.target_fat_g}g
- Diet Type: ${diet_type}
- Food Exclusions / Allergies: ${exclusions.join(', ') || 'none'}
- Localized Style Priority: ${country === 'EG' ? 'Egyptian/Middle Eastern' : 'British/Western'}
- Budget Limit: ${chosenGuide.limit}
- Allowed Staples: ${chosenGuide.staples}

Generate a recipe pool containing:
- 3 distinct breakfasts: "b1", "b2", "b3"
- 3 distinct lunches: "l1", "l2", "l3"
- 3 distinct dinners: "d1", "d2", "d3"
- 2 distinct snacks: "s1", "s2"

For each recipe, provide:
- "title_en": English title
- "title_ar": Arabic title
- "description_en": Short English description
- "description_ar": Short Arabic description
- "ingredients": Array of { "name_en": string, "name_ar": string, "weight_g": number, "est_calories_per_100g": number, "est_protein_per_100g": number, "est_carbs_per_100g": number, "est_fat_per_100g": number }
- "steps_en": Array of English steps
- "steps_ar": Array of Arabic steps
- "tags": Array of tags (e.g. ["High Protein", "Egyptian"])
- "unsplash_query": Search query for food photo

Also provide a weekly 7-day rotation schedule "schedule" distributing these recipes across "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday". Ensure adjacent days have different meals.

Return raw JSON strictly matching this schema:
{
  "recipes": {
    "b1": { "category": "breakfast", "title_en": "Oatmeal with Milk & Honey", "title_ar": "شوفان بالحليب والعسل", "description_en": "Warm nutritious oatmeal", "description_ar": "شوفان دافئ ومغذي", "ingredients": [{ "name_en": "Oats", "name_ar": "شوفان", "weight_g": 60, "est_calories_per_100g": 389, "est_protein_per_100g": 16.9, "est_carbs_per_100g": 66.3, "est_fat_per_100g": 6.9 }], "steps_en": ["Cook oats in warm milk."], "steps_ar": ["اطبخ الشوفان في الحليب الدافئ."], "tags": ["Healthy", "Breakfast"], "unsplash_query": "oatmeal bowl" },
    "b2": { ... },
    "b3": { ... },
    "l1": { "category": "lunch", ... },
    "l2": { ... },
    "l3": { ... },
    "d1": { "category": "dinner", ... },
    "d2": { ... },
    "d3": { ... },
    "s1": { "category": "snack", ... },
    "s2": { ... }
  },
  "schedule": {
    "sunday": { "breakfast": "b1", "lunch": "l1", "dinner": "d1", "snack": "s1" },
    "monday": { "breakfast": "b2", "lunch": "l2", "dinner": "d2", "snack": "s2" },
    "tuesday": { "breakfast": "b3", "lunch": "l3", "dinner": "d3", "snack": "s1" },
    "wednesday": { "breakfast": "b1", "lunch": "l2", "dinner": "d1", "snack": "s2" },
    "thursday": { "breakfast": "b2", "lunch": "l1", "dinner": "d3", "snack": "s1" },
    "friday": { "breakfast": "b3", "lunch": "l3", "dinner": "d2", "snack": "s2" },
    "saturday": { "breakfast": "b1", "lunch": "l2", "dinner": "d3", "snack": "s1" }
  }
}`;

    const geminiData = await callGemini(geminiKey, {
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }],
      },
      contents: [{ parts: [{ text: 'Generate recipe pool and weekly schedule JSON.' }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const cleaned = stripFences(rawText);

    let parsedOutput: any;
    try {
      parsedOutput = JSON.parse(cleaned);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to parse AI response: ${msg}`);
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const categories = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

    const recipesPool: Record<string, any> = parsedOutput.recipes || {};
    let schedule: Record<string, any> = parsedOutput.schedule || {};

    // Fallback if AI returned legacy meals structure directly
    if (parsedOutput.meals) {
      for (const day of days) {
        if (parsedOutput.meals[day]) {
          schedule[day] = {};
          for (const cat of categories) {
            const key = `${day}_${cat}`;
            recipesPool[key] = { ...parsedOutput.meals[day][cat], category: cat };
            schedule[day][cat] = key;
          }
        }
      }
    }

    // Ensure fallback schedule rotation if missing
    const breakfastKeys = Object.keys(recipesPool).filter((k) => recipesPool[k].category === 'breakfast' || k.startsWith('b'));
    const lunchKeys = Object.keys(recipesPool).filter((k) => recipesPool[k].category === 'lunch' || k.startsWith('l'));
    const dinnerKeys = Object.keys(recipesPool).filter((k) => recipesPool[k].category === 'dinner' || k.startsWith('d'));
    const snackKeys = Object.keys(recipesPool).filter((k) => recipesPool[k].category === 'snack' || k.startsWith('s'));

    days.forEach((day, idx) => {
      if (!schedule[day]) schedule[day] = {};
      if (!schedule[day].breakfast && breakfastKeys.length > 0) schedule[day].breakfast = breakfastKeys[idx % breakfastKeys.length];
      if (!schedule[day].lunch && lunchKeys.length > 0) schedule[day].lunch = lunchKeys[idx % lunchKeys.length];
      if (!schedule[day].dinner && dinnerKeys.length > 0) schedule[day].dinner = dinnerKeys[idx % dinnerKeys.length];
      if (!schedule[day].snack && snackKeys.length > 0) schedule[day].snack = snackKeys[idx % snackKeys.length];
    });

    // Collect all unique ingredients across the recipe pool
    const uniqueIngredientsMap: Record<string, any> = {};
    for (const recipeKey of Object.keys(recipesPool)) {
      const recipe = recipesPool[recipeKey];
      if (!recipe || !Array.isArray(recipe.ingredients)) continue;
      for (const ing of recipe.ingredients) {
        const nameEn = String(ing.name_en || 'Unknown Food');
        const normalized = nameEn.toLowerCase().trim();
        if (!uniqueIngredientsMap[normalized]) {
          uniqueIngredientsMap[normalized] = {
            name_en: nameEn,
            name_ar: String(ing.name_ar || nameEn),
            est_calories_per_100g: Number(ing.est_calories_per_100g ?? 0),
            est_protein_per_100g: Number(ing.est_protein_per_100g ?? 0),
            est_carbs_per_100g: Number(ing.est_carbs_per_100g ?? 0),
            est_fat_per_100g: Number(ing.est_fat_per_100g ?? 0),
          };
        }
      }
    }

    const uniqueNormalizedNames = Object.keys(uniqueIngredientsMap);
    const groundedIngredients: Record<string, any> = {};

    // Ground unique ingredients against DB cache / USDA
    await Promise.all(
      uniqueNormalizedNames.map(async (normalized) => {
        const ing = uniqueIngredientsMap[normalized];
        let calories_per_100g = ing.est_calories_per_100g;
        let protein_per_100g = ing.est_protein_per_100g;
        let carbs_per_100g = ing.est_carbs_per_100g;
        let fat_per_100g = ing.est_fat_per_100g;

        const { data: cachedRows } = await supabase
          .from('foods_cache')
          .select('*')
          .ilike('name_en', normalized)
          .order('source', { ascending: false })
          .limit(1);

        let fdcId = null;
        if (cachedRows && cachedRows.length > 0) {
          const row = cachedRows[0];
          calories_per_100g = Number(row.calories_per_100g);
          protein_per_100g = Number(row.protein_per_100g);
          carbs_per_100g = Number(row.carbs_per_100g);
          fat_per_100g = Number(row.fat_per_100g);
        } else {
          try {
            const usdaUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(normalized)}&pageSize=1&api_key=${usdaApiKey}`;
            const usdaRes = await fetch(usdaUrl, { signal: AbortSignal.timeout(2500) });
            if (usdaRes.ok) {
              const usdaData = await usdaRes.json();
              if (usdaData.foods && usdaData.foods.length > 0) {
                const food = usdaData.foods[0];
                fdcId = food.fdcId;
                const getNut = (id: number) => food.foodNutrients?.find((n: any) => n.nutrientId === id || n.nutrientNumber === String(id))?.value || 0;
                const kcal = getNut(1008);
                if (kcal > 0) {
                  calories_per_100g = Number(kcal);
                  protein_per_100g = Number(getNut(1003));
                  carbs_per_100g = Number(getNut(1005));
                  fat_per_100g = Number(getNut(1004));
                }
              }
            }
          } catch (usdaErr) {
            console.error('USDA API lookup failed for', normalized, usdaErr);
          }

          const cacheId = fdcId ? `usda:${fdcId}` : `gemini:${await sha256Hex(`${normalized}|${calories_per_100g}|${protein_per_100g}|${carbs_per_100g}|${fat_per_100g}`)}`;
          const { error: upsertErr } = await supabase.from('foods_cache').upsert({
            id: cacheId,
            name_en: ing.name_en,
            name_ar: ing.name_ar,
            source: fdcId ? 'usda' : 'gemini',
            calories_per_100g,
            protein_per_100g,
            carbs_per_100g,
            fat_per_100g,
            micros: {},
          });
          if (upsertErr) {
            console.error(`Failed to upsert grounded ingredient ${ing.name_en} to foods_cache:`, upsertErr);
          }
        }

        groundedIngredients[normalized] = {
          name_en: ing.name_en,
          name_ar: ing.name_ar,
          calories_per_100g,
          protein_per_100g,
          carbs_per_100g,
          fat_per_100g,
        };
      })
    );

    // Calibrate all recipes in the pool with verified nutrition numbers
    const calibratedRecipes: Record<string, any> = {};
    for (const recipeKey of Object.keys(recipesPool)) {
      const rawRecipe = recipesPool[recipeKey];
      if (!rawRecipe) continue;

      let total_calories = 0;
      let total_protein_g = 0;
      let total_carbs_g = 0;
      let total_fat_g = 0;
      const finalIngredients = [];

      for (const ing of rawRecipe.ingredients || []) {
        const key = (ing.name_en || 'Unknown Food').toLowerCase().trim();
        const grounded = groundedIngredients[key] || {
          name_en: String(ing.name_en || 'Unknown Food'),
          name_ar: String(ing.name_ar || ing.name_en),
          calories_per_100g: Number(ing.est_calories_per_100g || 0),
          protein_per_100g: Number(ing.est_protein_per_100g || 0),
          carbs_per_100g: Number(ing.est_carbs_per_100g || 0),
          fat_per_100g: Number(ing.est_fat_per_100g || 0),
        };

        const weight_g = Number(ing.weight_g || 0);
        total_calories += (Number(grounded.calories_per_100g || 0) / 100) * weight_g;
        total_protein_g += (Number(grounded.protein_per_100g || 0) / 100) * weight_g;
        total_carbs_g += (Number(grounded.carbs_per_100g || 0) / 100) * weight_g;
        total_fat_g += (Number(grounded.fat_per_100g || 0) / 100) * weight_g;

        finalIngredients.push({
          name_en: grounded.name_en,
          name_ar: grounded.name_ar,
          weight_g,
          calories_per_100g: grounded.calories_per_100g,
          protein_per_100g: grounded.protein_per_100g,
          carbs_per_100g: grounded.carbs_per_100g,
          fat_per_100g: grounded.fat_per_100g,
        });
      }

      const cat = rawRecipe.category || 'lunch';
      calibratedRecipes[recipeKey] = {
        title_en: String(rawRecipe.title_en || 'Healthy Recipe'),
        title_ar: String(rawRecipe.title_ar || 'وصفة صحية'),
        description_en: String(rawRecipe.description_en || ''),
        description_ar: String(rawRecipe.description_ar || ''),
        ingredients: finalIngredients,
        steps_en: Array.isArray(rawRecipe.steps_en) ? rawRecipe.steps_en.map(String) : [],
        steps_ar: Array.isArray(rawRecipe.steps_ar) ? rawRecipe.steps_ar.map(String) : [],
        total_calories: Math.round(total_calories),
        total_protein_g: Math.round(total_protein_g * 10) / 10,
        total_carbs_g: Math.round(total_carbs_g * 10) / 10,
        total_fat_g: Math.round(total_fat_g * 10) / 10,
        image_url:
          cat === 'breakfast'
            ? 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80'
            : cat === 'lunch'
            ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
            : cat === 'dinner'
            ? 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80'
            : 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=600&q=80',
        tags: Array.isArray(rawRecipe.tags) ? rawRecipe.tags.map(String) : ['AI Generated'],
        category: cat,
      };
    }

    // Build final 7-day schedule with full calibrated meals & calculate total grocery list
    const finalMeals: Record<string, any> = {};
    const rawGroceryMap: Record<string, { name_ar: string; weight_g: number }> = {};

    for (const day of days) {
      finalMeals[day] = {};
      const daySchedule = schedule[day] || {};

      for (const cat of categories) {
        const recipeId = daySchedule[cat];
        let recipe = calibratedRecipes[recipeId];

        // Fallback to first available recipe in category if ID not found
        if (!recipe) {
          const fallbackKey = Object.keys(calibratedRecipes).find((k) => calibratedRecipes[k].category === cat);
          if (fallbackKey) recipe = calibratedRecipes[fallbackKey];
        }

        if (recipe) {
          finalMeals[day][cat] = { ...recipe, category: cat };

          // Aggregate into 7-day grocery list
          for (const ing of recipe.ingredients || []) {
            const key = ing.name_en.toLowerCase().trim();
            if (rawGroceryMap[key]) {
              rawGroceryMap[key].weight_g += ing.weight_g;
            } else {
              rawGroceryMap[key] = {
                name_ar: ing.name_ar,
                weight_g: ing.weight_g,
              };
            }
          }
        }
      }
    }

    const groceryList = Object.entries(rawGroceryMap).map(([name_en, data]) => ({
      name_en: name_en.charAt(0).toUpperCase() + name_en.slice(1),
      name_ar: data.name_ar,
      weight_g: Math.round(data.weight_g),
    }));

    const responsePayload = {
      target_calories: targets.target_calories,
      target_protein_g: targets.target_protein_g,
      target_carbs_g: targets.target_carbs_g,
      target_fat_g: targets.target_fat_g,
      target_water_ml: targets.target_water_ml,
      meals: finalMeals,
      grocery_list: groceryList,
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
