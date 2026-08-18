import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callGemini(geminiKey: string, payload: any): Promise<any> {
  const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash'];
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

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    const geminiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set on Supabase.');
    }

    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ translation: '' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `You are a professional nutritionist and translator. Translate the following English food name or description to Arabic. Provide ONLY a clean, natural Arabic translation suitable for logging in a food diary app. Do not include markdown formatting, explanations, preamble, or punctuation.
Food Item: "${text}"`;

    const data = await callGemini(geminiKey, {
      contents: [{ parts: [{ text: prompt }] }],
    });

    const translation = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;

    return new Response(JSON.stringify({ translation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Translation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
