# Design Specification: AI Vision Scanner Meal Grouping

**Date:** 2026-07-19  
**Topic:** Unifying multiple detected food components from the AI Vision Scanner into a single, combined meal log entry with editable title and live macro calculations.

---

## 1. Project Overview & Architectural Shifts

Currently, the AI Vision Scanner analyzes an image and detects individual ingredients (e.g. Sesame Hamburger Bun, Mayonnaise, Cheddar Cheese, Beef Patty) as separate pins/bounding boxes. Tapping "+ Log to Diary" only logs the single selected component, forcing users to repeat the process or only log part of their meal.

This feature pivots the logging flow so that:
1.  **AI Meal Summarization:** The Edge Function asks Gemini to suggest a name for the overall meal (in English and Arabic).
2.  **Ingredient Checklists & Weights:** The user reviews the full list of detected items, toggling checkboxes and adjusting individual ingredient weights.
3.  **Aggregated Entry:** Tapping the primary Action button saves the entire meal as a single combined diary entry (e.g., "Beef Cheeseburger") with aggregated macro and micronutrient metrics.

---

## 2. API Specifications (Supabase Edge Function)

We will modify the system prompt and return schema of the `scan-image` Edge Function (`supabase/functions/scan-image/index.ts`).

### Gemini Prompt Changes
We add two root-level properties to the requested JSON response schema:
*   `meal_name_en`: "Suggested overall meal name in English"
*   `meal_name_ar`: "Suggested overall meal name in Arabic"

```json
{
  "meal_name_en": "String - Suggested overall meal name (e.g. Cheeseburger with Fries)",
  "meal_name_ar": "String - Suggested overall meal name in Arabic (e.g. برجر لحم بالجبن مع بطاطس)",
  "detected_items": [
    {
      "name_en": "String - English food name",
      "name_ar": "String - Arabic food name",
      "amount_g": Number - Estimated weight in grams,
      "anchor_point": [Number, Number], // [x, y] coordinates in 0-100 scale
      "calories_per_100g": Number,
      "protein_per_100g": Number,
      "carbs_per_100g": Number,
      "fat_per_100g": Number
    }
  ]
}
```

---

## 3. Client UI Specifications (`app/food/search.tsx`)

When the camera state is `detected`, the screen displays the backdrop image with absolute-positioned coordinate overlays, and a checkout sheet below it.

### UI Layout
*   **Meal Title Input:** An editable text input field prefilled with the AI-suggested meal name in the user's selected language.
*   **Scrollable Ingredients List:** Displays all identified ingredients:
    *   **Checkbox:** Let users include/exclude ingredients (default checked).
    *   **Weight Info:** Shows the current weight in grams.
    *   **Collapsible Adjuster:** Tapping an ingredient opens an inline selector to adjust its weight.
*   **Live Nutrient Summary Grid:** A Bento box showing the sum of calories and macros for all checked ingredients:
    *   `Calories`: $\sum (\text{calories\_per\_100g}_i \times \frac{w_i}{100})$
    *   `Protein`: $\sum (\text{protein\_per\_100g}_i \times \frac{w_i}{100})$
    *   `Carbs`: $\sum (\text{carbs\_per\_100g}_i \times \frac{w_i}{100})$
    *   `Fats`: $\sum (\text{fat\_per\_100g}_i \times \frac{w_i}{100})$
*   **Log Button:** A single unified button "+ Log Meal to Diary".

---

## 4. Grouping & Database Logging Pipeline

When logging, the client does the following:

1.  **Macro/Micro Aggregation:**
    *   Compute total checked weight $W = \sum w_i$.
    *   Compute total calories $C$, protein $P$, carbs $Carb$, fat $F$.
    *   Compute total micronutrient stats.
2.  **Database Cache Upsert:**
    *   Generate a unique ID: `scanned:${uuid()}`.
    *   Normalize macros and micros to per 100g (e.g. $\text{calories\_per\_100g} = \frac{C}{W} \times 100$).
    *   Upsert this scanned meal to the `foods_cache` table.
3.  **Add Diary Entry:**
    *   Create a single `food_logs` record with the custom meal name, total weight $W$, and aggregated macros/micros.
