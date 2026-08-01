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

function calculateNutrientTargets(profile: {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: 'male' | 'female';
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
  health_goal: 'lose_weight' | 'maintain_weight' | 'gain_weight';
}) {
  const { weight_kg, height_cm, age, gender, activity_level, health_goal } = profile;

  // 1. Calculate BMR
  let bmr = 0;
  if (gender === 'male') {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  } else {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  }

  // 2. Active Multipliers (TDEE)
  const multipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
  };
  const tdee = bmr * multipliers[activity_level];

  // 3. Goal Adjustments
  let target_calories = tdee;
  if (health_goal === 'lose_weight') {
    target_calories = tdee - 500;
  } else if (health_goal === 'gain_weight') {
    target_calories = tdee + 300;
  }
  // Clamp calories to minimum safe level
  target_calories = Math.max(1200, Math.round(target_calories));

  // 4. Macro Targets
  const target_protein_g = Math.round(weight_kg * 2.0);
  const target_fat_g = Math.round((target_calories * 0.25) / 9);
  const protein_calories = target_protein_g * 4;
  const fat_calories = target_fat_g * 9;
  const remaining_calories = target_calories - (protein_calories + fat_calories);
  const target_carbs_g = Math.max(50, Math.round(remaining_calories / 4));
  const target_water_ml = Math.round((weight_kg * 35) / 250) * 250;

  return {
    target_calories,
    target_protein_g,
    target_carbs_g,
    target_fat_g,
    target_water_ml,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const geminiKey = Deno.env.get('GEMINI_API_KEY') || '';
    const usdaApiKey = Deno.env.get('USDA_API_KEY') || Deno.env.get('EXPO_PUBLIC_USDA_API_KEY') || 'DEMO_KEY';

    if (!supabaseUrl || !supabaseServiceKey || !geminiKey) {
      throw new Error('Missing environment keys on server');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
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

    if (!weight_kg || !height_cm || !age || !gender || !activity_level || !health_goal) {
      throw new Error('Missing required biometric details');
    }

    const targets = calculateNutrientTargets({
      weight_kg: Number(weight_kg),
      height_cm: Number(height_cm),
      age: Number(age),
      gender,
      activity_level,
      health_goal
    });

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

    const systemPrompt = `You are a professional dietitian and sports nutritionist.
Create a highly customized 7-day weekly meal plan containing: "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday".
Each day must have 4 meals: "breakfast", "lunch", "dinner", and "snack".

Biometric Profiles & Guidelines:
- Target Calories (per day): ${targets.target_calories} kcal
- Target Protein (per day): ${targets.target_protein_g}g
- Target Carbs (per day): ${targets.target_carbs_g}g
- Target Fat (per day): ${targets.target_fat_g}g
- Diet Type Preference: ${diet_type}
- Food Exclusions / Allergies: ${exclusions.join(', ') || 'none'}
- Localized Style Priority: ${country === 'EG' ? 'Egyptian/Middle Eastern' : 'British/Western'}
- Budget Tier: ${budget}
- Budget Limit: ${chosenGuide.limit}
- Allowed Staples: ${chosenGuide.staples}

Constraints:
1. Make sure the sum of calories and macros of the 4 meals each day is extremely close to the targets above.
2. Provide recipes that are realistic, healthy, and culinary-sound. Use the Allowed Staples primarily.
3. Every recipe must have descriptions and steps in BOTH English and Arabic.
4. For ingredients, provide both english name (name_en) and arabic name (name_ar).
5. For each ingredient, estimate realistic nutrient values per 100g: "est_calories_per_100g", "est_protein_per_100g", "est_carbs_per_100g", "est_fat_per_100g". These will be used for verification search.
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
            "name_en": "Oats",
            "name_ar": "شوفان",
            "weight_g": 50,
            "est_calories_per_100g": 389,
            "est_protein_per_100g": 16.9,
            "est_carbs_per_100g": 66.3,
            "est_fat_per_100g": 6.9
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
        "tags": ["Healthy"],
        "unsplash_query": "oatmeal bowl"
      },
      "lunch": { ... },
      "dinner": { ... },
      "snack": { ... }
    },
    "monday": { ... },
    "tuesday": { ... },
    "wednesday": { ... },
    "thursday": { ... },
    "friday": { ... },
    "saturday": { ... }
  }
}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            role: 'system',
            parts: [{ text: systemPrompt }],
          },
          contents: [{ parts: [{ text: 'Generate the meal plan JSON.' }] }],
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

    let parsedPlan;
    try {
      parsedPlan = JSON.parse(cleaned);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to parse meal plan: ${msg}`);
    }

    if (!parsedPlan || !parsedPlan.meals) {
      throw new Error('AI output is missing meals structure');
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const categories = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

    const uniqueIngredientsMap: Record<string, any> = {};
    for (const day of days) {
      if (!parsedPlan.meals[day]) throw new Error(`Missing day ${day}`);
      for (const cat of categories) {
        const meal = parsedPlan.meals[day][cat];
        if (!meal || !Array.isArray(meal.ingredients)) throw new Error(`Invalid ingredients in ${day} ${cat}`);
        for (const ing of meal.ingredients) {
          const nameEn = String(ing.name_en || 'Unknown Food');
          const normalized = nameEn.toLowerCase().trim();
          if (!uniqueIngredientsMap[normalized]) {
            uniqueIngredientsMap[normalized] = {
              name_en: nameEn,
              name_ar: String(ing.name_ar || nameEn),
              est_calories_per_100g: Number(ing.est_calories_per_100g ?? 0),
              est_protein_per_100g: Number(ing.est_protein_per_100g ?? 0),
              est_carbs_per_100g: Number(ing.est_carbs_per_100g ?? 0),
              est_fat_per_100g: Number(ing.est_fat_per_100g ?? 0)
            };
          }
        }
      }
    }

    const uniqueNormalizedNames = Object.keys(uniqueIngredientsMap);
    const groundedIngredients: Record<string, any> = {};

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
            const usdaRes = await fetch(usdaUrl);
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

    const finalMeals: Record<string, any> = {};
    const rawGroceryMap: Record<string, { name_ar: string; weight_g: number }> = {};

    for (const day of days) {
      finalMeals[day] = {};
      const dayMeals = parsedPlan.meals[day];
      if (!dayMeals) continue;

      for (const cat of categories) {
        const meal = dayMeals[cat];
        if (!meal) continue;

        let total_calories = 0;
        let total_protein_g = 0;
        let total_carbs_g = 0;
        let total_fat_g = 0;
        const finalIngredients = [];

        for (const ing of meal.ingredients || []) {
          const key = (ing.name_en || 'Unknown Food').toLowerCase().trim();
          const grounded = groundedIngredients[key] || {
            name_en: String(ing.name_en || 'Unknown Food'),
            name_ar: String(ing.name_ar || ing.name_en),
            calories_per_100g: Number(ing.est_calories_per_100g || 0),
            protein_per_100g: Number(ing.est_protein_per_100g || 0),
            carbs_per_100g: Number(ing.est_carbs_per_100g || 0),
            fat_per_100g: Number(ing.est_fat_per_100g || 0)
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

          // Consolidate grocery map
          if (rawGroceryMap[key]) {
            rawGroceryMap[key].weight_g += weight_g;
          } else {
            rawGroceryMap[key] = {
              name_ar: grounded.name_ar,
              weight_g,
            };
          }
        }

        finalMeals[day][cat] = {
          title_en: String(meal.title_en || `${cat} Recipe`),
          title_ar: String(meal.title_ar || `وصفة ${cat}`),
          description_en: String(meal.description_en || ''),
          description_ar: String(meal.description_ar || ''),
          ingredients: finalIngredients,
          steps_en: Array.isArray(meal.steps_en) ? meal.steps_en.map(String) : [],
          steps_ar: Array.isArray(meal.steps_ar) ? meal.steps_ar.map(String) : [],
          total_calories: Math.round(total_calories),
          total_protein_g: Math.round(total_protein_g * 10) / 10,
          total_carbs_g: Math.round(total_carbs_g * 10) / 10,
          total_fat_g: Math.round(total_fat_g * 10) / 10,
          image_url: meal.unsplash_query
            ? `https://source.unsplash.com/featured/?${encodeURIComponent(meal.unsplash_query)}`
            : `https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80`,
          tags: Array.isArray(meal.tags) ? meal.tags.map(String) : ['AI Generated'],
          category: cat,
        };
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
