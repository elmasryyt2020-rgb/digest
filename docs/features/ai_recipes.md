# Feature Specification: AI Recipe Generator & Localized Feed

This specification details the recipe recommendation feed, the "Refrigerator Inventory" generator mechanism, database caching to minimize Gemini API calls, and the Gemini 3.5 Flash recipe build prompt.

---

## 1. Localized Feed Priority

The app customizes the landing screen recommendations based on the user's `profiles.country` field.

```
If User Country == 'EG' (Egypt):
  1. Recommend: Ful Medames (High Fiber, Low Fat)
  2. Recommend: Koshary (High Carb, Post-Workout)
  3. Recommend: Shakshuka (High Protein, Low Carb)
  4. Recommend: Molokhia with Chicken (Clean Eating)

If User Country == 'GB' (United Kingdom):
  1. Recommend: Baked Beans on Toast (High Fiber)
  2. Recommend: Shepherd's Pie (Balanced Macro)
  3. Recommend: Porridge with Berries (High Carb, Low GI)
  4. Recommend: Grilled Salmon with Potatoes (High Omega-3)
```

Users can query foods outside their region via search filter tabs (e.g., "Middle Eastern", "European", "Asian", "Global").

---

## 2. The Refrigerator Inventory System

The UI features a dynamic pantry interface where users tap common ingredient tags or add custom text tags.
*   **Active Selection:** User inputs "Chicken breast, Zucchini, Olive oil, Tomatoes".
*   **Search Caching:** Before hitting Gemini, the edge function performs a database check.

```sql
-- Check if a recipe with these primary ingredients already exists in our generated catalog
SELECT id, title_en, title_ar, total_calories, total_protein_g, total_carbs_g, total_fat_g, image_url 
FROM public.generated_recipes 
WHERE ingredients::jsonb @> '[{"name_en": "chicken breast"}, {"name_en": "zucchini"}]'::jsonb
LIMIT 3;
```
If 3 matching recipes are found, the app serves them immediately, saving Gemini computation costs. If not, the system proceeds to execute `/build-recipe` Edge Function.

---

## 3. Gemini 3.5 Flash Recipe Generator System Prompt

### Prompt
```
You are a master culinary chef and professional sports dietitian.
You are given a list of raw ingredients: {ingredients_list}.
The user's preferred language is: {language} (either 'ar' or 'en').
The user's health goal is: {health_goal}.

Your task is to build a healthy, easy-to-follow recipe utilizing these ingredients.
1. The recipe must have instructions and names in BOTH English and Arabic.
2. Formulate step-by-step directions.
3. Compute the overall recipe calories, protein, carbs, and fats based on the component amounts used.
4. Output a search term ('unsplash_query') to retrieve a high-quality food photography image matching this dish from Unsplash (e.g. "grilled chicken salad").
5. Return a raw JSON payload conforming to the schema. Do not write markdown blocks or text preambles.

JSON Schema:
{
  "title_en": "String - English recipe title",
  "title_ar": "String - Arabic recipe title",
  "description_en": "String - English description",
  "description_ar": "String - Arabic description",
  "ingredients": [
    {
      "name_en": "String",
      "name_ar": "String",
      "weight_g": Number
    }
  ],
  "steps_en": [
    "Step 1...",
    "Step 2..."
  ],
  "steps_ar": [
    "الخطوة الأولى...",
    "الخطوة الثانية..."
  ],
  "total_calories": Number,
  "total_protein_g": Number,
  "total_carbs_g": Number,
  "total_fat_g": Number,
  "unsplash_query": "String"
}
```

---

## 4. UI Layout & Recipe Details Screen

When a recipe is selected:
1.  **Image Banner:** Fetches image using Unsplash Search API matching the `unsplash_query` (e.g., `https://images.unsplash.com/photo-...?auto=format&fit=crop&w=800&q=80`).
2.  **Interactive Macros Bento Grid:** Four pastel blocks for Calories, Protein, Carbs, Fats (using our custom colors from the design system).
3.  **Step-by-Step Easing Checklist:** A collapsible checklist for directions. Checking off steps changes the progress line color with custom easing dynamics.
4.  **Save to Meal Plan:** Pill-shaped CTA button "+ Add to Meal Plan" allows scheduling the dish to any weekday log.

---
*End of Specification. Next Spec: PDF Export Engine.*
