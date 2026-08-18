import urllib.request
import json
import time

key = 'AIzaSyBd1V-BxD_eOR8_r-v0F90_gwq9PGiDFs4'
url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}'

systemPrompt = """You are a professional dietitian and sports nutritionist.
Create a personalized 4-meal daily nutrition plan containing: "breakfast", "lunch", "dinner", and "snack".

Biometric Profiles & Guidelines:
- Target Calories (per day): 2000 kcal
- Target Protein (per day): 150g
- Target Carbs (per day): 200g
- Target Fat (per day): 60g
- Diet Type Preference: classic
- Food Exclusions / Allergies: none
- Localized Style Priority: Egyptian/Middle Eastern
- Budget Tier: medium
- Allowed Staples: Flour, rice, pasta, fava beans, yellow lentils, chicken, frozen fish, cottage cheese, milk, fruit, vegetables, sunflower oil, tea, sugar, eggs, black honey, tahini.

Constraints:
1. The sum of calories and macros across the 4 meals must be close to the targets above.
2. Provide recipes that are realistic, healthy, and culinary-sound. Use the Allowed Staples primarily.
3. Every recipe must have descriptions and steps in BOTH English and Arabic.
4. For ingredients, provide english name (name_en) and arabic name (name_ar).
5. For each ingredient, estimate realistic nutrient values per 100g: "est_calories_per_100g", "est_protein_per_100g", "est_carbs_per_100g", "est_fat_per_100g".
6. Provide a search query 'unsplash_query' for food photography.

Return a raw JSON payload matching this exact schema:
{
  "breakfast": {
    "title_en": "Oatmeal Bowl",
    "title_ar": "شوفان بالحليب",
    "description_en": "Healthy oats with milk and honey",
    "description_ar": "شوفان صحي بالحليب والعسل",
    "ingredients": [
      {
        "name_en": "Oats",
        "name_ar": "شوفان",
        "weight_g": 60,
        "est_calories_per_100g": 389,
        "est_protein_per_100g": 16.9,
        "est_carbs_per_100g": 66.3,
        "est_fat_per_100g": 6.9
      }
    ],
    "steps_en": ["Cook oats with milk."],
    "steps_ar": ["اطبخ الشوفان مع الحليب."],
    "tags": ["Healthy", "High Protein"],
    "unsplash_query": "oatmeal bowl"
  },
  "lunch": { "title_en": "...", "title_ar": "...", "description_en": "...", "description_ar": "...", "ingredients": [], "steps_en": [], "steps_ar": [], "tags": [], "unsplash_query": "" },
  "dinner": { "title_en": "...", "title_ar": "...", "description_en": "...", "description_ar": "...", "ingredients": [], "steps_en": [], "steps_ar": [], "tags": [], "unsplash_query": "" },
  "snack": { "title_en": "...", "title_ar": "...", "description_en": "...", "description_ar": "...", "ingredients": [], "steps_en": [], "steps_ar": [], "tags": [], "unsplash_query": "" }
}
"""

payload = {
    'systemInstruction': {
        'role': 'system',
        'parts': [{'text': systemPrompt}]
    },
    'contents': [{'parts': [{'text': 'Generate the 4 meals JSON.'}]}],
    'generationConfig': {
        'responseMimeType': 'application/json',
        'thinkingConfig': {'thinkingBudget': 0}
    }
}

t0 = time.time()
print("Sending request to Gemini for 4 meals...")
req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        t1 = time.time()
        print(f"SUCCESS in {round(t1 - t0, 2)}s! Status: {resp.status}")
        data = json.loads(resp.read().decode('utf-8'))
        text = data['candidates'][0]['content']['parts'][0]['text']
        print(f"Generated text length: {len(text)} bytes")
        parsed = json.loads(text)
        print(f"Parsed meals: {list(parsed.keys())}")
except Exception as e:
    print("ERROR:", e)
