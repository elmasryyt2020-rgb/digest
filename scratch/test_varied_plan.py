import urllib.request
import json
import time

key = 'AIzaSyBd1V-BxD_eOR8_r-v0F90_gwq9PGiDFs4'
url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}'

systemPrompt = """You are a professional dietitian and sports nutritionist.
Create a diverse pool of healthy recipes for a 7-day Egyptian meal plan matching these daily targets:
- Daily Calories: ~2000 kcal
- Daily Protein: ~150g
- Daily Carbs: ~200g
- Daily Fat: ~60g

Generate:
- 3 distinct breakfasts ("b1", "b2", "b3")
- 3 distinct lunches ("l1", "l2", "l3")
- 3 distinct dinners ("d1", "d2", "d3")
- 2 distinct snacks ("s1", "s2")

For each recipe, provide:
- title_en, title_ar, description_en, description_ar
- ingredients: [{ name_en, name_ar, weight_g, est_calories_per_100g, est_protein_per_100g, est_carbs_per_100g, est_fat_per_100g }]
- steps_en: [string], steps_ar: [string]
- tags: [string], unsplash_query: string

Also provide a 7-day meal schedule "schedule" assigning recipe IDs (b1..b3, l1..l3, d1..d3, s1..s2) for each day: "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday".

Return raw JSON:
{
  "recipes": {
    "b1": { "category": "breakfast", "title_en": "...", "title_ar": "...", "description_en": "...", "description_ar": "...", "ingredients": [...], "steps_en": [...], "steps_ar": [...], "tags": [...], "unsplash_query": "..." },
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
}"""

payload = {
    'systemInstruction': {
        'role': 'system',
        'parts': [{'text': systemPrompt}]
    },
    'contents': [{'parts': [{'text': 'Generate recipe pool and weekly schedule JSON.'}]}],
    'generationConfig': {
        'responseMimeType': 'application/json',
        'thinkingConfig': {'thinkingBudget': 0}
    }
}

t0 = time.time()
print("Sending recipe-pool prompt to Gemini...")
req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req, timeout=40) as resp:
        t1 = time.time()
        print(f"SUCCESS in {round(t1 - t0, 2)}s! Status: {resp.status}")
        data = json.loads(resp.read().decode('utf-8'))
        text = data['candidates'][0]['content']['parts'][0]['text']
        print(f"Generated text length: {len(text)} bytes")
        parsed = json.loads(text)
        print("Recipe keys:", list(parsed.get('recipes', {}).keys()))
        print("Schedule days:", list(parsed.get('schedule', {}).keys()))
except Exception as e:
    print("ERROR:", e)
