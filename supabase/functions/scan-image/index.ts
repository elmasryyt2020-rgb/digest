import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Vision system prompt. Verbatim from docs/features/ai_vision.md §2.
// Gemini recognizes meal components and returns a raw JSON payload with
// per-item macros and an anchor_point on a 0-100 coordinate scale.
const VISION_PROMPT = `You are an expert nutritional vision system. You analyze pictures of meals and detect all individual ingredients and food components.
Estimate the name, portion weight (in grams), and general location of each food component in the image.

For the coordinates:
Return an 'anchor_point' containing [x, y] coordinates representing the center of the food item on the image.
Use a scale of 0 to 100 where [0, 0] is the top-left corner and [100, 100] is the bottom-right corner. This allows the mobile app to render absolute positioned tags over the image.

Follow these strict rules:
1. Identify all recognizable foods.
2. Estimate the weight of each component in grams based on standard portion sizing visible in the image.
3. Translate names to both English ('name_en') and Arabic ('name_ar').
4. Compute standard macro values per 100g.
5. Identify the overall meal name and translate it to both English ('meal_name_en') and Arabic ('meal_name_ar').
6. Return a raw JSON payload conforming to the schema. Do not write markdown tags or preambles.

JSON Schema:
{
  "meal_name_en": "String - Overall English name of the meal (e.g. 'Beef Burger with Fries')",
  "meal_name_ar": "String - Overall Arabic name of the meal (e.g. 'برجر لحم مع بطاطس')",
  "detected_items": [
    {
      "name_en": "String - English food name",
      "name_ar": "String - Arabic food name",
      "amount_g": Number - Estimated weight of this component in grams,
      "anchor_point": [Number, Number], // [x, y] coordinates in 0-100 scale
      "calories_per_100g": Number,
      "protein_per_100g": Number,
      "carbs_per_100g": Number,
      "fat_per_100g": Number
    }
  ]
}`;

