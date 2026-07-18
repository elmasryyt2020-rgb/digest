import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
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
