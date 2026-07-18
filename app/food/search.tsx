import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  ActivityIndicator,
  Keyboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';

import { useDiaryStore } from '@/store/useDiaryStore';
import { PresstoButton } from '@/components/PresstoButton';
import { supabase } from '@/lib/supabase';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

interface FoodItem {
  id: string;
  name_en: string;
  name_ar: string;
  brand?: string | null;
  barcode?: string | null;
  source: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  micros?: any;
}

interface DetectedItemType {
  id: string;
  name_en: string;
  name_ar: string;
  amount_g: number;
  anchor_point: [number, number]; // [x, y] in percentage
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  source: string;
  micros?: any;
}

const translationDict: Record<string, string> = {
  egg: 'بيض',
  eggs: 'بيض',
  boiled: 'مسلوق',
  scrambled: 'مخفوق',
  toast: 'توست',
  wheat: 'قمح',
  whole: 'كامل',
  chicken: 'دجاج',
  breast: 'صدر',
  grilled: 'مشوي',
  rice: 'أرز',
  white: 'أبيض',
  brown: 'بني',
  cooked: 'مطبوخ',
  yogurt: 'زبادي',
  greek: 'يوناني',
  banana: 'موز',
  apple: 'تفاح',
  cheese: 'جبن',
  cheddar: 'شيدر',
  fava: 'فول',
  beans: 'فاصوليا/فول',
  milk: 'حليب',
  bread: 'خبز',
  cucumber: 'خيار',
  tomato: 'طماطم',
  olive: 'زيتون',
  oil: 'زيت',
  oats: 'شوفان',
  beef: 'لحم بقري',
  steak: 'ستيك',
  salmon: 'سلمون',
  potato: 'بطاطس',
  strawberry: 'فراولة',
  dates: 'تمر',
  almonds: 'لوز',
  honey: 'عسل',
  spinach: 'سبانخ',
  butter: 'زبدة',
  garlic: 'ثوم',
  onion: 'بصل',
  avocado: 'أفوكادو',
  orange: 'برتقال',
  tuna: 'تونة',
  lentils: 'عدس',
  chickpeas: 'حمص',
  peanut: 'فول سوداني',
  coffee: 'قهوة',
  black: 'سوداء/أسود',
  tea: 'شاي',
  green: 'أخضر',
  watermelon: 'بطيخ',
  grapes: 'عنب',
  peach: 'خوخ',
  carrot: 'جزر',
  raw: 'نيء',
  fresh: 'طازج',
  water: 'ماء',
  sweet: 'حلو',
  sugar: 'سكر',
  salt: 'ملح',
  fish: 'سمك',
  meat: 'لحم',
};

const translateToArabic = (englishName: string): string => {
  const words = englishName.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
  const translatedWords = words.map(word => translationDict[word] || word);
  const uniqueTranslated = translatedWords.filter((w, idx) => w && translatedWords.indexOf(w) === idx);
  return uniqueTranslated.join(' ');
};

const mapUsdaNutrients = (nutrients: any[]) => {
  const findVal = (ids: number[]) => {
    const nut = nutrients.find(n => ids.includes(n.nutrientId));
    return nut ? parseFloat(nut.value) : 0;
  };

  return {
    calories: findVal([1008]),
    protein: findVal([1003]),
    carbs: findVal([1005]),
    fat: findVal([1004]),
    fiber: findVal([1079]),
    sugar: findVal([2000]),
    sodium: findVal([1093]),
    potassium: findVal([1092]),
    calcium: findVal([1087]),
    iron: findVal([1089]),
    vitamin_a: findVal([1104, 1106]),
    vitamin_c: findVal([1162]),
  };
};