interface DetectedItem {
  name_en: string;
  name_ar: string;
  amount_g: number;
  anchor_point: [number, number];
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

interface EnrichedItem extends DetectedItem {
  id: string;
  source: string;
  micros: Record<string, number>;
}

/** Strip ```json ... ``` fences if Gemini wraps the payload in markdown. */
function stripFences(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  return cleaned;
}

/** Tiny SHA-256 -> hex so we can build a stable `gemini:<hash>` cache id. */
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Normalize a food name for cache matching (lowercase, trimmed, collapse spaces). */
function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const geminiKey = Deno.env.get('GEMINI_API_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or Service Role Key is not configured on the server');
    }
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set on Supabase');
    }

    // Service-role client: allowed to read the private `scans` bucket and to
    // upsert into `foods_cache`. We verify the caller's identity via getUser()
    // so the service role never escalates an anonymous request.
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Verify the caller's session token and resolve their uid.
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired authentication session' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const userId = user.id;

    // 2. Read + sanitize the image_path from the request body.
    let image_path = '';
    try {
      const body = await req.json();
      image_path = body?.image_path;
    } catch {
      throw new Error('Malformed or empty request body');
    }
    if (!image_path || typeof image_path !== 'string') {
      throw new Error('image_path is required and must be a string');
    }
    // Path must be scoped to the caller's own uid to prevent cross-user reads.
    if (!image_path.startsWith(`${userId}/`)) {
      return new Response(JSON.stringify({ error: 'Forbidden: image path must be owned by the caller' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // 3. Download the uploaded image bytes from the `scans` bucket.
    const { data: blob, error: dlError } = await supabase
      .storage
      .from('scans')
      .download(image_path);
    if (dlError || !blob) {
      throw new Error(`Failed to download scan image: ${dlError?.message ?? 'no data'}`);
    }

    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    // Build the full binary string first, then base64-encode in one pass.
    // Chunked btoa() breaks base64 padding at chunk boundaries.
    let binaryStr = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binaryStr += String.fromCharCode(...chunk);
    }
    const base64 = btoa(binaryStr);
    const mimeType = blob.type || 'image/jpeg';

    // 4. Call Gemini vision with the system prompt + inline image payload.
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: VISION_PROMPT },
              { inlineData: { mimeType, data: base64 } },
            ],
          }],
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    const rawText: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const cleaned = stripFences(rawText);

    let detected: DetectedItem[] = [];
    let mealNameEn = '';
    let mealNameAr = '';
    if (cleaned) {
      try {
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed?.detected_items)) {
          detected = parsed.detected_items.map((item: any) => {
            const anchor = Array.isArray(item.anchor_point) && item.anchor_point.length === 2
              ? [Number(item.anchor_point[0] ?? 0), Number(item.anchor_point[1] ?? 0)]
              : [0, 0];

            return {
              name_en: String(item.name_en || 'Unknown Food'),
              name_ar: String(item.name_ar || item.name_en || 'طعام غير معروف'),
              amount_g: Number(item.amount_g ?? 0),
              anchor_point: anchor as [number, number],
              calories_per_100g: Number(item.calories_per_100g ?? 0),
              protein_per_100g: Number(item.protein_per_100g ?? 0),
              carbs_per_100g: Number(item.carbs_per_100g ?? 0),
              fat_per_100g: Number(item.fat_per_100g ?? 0),
            };
          });
        }
        mealNameEn = String(parsed?.meal_name_en || '');
        mealNameAr = String(parsed?.meal_name_ar || '');
      } catch {
        console.warn('Could not parse Gemini JSON:', cleaned.slice(0, 200));
      }
    }

    // 5. Enrich each item against `foods_cache` (DB-overrides-Gemini).
    // On a name match, the database's verified macros + micros override
    // Gemini's estimates. On a miss, keep Gemini's numbers and write a
    // `gemini:<hash>` cache row so future scans + the food_logs FK resolve.
    const enriched: EnrichedItem[] = [];
    for (const item of detected) {
      const normalized = normalizeName(item.name_en || '');
      let matched: Record<string, unknown> | null = null;

      if (normalized) {
        const { data: rows } = await supabase
          .from('foods_cache')
          .select('*')
          .ilike('name_en', normalized)
          .limit(1);
        matched = (rows && rows.length > 0) ? rows[0] as Record<string, unknown> : null;
      }

      if (matched) {
        enriched.push({
          ...item,
          id: String(matched.id),
          source: String(matched.source ?? 'usda'),
          micros: (matched.micros as Record<string, number>) ?? {},
          calories_per_100g: Number(matched.calories_per_100g ?? item.calories_per_100g),
          protein_per_100g: Number(matched.protein_per_100g ?? item.protein_per_100g),
          carbs_per_100g: Number(matched.carbs_per_100g ?? item.carbs_per_100g),
          fat_per_100g: Number(matched.fat_per_100g ?? item.fat_per_100g),
        });
      } else {
        const hash = await sha256Hex(
          `${normalized}|${item.calories_per_100g}|${item.protein_per_100g}|${item.carbs_per_100g}|${item.fat_per_100g}`
        );
        const id = `gemini:${hash}`;
        const nameAr = item.name_ar || item.name_en;

        // Persist the AI-derived row so future scans + food_logs FK resolve.
        await supabase
          .from('foods_cache')
          .upsert({
            id,
            name_en: item.name_en,
            name_ar: nameAr,
            source: 'gemini',
            calories_per_100g: item.calories_per_100g,
            protein_per_100g: item.protein_per_100g,
            carbs_per_100g: item.carbs_per_100g,
            fat_per_100g: item.fat_per_100g,
            micros: {},
          });

        enriched.push({ ...item, id, source: 'gemini', micros: {} });
      }
    }

    return new Response(JSON.stringify({
      meal_name_en: mealNameEn,
      meal_name_ar: mealNameAr,
      detected_items: enriched,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Scan image error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
