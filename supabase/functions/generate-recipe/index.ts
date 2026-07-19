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
