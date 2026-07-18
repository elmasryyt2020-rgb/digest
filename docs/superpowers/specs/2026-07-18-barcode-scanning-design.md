# Barcode Scanning Implementation Design

**Date**: 2026-07-18  
**Feature**: Barcode Scanning  
**Status**: Approved

## Overview
Implement barcode scanning in the meal search screen using `expo-camera` (specifically the modern `<CameraView>`). The system will lookup barcodes locally first, fallback to the Open Food Facts API if missing, translate food names to Arabic if needed, cache results in `foods_cache` for future instant lookups, and allow manual simulator/permission fallbacks.

---

## 1. User Interface & Permissions Flow
* **Component**: We use the native `<CameraView>` from `expo-camera`.
* **Permissions Hook**: `useCameraPermissions()` from `expo-camera`.
* **Flow**:
  1. User opens the Barcode Scanner.
  2. Request camera permissions.
  3. If permission is **granted**, render the active `<CameraView>`.
  4. If permission is **denied**, **not determined**, or **unavailable** (simulators), show a user-friendly error/explanation message.
  5. Include a fallback text input + "Scan Barcode" button in the denied/simulator UI. Typing a barcode (e.g. `6223000100412`) simulates the scanner trigger.

---

## 2. Barcode Parsing & Open Food Facts Lookup
* **Target Endpoint**: `https://world.openfoodfacts.org/api/v2/product/<barcode>.json`
* **Local Check**: Prior to hitting the API, query `foods_cache` directly where `barcode = scanned_value`.
* **Data Mapping**:
  * `id`: `off:<barcode>`
  * `name_en`: `product.product_name_en` || `product.product_name` || `'Unnamed Product'`
  * `name_ar`: `product.product_name_ar` || `''`
  * `brand`: `product.brands` || `null`
  * `barcode`: `barcode`
  * `source`: `'off'`
  * **Macros (per 100g)**:
    * `calories_per_100g`: `product.nutriments['energy-kcal_100g']` || `0`
    * `protein_per_100g`: `product.nutriments.proteins_100g` || `0`
    * `carbs_per_100g`: `product.nutriments.carbohydrates_100g` || `0`
    * `fat_per_100g`: `product.nutriments.fat_100g` || `0`
  * **Micros (per 100g)**:
    * `fiber_g`: `product.nutriments.fiber_100g` || `0`
    * `sugar_g`: `product.nutriments.sugars_100g` || `0`
    * `sodium_mg`: `(product.nutriments.sodium_100g || 0) * 1000`
    * `potassium_mg`: `(product.nutriments.potassium_100g || 0) * 1000`
    * `calcium_mg`: `(product.nutriments.calcium_100g || 0) * 1000`
    * `iron_mg`: `(product.nutriments.iron_100g || 0) * 1000`
    * `vitamin_a_mcg`: `(product.nutriments['vitamin-a_100g'] || 0) * 1000000`
    * `vitamin_c_mg`: `(product.nutriments['vitamin-c_100g'] || 0) * 1000`

---

## 3. Translation & Caching Flow
* If `name_ar` is missing or matches `name_en` (and we need an Arabic translation), invoke the Supabase Edge Function `translate-food`:
  ```typescript
  const { data } = await supabase.functions.invoke('translate-food', {
    body: { text: food.name_en }
  });
  ```
* Once fully mapped and translated, upsert the record into `foods_cache` via:
  ```typescript
  await supabase.from('foods_cache').upsert(foodItem);
  ```

---

## 4. Error Handling
* **Product Not Found**: Show a user-friendly alert: *"Product not found. Would you like to search manually?"*
* **Network/API Error**:
  * Log the raw error stack/details to `console.error` for developer debugging.
  * Show a clean, friendly message to the user: *"Network error. Please check your internet connection and try again."*
