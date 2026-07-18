# Barcode Scanning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement fully functional barcode scanning in the food search screen, lookup products in local cache first, fallback to Open Food Facts API, translate English descriptions to Arabic via Gemini, cache them in Supabase database, and provide a simulation fallback.

**Architecture:** Use `expo-camera` built-in scanner in the React Native app. Coordinate scanning states, network lookups, Gemini translations, and local caches. Provide a manual entry barcode form for testing on simulators or when permissions are denied.

**Tech Stack:** React Native, Expo SDK, TypeScript, Expo Camera, Supabase client, Supabase Edge Functions.

---

### Task 1: Dependency Installation

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install expo-camera via expo CLI**

Run: `npx expo install expo-camera`
Expected output: Installs a version of `expo-camera` compatible with Expo SDK 56.0.16.

- [ ] **Step 2: Commit changes**

Run:
```bash
git add package.json package-lock.json
git commit -m "chore: install expo-camera for barcode scanning"
```

---

### Task 2: Camera Permissions and Simulator Fallback UI

**Files:**
- Modify: `app/food/search.tsx`

- [ ] **Step 1: Import expo-camera components**

Add imports at the top of `app/food/search.tsx`:
```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';
```

- [ ] **Step 2: Integrate permission check hooks and state**

In `FoodSearchScreen`, add permissions check hook:
```typescript
const [permission, requestPermission] = useCameraPermissions();
```
And a text state for manual barcode typing (simulator fallback):
```typescript
const [manualBarcode, setManualBarcode] = useState('');
```

- [ ] **Step 3: Update barcode UI to request permissions and display camera or fallback**

Modify the barcode section around line 894 in `app/food/search.tsx` to handle permission logic:
```tsx
        {mode === 'barcode' && (
          <View className="flex-1 bg-[#1A1E1C] p-5 justify-center items-center">
            {barcodeState === 'scanning' ? (
              <View className="w-full flex-1 justify-center items-center">
                {/* Header info */}
                <View className="flex-row items-center justify-between w-full mb-6 px-4">
                  <Text className="text-white font-outfit-bold text-lg">{t.barcodeTitle}</Text>
                  <TouchableOpacity onPress={() => setMode('search')} className="p-2">
                    <Ionicons name="close" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>

                {!permission ? (
                  <ActivityIndicator size="large" color="#4C6E58" />
                ) : !permission.granted ? (
                  // Permission Denied or Simulator UI Fallback
                  <View className="w-full max-w-sm bg-white p-6 rounded-[28] border border-border-muted shadow-lg items-center">
                    <Ionicons name="camera-outline" size={48} color="#D13A3A" className="mb-3" />
                    <Text className="text-text-primary font-outfit-bold text-center text-sm mb-1">
                      {isRtl ? 'الكاميرا غير متوفرة أو تم رفض الإذن' : 'Camera Unavailable / Permission Denied'}
                    </Text>
                    <Text className="text-text-muted font-inter text-center text-xs mb-4">
                      {isRtl 
                        ? 'يرجى تفعيل صلاحية الكاميرا أو كتابة الباركود يدوياً للمحاكاة.'
                        : 'Please grant camera permissions or type the barcode manually to simulate scanning.'}
                    </Text>
                    
                    <TextInput
                      value={manualBarcode}
                      onChangeText={setManualBarcode}
                      placeholder={isRtl ? 'اكتب الباركود هنا (مثال: 6223000100412)' : 'Type barcode here (e.g., 6223000100412)'}
                      keyboardType="number-pad"
                      className="w-full bg-[#F3F6F3] border border-border-muted rounded-xl px-4 py-2.5 text-text-primary text-xs mb-3 text-center"
                    />

                    <View className="flex-row gap-2 w-full">
                      <TouchableOpacity
                        onPress={requestPermission}
                        className="flex-1 bg-[#F3F6F3] py-2.5 rounded-xl justify-center items-center"
                      >
                        <Text className="text-text-primary font-outfit-bold text-xs">{isRtl ? 'طلب الإذن' : 'Request Access'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleBarcodeDetected(manualBarcode)}
                        className="flex-1 bg-accent-sage py-2.5 rounded-xl justify-center items-center"
                        disabled={!manualBarcode.trim()}
                      >
                        <Text className="text-white font-outfit-bold text-xs">{isRtl ? 'محاكاة المسح' : 'Simulate Scan'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  // Active Camera scanner
                  <View className="w-full flex-1 relative justify-center items-center">
                    <CameraView
                      style={{ width: '100%', height: '80%', borderRadius: 16, overflow: 'hidden' }}
                      facing="back"
                      barcodeScannerSettings={{
                        barcodeTypes: ['ean13', 'upc_a'],
                      }}
                      onBarcodeScanned={({ data }) => {
                        if (data) handleBarcodeDetected(data);
                      }}
                    >
                      <View className="flex-1 justify-center items-center bg-black/40">
                        <View className="w-[250] h-[250] border-2 border-white rounded-2xl relative overflow-hidden justify-center items-center bg-transparent">
                          <Animated.View className="w-full h-[2] bg-nutrient-calories absolute top-0 left-0 z-10" style={laserStyle} />
                          <View className="w-[200] h-[200] border-2 border-white/50 border-dashed rounded-lg" />
                          <Text className="color-white text-[11px] font-inter-medium absolute bottom-3">{t.scanBoxMsg}</Text>
                        </View>
                      </View>
                    </CameraView>
                  </View>
                )}
              </View>
            ) : (
              /* Barcode Match display */
              <View className="w-full p-6 bg-[#F8F9F8] rounded-[28] border border-border-muted shadow-lg">
                <View className="flex-row justify-center items-center mb-4">
                  <Ionicons name="checkmark-circle-sharp" size={36} color="#4C6E58" />
                  <Text className="text-base font-outfit-bold text-text-primary ml-2">
                    {isRtl ? 'تم مطابقة الباركود!' : 'Product Barcode Matched!'}
                  </Text>
                </View>
                {selectedFood && renderNutrientPreview()}
              </View>
            )}
          </View>
        )}
```