export default function FoodSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mealType = (params.meal_type as any) || 'breakfast';
  
  // Zustand State
  const profile = useDiaryStore((state) => state.profile);
  const addFoodLog = useDiaryStore((state) => state.addFoodLog);
  const foodLogs = useDiaryStore((state) => state.foodLogs);
  const language = profile?.language || 'ar';
  const isRtl = language === 'ar';

  // Local UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFoods, setFilteredFoods] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [weight, setWeight] = useState(150); // standard grams
  const [loading, setLoading] = useState(false);
  const [dbFoods, setDbFoods] = useState<FoodItem[]>([]);
  const [loadingDbFoods, setLoadingDbFoods] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [showMicros, setShowMicros] = useState(false);

  // Camera & Barcode Scanner States
  const [permission, requestPermission] = useCameraPermissions();
  const [manualBarcode, setManualBarcode] = useState('');
  const [isProcessingBarcode, setIsProcessingBarcode] = useState(false);

  useEffect(() => {
    setShowMicros(false);
  }, [selectedFood?.id]);
  
  // View Modes: 'search' | 'barcode' | 'camera'
  const [mode, setMode] = useState<'search' | 'barcode' | 'camera'>('search');
  const [barcodeState, setBarcodeState] = useState<'scanning' | 'detected'>('scanning');
  const [cameraState, setCameraState] = useState<'idle' | 'scanning' | 'detected'>('idle');
  const [cameraImage, setCameraImage] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedItemType[]>([]);
  
  // Reanimated values for barcode scanner red line
  const laserPosition = useSharedValue(0);

  // Derive unique recently logged foods
  const recentFoods = useMemo(() => {
    const unique = new Map<string, FoodItem>();
    const sortedLogs = [...foodLogs].sort((a, b) => 
      new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
    );
    for (const log of sortedLogs) {
      if (!unique.has(log.food_id)) {
        const amount = log.amount_g || 100;
        const factor = amount / 100;
        unique.set(log.food_id, {
          id: log.food_id,
          name_en: log.name_en,
          name_ar: log.name_ar,
          calories_per_100g: Math.round(log.calories / factor),
          protein_per_100g: Math.round((log.protein / factor) * 10) / 10,
          carbs_per_100g: Math.round((log.carbs / factor) * 10) / 10,
          fat_per_100g: Math.round((log.fat / factor) * 10) / 10,
          source: log.food_id.startsWith('usda:') ? 'usda' : 'custom',
        });
      }
    }
    return Array.from(unique.values()).slice(0, 10);
  }, [foodLogs]);

  const t = {
    searchPlaceholder: isRtl ? 'ابحث عن طعام باللغة العربية أو الإنجليزية...' : 'Search food in English or Arabic...',
    title: isRtl ? 'تسجيل الوجبة' : 'Log Meal',
    back: isRtl ? 'إلغاء' : 'Cancel',
    selectWeight: isRtl ? 'تحديد الوزن بالجرام' : 'Select Weight (grams)',
    logToDiary: isRtl ? '+ تسجيل في المفكرة' : '+ Log to Diary',
    kcal: isRtl ? 'سعرة' : 'kcal',
    protein: isRtl ? 'بروتين' : 'protein',
    carbs: isRtl ? 'كارب' : 'carbs',
    fats: isRtl ? 'دهون' : 'fats',
    barcodeTitle: isRtl ? 'ماسح الباركود' : 'Barcode Scanner',
    cameraTitle: isRtl ? 'الماسح الضوئي الذكي' : 'AI Vision Scanner',
    cameraScanning: isRtl ? 'جارٍ تحليل الوجبة بالذكاء الاصطناعي...' : 'Analyzing meal using AI...',
    cameraSuccess: isRtl ? 'تم التعرف على المكونات!' : 'Meal components identified!',
    scanBoxMsg: isRtl ? 'ضع الباركود داخل المربع للمسح' : 'Place barcode inside the square to scan',
    recentHeader: isRtl ? 'الأطعمة المسجلة مؤخراً' : 'Recently Logged Foods',
    dbFoodsHeader: isRtl ? 'أطعمة شائعة من قاعدة البيانات' : 'Common Database Foods',
    noDbFoods: isRtl ? 'لا توجد أطعمة في قاعدة البيانات حالياً.' : 'No foods found in the database.',
    showMicros: isRtl ? 'عرض العناصر الغذائية الدقيقة' : 'Show Micronutrients',
    hideMicros: isRtl ? 'إخفاء العناصر الغذائية الدقيقة' : 'Hide Micronutrients',
    fiber: isRtl ? 'ألياف' : 'Fiber',
    sugar: isRtl ? 'سكر' : 'Sugar',
    sodium: isRtl ? 'صوديوم' : 'Sodium',
    potassium: isRtl ? 'بوتاسيوم' : 'Potassium',
    calcium: isRtl ? 'كالسيوم' : 'Calcium',
    iron: isRtl ? 'حديد' : 'Iron',
    vitA: isRtl ? 'فيتامين أ' : 'Vitamin A',
    vitC: isRtl ? 'فيتامين ج' : 'Vitamin C',
  };

  useEffect(() => {
    // Run laser line animation during scanning
    if (mode === 'barcode' && barcodeState === 'scanning') {
      laserPosition.value = withRepeat(
        withSequence(
          withTiming(150, { duration: 1500 }),
          withTiming(0, { duration: 1500 })
        ),
        -1, // Infinite
        false
      );
    }
  }, [mode, barcodeState]);

  useEffect(() => {
    if (!selectedFood && mode === 'barcode') {
      setBarcodeState('scanning');
    }
  }, [selectedFood, mode]);

  useEffect(() => {
    const fetchDefaultFoods = async () => {
      setLoadingDbFoods(true);
      try {
        const { data, error } = await supabase
          .from('foods_cache')
          .select('*')
          .limit(20);
        if (!error && data) {
          setDbFoods(data);
        }
      } catch (err) {
        console.error('Error fetching default database foods:', err);
      } finally {
        setLoadingDbFoods(false);
      }
    };
    fetchDefaultFoods();
  }, []);

  // Debounced search logic for live USDA + local search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFoods([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      performSearch(searchQuery);
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setLoading(true);
    try {
      // 1. Search local Supabase foods_cache first
      const { data, error } = await supabase
        .from('foods_cache')
        .select('*')
        .or(`name_en.ilike.%${query}%,name_ar.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      let results: FoodItem[] = data || [];

      // 2. If results are empty or few, query the USDA API as fallback
      if (results.length < 5) {
        let engQuery = query;
        const isArabicQuery = /[\u0600-\u06FF]/.test(query);
        if (isArabicQuery) {
          const arabicWords = query.trim().split(/\s+/);
          const mappedWords = arabicWords.map(word => {
            const entry = Object.entries(translationDict).find(([_, ar]) => ar === word);
            return entry ? entry[0] : word;
          });
          engQuery = mappedWords.join(' ');
        }

        const apiKey = process.env.EXPO_PUBLIC_USDA_API_KEY || 'DEMO_KEY';
        const usdaUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(engQuery)}&pageSize=10&api_key=${apiKey}`;
        
        const response = await fetch(usdaUrl);
        if (response.ok) {
          const usdaData = await response.json();
          if (usdaData.foods && usdaData.foods.length > 0) {
            const mappedUsda: FoodItem[] = usdaData.foods.map((food: any) => {
              const mapped = mapUsdaNutrients(food.foodNutrients);
              const name_en = food.description;
              const name_ar = translateToArabic(name_en);
              return {
                id: `usda:${food.fdcId}`,
                name_en,
                name_ar,
                brand: food.brandOwner || 'USDA',
                source: 'usda',
                calories_per_100g: mapped.calories,
                protein_per_100g: mapped.protein,
                carbs_per_100g: mapped.carbs,
                fat_per_100g: mapped.fat,
                micros: {
                  fiber_g: mapped.fiber,
                  sugar_g: mapped.sugar,
                  sodium_mg: mapped.sodium,
                  potassium_mg: mapped.potassium,
                  calcium_mg: mapped.calcium,
                  iron_mg: mapped.iron,
                  vitamin_a_mcg: mapped.vitamin_a,
                  vitamin_c_mg: mapped.vitamin_c,
                }
              };
            });
            const existingIds = new Set(results.map(r => r.id));
            const newResults = mappedUsda.filter(r => !existingIds.has(r.id));
            results = [...results, ...newResults];
          }
        }
      }

      setFilteredFoods(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleSelectFood = async (food: FoodItem) => {
    Keyboard.dismiss();
    if (selectedFood?.id === food.id) {
      setSelectedFood(null);
      return;
    }
    setSelectedFood(food);

    // If it's a USDA live food and not pre-seeded, call translate-food Edge Function
    const isPreSeeded = food.id.startsWith('usda:egg_') || 
                       food.id.startsWith('usda:toast_') || 
                       food.id.startsWith('usda:chicken_') || 
                       food.id.startsWith('usda:rice_') || 
                       food.id.startsWith('usda:yogurt_') || 
                       food.id.startsWith('usda:banana') || 
                       food.id.startsWith('usda:apple') || 
                       food.id.startsWith('usda:cheese_') || 
                       food.id.startsWith('usda:fava_') || 
                       food.id.startsWith('usda:shakshuka') ||
                       food.id.startsWith('usda:milk_') ||
                       food.id.startsWith('usda:bread_') ||
                       food.id.startsWith('usda:cucumber') ||
                       food.id.startsWith('usda:tomato') ||
                       food.id.startsWith('usda:olive_') ||
                       food.id.startsWith('usda:oats') ||
                       food.id.startsWith('usda:beef_') ||
                       food.id.startsWith('usda:salmon_') ||
                       food.id.startsWith('usda:potato_') ||
                       food.id.startsWith('usda:strawberry') ||
                       food.id.startsWith('usda:dates') ||
                       food.id.startsWith('usda:almonds') ||
                       food.id.startsWith('usda:honey') ||
                       food.id.startsWith('usda:spinach') ||
                       food.id.startsWith('usda:butter') ||
                       food.id.startsWith('usda:garlic') ||
                       food.id.startsWith('usda:onion') ||
                       food.id.startsWith('usda:avocado') ||
                       food.id.startsWith('usda:orange') ||
                       food.id.startsWith('usda:tuna_') ||
                       food.id.startsWith('usda:rice_') ||
                       food.id.startsWith('usda:lentils') ||
                       food.id.startsWith('usda:chickpeas') ||
                       food.id.startsWith('usda:peanut_') ||
                       food.id.startsWith('usda:coffee_') ||
                       food.id.startsWith('usda:green_') ||
                       food.id.startsWith('usda:watermelon') ||
                       food.id.startsWith('usda:grape') ||
                       food.id.startsWith('usda:peach') ||
                       food.id.startsWith('usda:carrot');

    if (food.source === 'usda' && food.id.startsWith('usda:') && !isPreSeeded) {
      setTranslating(true);
      try {
        const { data, error } = await supabase.functions.invoke('translate-food', {
          body: { text: food.name_en }
        });
        if (!error && data && data.translation) {
          const updatedFood = { ...food, name_ar: data.translation };
          setSelectedFood(updatedFood);
          setFilteredFoods(prev => prev.map(f => f.id === food.id ? updatedFood : f));
          setDbFoods(prev => prev.map(f => f.id === food.id ? updatedFood : f));
        }
      } catch (err) {
        console.error('Error invoking translation function:', err);
      } finally {
        setTranslating(false);
      }
    }
  };

  const handleLogFood = async () => {
    if (!selectedFood) return;
    
    // Ingest/cache this food item to Supabase first so database matches foreign key constraints
    try {
      await supabase.from('foods_cache').upsert({
        id: selectedFood.id,
        name_en: selectedFood.name_en,
        name_ar: selectedFood.name_ar,
        brand: selectedFood.brand || null,
        barcode: selectedFood.barcode || null,
        source: selectedFood.source || 'usda',
        calories_per_100g: selectedFood.calories_per_100g,
        protein_per_100g: selectedFood.protein_per_100g,
        carbs_per_100g: selectedFood.carbs_per_100g,
        fat_per_100g: selectedFood.fat_per_100g,
        micros: selectedFood.micros || {},
      }, { onConflict: 'id', ignoreDuplicates: true } as any);
    } catch (e) {
      console.error('Failed to pre-cache food:', e);
    }

    const finalWeight = weight > 0 ? weight : 100;
    const factor = finalWeight / 100;
    const logSuccess = addFoodLog({
      food_id: selectedFood.id,
      name_en: selectedFood.name_en,
      name_ar: selectedFood.name_ar,
      meal_type: mealType,
      amount_g: finalWeight,
      calories: Math.round(selectedFood.calories_per_100g * factor),
      protein: Math.round(selectedFood.protein_per_100g * factor * 10) / 10,
      carbs: Math.round(selectedFood.carbs_per_100g * factor * 10) / 10,
      fat: Math.round(selectedFood.fat_per_100g * factor * 10) / 10,
      logged_date: new Date().toISOString().split('T')[0],
    });

    if (logSuccess) {
      router.back();
    }
  };

  // Parse Open Food Facts product structure to FoodItem
  const parseOffProduct = (barcode: string, product: any): FoodItem => {
    const nut = product.nutriments || {};
    
    // Open Food Facts reports sodium, potassium, calcium, iron in grams per 100g.
    // We need them in mg, and Vitamin A in mcg.
    const sodium_mg = Math.round((parseFloat(nut.sodium_100g) || 0) * 1000);
    const potassium_mg = Math.round((parseFloat(nut.potassium_100g) || 0) * 1000);
    const calcium_mg = Math.round((parseFloat(nut.calcium_100g) || 0) * 1000);
    const iron_mg = Math.round((parseFloat(nut.iron_100g) || 0) * 1000);
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

  // Handle scanned/entered barcode processing
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
        Alert.alert(
          isRtl ? 'المنتج غير موجود' : 'Product Not Found',
          isRtl ? 'المنتج غير موجود. يرجى البحث يدوياً.' : 'Product not found. Please search manually.'
        );
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
      Alert.alert(
        isRtl ? 'خطأ في الاتصال' : 'Network Error',
        isRtl ? 'حدث خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت.' : 'Network error. Please check your internet connection.'
      );
      setMode('search');
    } finally {
      setIsProcessingBarcode(false);
    }
  };

  // Trigger Barcode Scan Start
  const triggerBarcodeScan = async () => {
    setMode('barcode');
    setBarcodeState('scanning');
    setManualBarcode('');
    try {
      await requestPermission();
    } catch (e) {
      console.warn('Failed to request camera permission:', e);
    }
  };

  // Trigger AI Camera simulation
  const triggerCameraScan = () => {
    setMode('camera');
    setCameraState('idle');
    setDetectedItems([]);
  };

  const handleSnapPhoto = () => {
    setCameraState('scanning');
    
    // Simulate food image scanning with coordinate overlay outputs after 2 seconds
    setTimeout(() => {
      setCameraState('detected');
      setCameraImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80');
      
      const items: DetectedItemType[] = [
        { id: 'usda:egg_boiled', name_en: 'Boiled Egg', name_ar: 'بيض مسلوق', amount_g: 100, anchor_point: [25, 30], calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11, source: 'usda' },
        { id: 'usda:shakshuka', name_en: 'Eggs Shakshuka', name_ar: 'شكشكوتنا اللذيذة', amount_g: 200, anchor_point: [60, 55], calories_per_100g: 145, protein_per_100g: 9.5, carbs_per_100g: 5, fat_per_100g: 10, source: 'usda' },
      ];
      setDetectedItems(items);
      setSelectedFood(items[0]); // Default select the first item
      setWeight(items[0].amount_g);
    }, 2000);
  };

  const handleSelectOverlayTag = (item: DetectedItemType) => {
    Keyboard.dismiss();
    if (selectedFood?.id === item.id) {
      setSelectedFood(null);
    } else {
      setSelectedFood(item);
      setWeight(item.amount_g);
    }
  };

  const laserStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: laserPosition.value }],
    };
  });

  // Render nutrient metrics preview based on current slider weight
  const renderNutrientPreview = () => {
    if (!selectedFood) return null;
    const factor = weight / 100;
    const microsData = selectedFood.micros || {};

    const getMicroValue = (key: string) => {
      if (microsData[key] !== undefined && microsData[key] !== null) return microsData[key];
      const baseKey = key.replace(/_(mg|mcg|g)$/, '');
      if (microsData[baseKey] !== undefined && microsData[baseKey] !== null) return microsData[baseKey];
      return undefined;
    };

    const microsList = [
      { key: 'fiber_g', label: t.fiber, unit: 'g' },
      { key: 'sugar_g', label: t.sugar, unit: 'g' },
      { key: 'sodium_mg', label: t.sodium, unit: 'mg' },
      { key: 'potassium_mg', label: t.potassium, unit: 'mg' },
      { key: 'calcium_mg', label: t.calcium, unit: 'mg' },
      { key: 'iron_mg', label: t.iron, unit: 'mg' },
      { key: 'vitamin_a_mcg', label: t.vitA, unit: 'mcg' },
      { key: 'vitamin_c_mg', label: t.vitC, unit: 'mg' },
    ];
    
    return (
      <View className="bg-white rounded-3xl border border-border-muted p-4 mt-3 shadow-md">
        <View className={`flex-row justify-between items-center mb-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <Text className="text-base font-outfit-bold text-text-primary flex-1">
            {isRtl ? selectedFood.name_ar : selectedFood.name_en}
          </Text>
          {translating && (
            <ActivityIndicator size="small" color="#4C6E58" className="mx-2" />
          )}
          <TouchableOpacity 
            onPress={() => setSelectedFood(null)}
            className="p-1"
          >
            <Ionicons name="close" size={20} color="#626A66" />
          </TouchableOpacity>
        </View>
        
        {/* Nutrients Bento grid */}
        <View className={`flex-row justify-between items-center my-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <View className="flex-1 items-center bg-[#F8F9F8] py-2 rounded-xl mx-1 border border-border-muted">
            <Text className="text-nutrient-calories font-outfit-bold text-base">
              {Math.round(selectedFood.calories_per_100g * factor)}
            </Text>
            <Text className="text-[9px] font-inter-bold text-text-muted uppercase">
              {t.kcal}
            </Text>
          </View>
          <View className="flex-1 items-center bg-[#F8F9F8] py-2 rounded-xl mx-1 border border-border-muted">
            <Text className="text-[#7E9DB0] font-outfit-bold text-base">
              {Math.round(selectedFood.protein_per_100g * factor * 10) / 10}g
            </Text>
            <Text className="text-[9px] font-inter-bold text-text-muted uppercase">
              {t.protein}
            </Text>
          </View>
          <View className="flex-1 items-center bg-[#F8F9F8] py-2 rounded-xl mx-1 border border-border-muted">
            <Text className="text-[#D3B177] font-outfit-bold text-base">
              {Math.round(selectedFood.carbs_per_100g * factor * 10) / 10}g
            </Text>
            <Text className="text-[9px] font-inter-bold text-text-muted uppercase">
              {t.carbs}
            </Text>
          </View>
          <View className="flex-1 items-center bg-[#F8F9F8] py-2 rounded-xl mx-1 border border-border-muted">
            <Text className="text-[#9CA19E] font-outfit-bold text-base">
              {Math.round(selectedFood.fat_per_100g * factor * 10) / 10}g
            </Text>
            <Text className="text-[9px] font-inter-bold text-text-muted uppercase">
              {t.fats}
            </Text>
          </View>
        </View>

        {/* Micronutrients Toggle */}
        <TouchableOpacity 
          onPress={() => setShowMicros(!showMicros)}
          className={`flex-row justify-between items-center py-2 px-3 bg-[#F8F9F8] rounded-xl border border-border-muted mb-3.5 ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          <Text className="text-[11px] font-outfit-semibold text-text-primary">
            {showMicros ? t.hideMicros : t.showMicros}
          </Text>
          <Ionicons 
            name={showMicros ? "chevron-up" : "chevron-down"} 
            size={14} 
            color="#626A66" 
          />
        </TouchableOpacity>

        {/* Micronutrients Content */}
        {showMicros && (
          <View className="bg-[#F8F9F8] border border-border-muted rounded-xl p-3 mb-3.5">
            <View className={`flex-row flex-wrap justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
              {microsList.map((item) => {
                const val = getMicroValue(item.key);
                if (val === undefined || val === null) return null;
                const calculatedVal = Math.round(val * factor * 10) / 10;
                return (
                  <View 
                    key={item.key} 
                    className={`w-[48%] py-1 flex-row justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}
                  >
                    <Text className="text-[10px] font-outfit-medium text-text-muted">
                      {item.label}
                    </Text>
                    <Text className="text-[10px] font-inter-semibold text-text-primary">
                      {calculatedVal} {item.unit}
                    </Text>
                  </View>
                );
              })}
            </View>
            {Object.keys(microsData).length === 0 && (
              <Text className="text-[10px] font-inter-medium text-text-muted text-center py-1">
                {isRtl ? 'لا توجد بيانات مغذيات دقيقة متوفرة' : 'No micronutrient data available'}
              </Text>
            )}
          </View>
        )}

        {/* Weight Selector Slider Mock */}
        <Text className={`text-[11px] font-outfit-semibold text-text-primary mb-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>{t.selectWeight}</Text>
        <View className={`flex-row items-center mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <TouchableOpacity 
            onPress={() => setWeight(Math.max(10, weight - 25))}
            className="w-10 h-10 rounded-xl bg-[#EAECEB] justify-center items-center"
          >
            <Text className="text-lg font-outfit-bold text-text-primary">-</Text>
          </TouchableOpacity>
          <View className="flex-1 bg-[#F8F9F8] border border-border-muted rounded-xl mx-3 flex-row justify-center items-center px-3 py-1">
            <TextInput
              keyboardType="numeric"
              value={weight === 0 ? '' : String(weight)}
              onChangeText={(text) => {
                const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10);
                setWeight(isNaN(parsed) ? 0 : Math.min(1000, parsed));
              }}
              style={{
                fontFamily: 'Outfit-Bold',
                fontSize: 14,
                color: '#1A1E1C',
                textAlign: 'right',
                minWidth: 40,
                paddingVertical: Platform.OS === 'ios' ? 8 : 4,
              }}
              placeholder="0"
              placeholderTextColor="#9CA19E"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            <Text className="text-sm font-outfit-bold text-text-primary ml-1">g</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setWeight(Math.min(1000, weight + 25))}
            className="w-10 h-10 rounded-xl bg-[#EAECEB] justify-center items-center"
          >
            <Text className="text-lg font-outfit-bold text-text-primary">+</Text>
          </TouchableOpacity>
        </View>

        {/* Log button */}
        <PresstoButton 
          onPress={handleLogFood} 
          className="bg-accent-sage rounded-2xl py-3 items-center justify-center"
        >
          <Text className="text-white font-outfit-bold text-sm">{t.logToDiary}</Text>
        </PresstoButton>

      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: mode === 'search' ? '#F8F9F8' : '#1A1E1C' }}>
      <StatusBar style={mode === 'search' ? 'dark' : 'light'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        
        {/* Header */}
        {mode === 'search' && (
          <View className={`flex-row justify-between items-center px-5 py-4 bg-white border-b border-border-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
            <TouchableOpacity 
              onPress={() => {
                if (selectedFood && mode === 'search') {
                  setSelectedFood(null);
                } else if (mode !== 'search') {
                  setMode('search');
                  setSelectedFood(null);
                } else {
                  router.back();
                }
              }}
              className="py-1.5 px-3 rounded-xl bg-[#EAECEB]"
            >
              <Text className="text-text-muted text-xs font-outfit-bold">{t.back}</Text>
            </TouchableOpacity>
            <Text className="text-base font-outfit-bold text-text-primary">{t.title} ({isRtl ? t[mealType as keyof typeof t] : mealType})</Text>
            <View className="w-16" />
          </View>
        )}

        {mode === 'search' && (
          <View className="flex-1 p-5">
            {/* Search bar & Suffix shortcuts */}
            <View className={`flex-row items-center bg-white border border-border-muted rounded-2xl ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Ionicons name="search" size={20} color="#626A66" className="mx-3" />
              <TextInput
                className={`flex-1 py-3.5 font-inter-regular text-xs text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}
                placeholder={t.searchPlaceholder}
                placeholderTextColor="#9CA19E"
                value={searchQuery}
                onChangeText={handleSearch}
              />
              {/* Camera triggers */}
              <View className="flex-row pr-2">
                <TouchableOpacity onPress={triggerBarcodeScan} className="w-9 h-9 rounded-xl bg-accent-mint justify-center items-center ml-1.5">
                  <Ionicons name="barcode-outline" size={22} color="#4C6E58" />
                </TouchableOpacity>
                <TouchableOpacity onPress={triggerCameraScan} className="w-9 h-9 rounded-xl bg-accent-mint justify-center items-center ml-1.5">
                  <Ionicons name="camera-outline" size={22} color="#4C6E58" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Searched Results List */}
            {loading ? (
              <View className="flex-1 justify-center items-center pb-20">
                <ActivityIndicator size="large" color="#4C6E58" />
              </View>
            ) : searchQuery.trim() !== '' ? (
              filteredFoods.length > 0 ? (
                <ScrollView className="flex-1 mt-3">
                  {filteredFoods.map((food) => (
                    <TouchableOpacity
                      key={food.id}
                      onPress={() => handleSelectFood(food)}
                      className={`flex-row justify-between items-center py-3.5 px-4 rounded-2xl mb-2 bg-white border ${
                        selectedFood?.id === food.id ? 'border-accent-sage bg-[#F3F6F3]' : 'border-border-muted'
                      } ${isRtl ? 'flex-row-reverse' : ''}`}
                    >
                      <View className={`flex-1 ${isRtl ? 'items-end' : 'items-start'}`}>
                        <Text className={`text-xs font-outfit-bold text-text-primary ${selectedFood?.id === food.id ? 'text-accent-sage' : ''}`}>
                          {isRtl ? food.name_ar : food.name_en}
                        </Text>
                        <Text className="text-[10px] font-inter-medium text-text-muted mt-0.5">
                          {food.calories_per_100g} kcal / 100g
                        </Text>
                      </View>
                      <Ionicons 
                        name={selectedFood?.id === food.id ? "checkmark-circle" : "chevron-forward-outline"} 
                        size={20} 
                        color={selectedFood?.id === food.id ? "#4C6E58" : "#626A66"} 
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View className="flex-1 justify-center items-center pb-20">
                  <Ionicons name="search-outline" size={48} color="#EAECEB" />
                  <Text className="text-xs text-text-muted font-inter-regular mt-4 text-center">
                    {isRtl ? 'لم يتم العثور على نتائج للبحث.' : 'No search results found.'}
                  </Text>
                </View>
              )
            ) : (
              // Previews for database and meals
              <ScrollView className="flex-1 mt-3" showsVerticalScrollIndicator={false}>
                {recentFoods.length > 0 && (
                  <View className="mb-6">
                    <Text className={`text-sm font-outfit-bold text-text-primary mb-2.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t.recentHeader}
                    </Text>
                    {recentFoods.map((food) => (
                      <TouchableOpacity
                        key={`recent:${food.id}`}
                        onPress={() => handleSelectFood(food)}
                        className={`flex-row justify-between items-center py-3.5 px-4 rounded-2xl mb-2 bg-white border ${
                          selectedFood?.id === food.id ? 'border-accent-sage bg-[#F3F6F3]' : 'border-border-muted'
                        } ${isRtl ? 'flex-row-reverse' : ''}`}
                      >
                        <View className={`flex-1 ${isRtl ? 'items-end' : 'items-start'}`}>
                          <Text className={`text-xs font-outfit-bold text-text-primary ${selectedFood?.id === food.id ? 'text-accent-sage' : ''}`}>
                            {isRtl ? food.name_ar : food.name_en}
                          </Text>
                          <Text className="text-[10px] font-inter-medium text-text-muted mt-0.5">
                            {food.calories_per_100g} kcal / 100g
                          </Text>
                        </View>
                        <Ionicons 
                          name={selectedFood?.id === food.id ? "checkmark-circle" : "chevron-forward-outline"} 
                          size={20} 
                          color={selectedFood?.id === food.id ? "#4C6E58" : "#626A66"} 
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <View className="mb-20">
                  <Text className={`text-sm font-outfit-bold text-text-primary mb-2.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.dbFoodsHeader}
                  </Text>
                  {loadingDbFoods ? (
                    <ActivityIndicator size="small" color="#4C6E58" className="my-4" />
                  ) : dbFoods.length > 0 ? (
                    dbFoods.map((food) => (
                      <TouchableOpacity
                        key={`db:${food.id}`}
                        onPress={() => handleSelectFood(food)}
                        className={`flex-row justify-between items-center py-3.5 px-4 rounded-2xl mb-2 bg-white border ${
                          selectedFood?.id === food.id ? 'border-accent-sage bg-[#F3F6F3]' : 'border-border-muted'
                        } ${isRtl ? 'flex-row-reverse' : ''}`}
                      >
                        <View className={`flex-1 ${isRtl ? 'items-end' : 'items-start'}`}>
                          <Text className={`text-xs font-outfit-bold text-text-primary ${selectedFood?.id === food.id ? 'text-accent-sage' : ''}`}>
                            {isRtl ? food.name_ar : food.name_en}
                          </Text>
                          <Text className="text-[10px] font-inter-medium text-text-muted mt-0.5">
                            {food.calories_per_100g} kcal / 100g
                          </Text>
                        </View>
                        <Ionicons 
                          name={selectedFood?.id === food.id ? "checkmark-circle" : "chevron-forward-outline"} 
                          size={20} 
                          color={selectedFood?.id === food.id ? "#4C6E58" : "#626A66"} 
                        />
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text className={`text-xs text-text-muted py-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t.noDbFoods}
                    </Text>
                  )}
                </View>
              </ScrollView>
            )}

            {/* Dynamic Slider overlay when item is selected */}
            {selectedFood && (
              <View className="absolute bottom-5 left-5 right-5 z-20">
                {renderNutrientPreview()}
              </View>
            )}
          </View>
        )}

        {/* Barcode Viewfinder */}
        {mode === 'barcode' && (
          <View className="flex-1 bg-[#1A1E1C] p-5 relative">
            {/* Header info */}
            <View className="flex-row items-center justify-between w-full mb-6 px-4 pt-4 z-20">
              <Text className="text-white font-outfit-bold text-lg">{t.barcodeTitle}</Text>
              <TouchableOpacity onPress={() => setMode('search')} className="p-2">
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            {!permission ? (
              <ActivityIndicator size="small" color="#4C6E58" />
            ) : !permission.granted ? (
              // Permission Denied or Simulator UI Fallback
              <View className="flex-1 justify-center items-center">
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
                    placeholder={isRtl ? 'اتب الباركود هنا (مثال: 6223000100412)' : 'Type barcode here (e.g., 6223000100412)'}
                    keyboardType="number-pad"
                    style={{ height: 42 }}
                    className="w-full bg-[#F3F6F3] border border-border-muted rounded-xl px-4 text-text-primary text-xs mb-3 text-center"
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
              </View>
            ) : (
              // Active Camera scanner view
              <View className="w-full flex-1 relative justify-center items-center overflow-hidden rounded-2xl">
                <CameraView
                  style={{ width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden' }}
                  facing="back"
                  barcodeScannerSettings={{
                    barcodeTypes: ['ean13', 'upc_a'],
                  }}
                  onBarcodeScanned={({ data }) => {
                    if (data && barcodeState === 'scanning') {
                      handleBarcodeDetected(data);
                    }
                  }}
                />
                
                {/* Visual Viewfinder Overlay - only visible when scanning */}
                {barcodeState === 'scanning' && (
                  <View 
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      bottom: 0, 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      backgroundColor: 'rgba(0,0,0,0.4)', 
                      borderRadius: 16, 
                      overflow: 'hidden',
                      zIndex: 10,
                      elevation: 10
                    }}
                  >
                    <View className="w-[250] h-[250] border-2 border-white rounded-2xl relative overflow-hidden justify-center items-center bg-transparent">
                      <Animated.View className="w-full h-[2] bg-nutrient-calories absolute top-0 left-0 z-10" style={laserStyle} />
                      <View className="w-[200] h-[200] border-2 border-white/50 border-dashed rounded-lg" />
                      <Text className="color-white text-[11px] font-inter-medium absolute bottom-3">{t.scanBoxMsg}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Slider overlay when item is detected/matched */}
            {selectedFood && barcodeState === 'detected' && (
              <View className="absolute bottom-5 left-5 right-5 z-20">
                {renderNutrientPreview()}
              </View>
            )}
          </View>
        )}

        {/* AI Vision Viewport Mockup */}
        {mode === 'camera' && (
          <View className="flex-1 bg-[#1A1E1C]">
            {/* Header info */}
            <View className="flex-row items-center justify-between w-full mt-4 mb-6 px-6">
              <Text className="text-white font-outfit-bold text-lg">{t.cameraTitle}</Text>
              <TouchableOpacity onPress={() => setMode('search')} className="p-2">
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            {cameraState === 'idle' && (
              <View className="flex-1 justify-center items-center pb-20">
                <View className="w-[260] h-[260] rounded-full border-[4] border-border-muted border-dashed justify-center items-center mb-10">
                  <Ionicons name="camera" size={64} color="#EAECEB" />
                </View>
                <PresstoButton 
                  onPress={handleSnapPhoto}
                  className="bg-accent-sage rounded-2xl py-3.5 px-6"
                >
                  <Text className="text-white font-outfit-bold text-sm">{isRtl ? 'التقاط صورة الوجبة' : 'Snap Meal Photo'}</Text>
                </PresstoButton>
              </View>
            )}

            {cameraState === 'scanning' && (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#4C6E58" />
                <Text className="color-white mt-5 font-outfit-bold text-sm">
                  {t.cameraScanning}
                </Text>
              </View>
            )}

            {cameraState === 'detected' && cameraImage && (
              <View className="flex-1 justify-between">
                {/* Picture view containing absolute overlays */}
                <View className="flex-1 relative bg-black">
                  <Image source={{ uri: cameraImage }} className="w-full h-full opacity-90 resize-cover" />
                  
                  {/* Floating tags mapped dynamically */}
                  {detectedItems.map((item, index) => {
                    const leftPercent = `${item.anchor_point[0]}%`;
                    const topPercent = `${item.anchor_point[1]}%`;
                    const isSelected = selectedFood?.id === item.id;

                    return (
                      <PresstoButton
                        key={index}
                        onPress={() => handleSelectOverlayTag(item)}
                        className="absolute items-center z-10"
                        style={{ left: leftPercent, top: topPercent }}
                      >
                        <View className="w-[2] h-5 bg-white" />
                        <View className={`w-2.5 h-2.5 rounded-full bg-white border-2 ${
                          isSelected ? 'border-nutrient-calories' : 'border-accent-sage'
                        }`} />
                        <View className={`px-2.5 py-1.5 rounded-xl mt-1 shadow ${
                          isSelected ? 'bg-accent-sage' : 'bg-[#1A1E1C]/85'
                        }`}>
                          <Text className="text-white text-[10px] font-inter-semibold">
                            {isRtl ? item.name_ar : item.name_en} ({item.amount_g}g)
                          </Text>
                        </View>
                      </PresstoButton>
                    );
                  })}
                </View>

                {/* Slider adjustment bottom box */}
                <View className="bg-bg-base rounded-t-[32] p-5 border border-border-muted pb-8">
                  <View className="flex-row justify-center items-center mb-3">
                    <Ionicons name="sparkles" size={18} color="#4C6E58" style={{ marginRight: 6 }} />
                    <Text className="text-sm font-outfit-bold text-text-primary">
                      {t.cameraSuccess}
                    </Text>
                  </View>
                  {selectedFood && renderNutrientPreview()}
                </View>
              </View>
            )}
          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