- [ ] **Step 3: Commit changes**

Run:
```bash
git add app/food/search.tsx
git commit -m "feat: add camera view and permission fallback UI for barcode scan"
```

---

### Task 3: Open Food Facts Client Integration and Caching

**Files:**
- Modify: `app/food/search.tsx`

- [ ] **Step 1: Write helper logic to fetch product from Open Food Facts API**

Add the parsing function `parseOffProduct` inside `app/food/search.tsx`:
```typescript
const parseOffProduct = (barcode: string, product: any): FoodItem => {
  const nut = product.nutriments || {};
  
  // Open Food Facts reports sodium, potassium, calcium, iron in grams per 100g.
  // We need them in mg, and Vitamin A in mcg.
  const sodium_mg = Math.round((parseFloat(nut.sodium_100g) || 0) * 1000);
  const potassium_mg = Math.round((parseFloat(nut.potassium_100g) || 0) * 1000);
  const calcium_mg = Math.round((parseFloat(nut.calcium_100g) || 0) * 1000);
  const iron_mg = Math.round((parseFloat(nut.iron_100g) || 0) * 10); // iron is usually mg or grams, safe multiplication
  const vitamin_a_mcg = Math.round((parseFloat(nut['vitamin-a_100g']) || 0) * 1000000);
  const vitamin_c_mg = Math.round((parseFloat(nut['vitamin-c_100g']) || 0) * 1000);
  
  return {
    id: `off:${barcode}`,
    name_en: product.product_name_en || product.product_name || 'Unnamed Product',
    name_ar: product.product_name_ar || '',
    brand: product.brands || null,
    barcode: barcode,
    source: 'off',
    calories_per_100g: parseFloat(nut['energy-kcal_100g']) || 0,
    protein_per_100g: parseFloat(nut.proteins_100g) || 0,
    carbs_per_100g: parseFloat(nut.carbohydrates_100g) || 0,
    fat_per_100g: parseFloat(nut.fat_100g) || 0,
    micros: {
      fiber_g: parseFloat(nut.fiber_100g) || 0,
      sugar_g: parseFloat(nut.sugars_100g) || 0,
      sodium_mg,
      potassium_mg,
      calcium_mg,
      iron_mg,
      vitamin_a_mcg,
      vitamin_c_mg,
    }
  };
};
```

- [ ] **Step 2: Add barcode detection coordinator function**

Implement `handleBarcodeDetected` in the component:
```typescript
  const [isProcessingBarcode, setIsProcessingBarcode] = useState(false);

  const handleBarcodeDetected = async (barcode: string) => {
    if (isProcessingBarcode || !barcode.trim()) return;
    setIsProcessingBarcode(true);
    setBarcodeState('scanning');

    try {
      // 1. Check local Supabase database cache first
      const { data: cachedData, error: dbError } = await supabase
        .from('foods_cache')
        .select('*')
        .eq('barcode', barcode)
        .maybeSingle();

      if (cachedData) {
        setSelectedFood(cachedData);
        setBarcodeState('detected');
        setIsProcessingBarcode(false);
        return;
      }

      // 2. Fetch from Open Food Facts API
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
      if (!response.ok) {
        throw new Error('OFF_API_ERROR');
      }

      const resJson = await response.json();
      if (resJson.status !== 1 || !resJson.product) {
        alert(isRtl ? 'المنتج غير موجود. يرجى البحث يدوياً.' : 'Product not found. Please search manually.');
        setMode('search');
        setIsProcessingBarcode(false);
        return;
      }

      // 3. Map the fields
      let foodItem = parseOffProduct(barcode, resJson.product);

      // 4. Translate name if needed
      if (!foodItem.name_ar || foodItem.name_ar === foodItem.name_en) {
        try {
          const { data: transData, error: transError } = await supabase.functions.invoke('translate-food', {
            body: { text: foodItem.name_en }
          });
          if (!transError && transData && transData.translation) {
            foodItem.name_ar = transData.translation;
          } else {
            // fallback to basic matching or keep english
            foodItem.name_ar = foodItem.name_en;
          }
        } catch (transErr) {
          console.error('Translation call failed, using default name:', transErr);
          foodItem.name_ar = foodItem.name_en;
        }
      }

      // 5. Upsert to foods_cache
      const { error: upsertError } = await supabase.from('foods_cache').upsert(foodItem);
      if (upsertError) {
        console.error('Failed to cache food to DB:', upsertError);
      }

      setSelectedFood(foodItem);
      setBarcodeState('detected');
    } catch (err) {
      console.error('Barcode scanning processing failed:', err);
      alert(isRtl 
        ? 'حدث خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت.' 
        : 'Network error. Please check your internet connection.');
      setMode('search');
    } finally {
      setIsProcessingBarcode(false);
    }
  };
```

- [ ] **Step 3: Connect header and simulation triggers**

Replace mock trigger functions and clean up state resets:
```typescript
  // Replace the mock triggerBarcodeScan with a real mode reset
  const triggerBarcodeScan = () => {
    setMode('barcode');
    setBarcodeState('scanning');
    setManualBarcode('');
  };
```

- [ ] **Step 4: Commit changes**

Run:
```bash
git add app/food/search.tsx
git commit -m "feat: implement Open Food Facts barcode fetching, translation and DB caching"
```

---

### Task 4: Types Validation and Clean Up

**Files:**
- Modify: `app/food/search.tsx`

- [ ] **Step 1: Check typescript types and build errors**

Run: `npm run typecheck`
Expected: PASS with zero compiler issues.

- [ ] **Step 2: Commit final clean up**

Run:
```bash
git commit --allow-empty -m "chore: verify barcode scanning code compilation"
```
