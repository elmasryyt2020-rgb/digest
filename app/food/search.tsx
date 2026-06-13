import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  ActivityIndicator,
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

import { useDiaryStore } from '@/store/useDiaryStore';
import { PresstoButton } from '@/components/PresstoButton';

interface MockFoodItem {
  id: string;
  name_en: string;
  name_ar: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

const mockFoods: MockFoodItem[] = [
  { id: 'egg_boiled', name_en: 'Boiled Egg', name_ar: 'بيض مسلوق', calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11 },
  { id: 'toast_wheat', name_en: 'Whole Wheat Toast', name_ar: 'توست أسمر كامل الحبة', calories_per_100g: 250, protein_per_100g: 12, carbs_per_100g: 43, fat_per_100g: 3.5 },
  { id: 'chicken_breast', name_en: 'Grilled Chicken Breast', name_ar: 'صدر دجاج مشوي', calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6 },
  { id: 'rice_white', name_en: 'Cooked White Rice', name_ar: 'أرز أبيض مطبوخ', calories_per_100g: 130, protein_per_100g: 2.7, carbs_per_100g: 28, fat_per_100g: 0.3 },
  { id: 'yogurt_greek', name_en: 'Greek Yogurt', name_ar: 'زبادي يوناني', calories_per_100g: 100, protein_per_100g: 10, carbs_per_100g: 3.6, fat_per_100g: 5.0 },
  { id: 'banana', name_en: 'Fresh Banana', name_ar: 'موز طازج', calories_per_100g: 89, protein_per_100g: 1.1, carbs_per_100g: 23, fat_per_100g: 0.3 },
  { id: 'apple', name_en: 'Red Apple', name_ar: 'تفاح أحمر', calories_per_100g: 52, protein_per_100g: 0.3, carbs_per_100g: 14, fat_per_100g: 0.2 },
  { id: 'cheese_cheddar', name_en: 'Cheddar Cheese', name_ar: 'جبنة شيدر', calories_per_100g: 400, protein_per_100g: 25, carbs_per_100g: 1.3, fat_per_100g: 33 },
  { id: 'fava_beans', name_en: 'Cooked Fava Beans (Ful)', name_ar: 'فول مدمس مطبوخ', calories_per_100g: 110, protein_per_100g: 8, carbs_per_100g: 20, fat_per_100g: 0.5 },
  { id: 'shakshuka', name_en: 'Eggs Shakshuka', name_ar: 'شكشكوتنا اللذيذة', calories_per_100g: 145, protein_per_100g: 9.5, carbs_per_100g: 5, fat_per_100g: 10 },
];

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
}

export default function FoodSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mealType = (params.meal_type as any) || 'breakfast';
  
  // Zustand State
  const profile = useDiaryStore((state) => state.profile);
  const addFoodLog = useDiaryStore((state) => state.addFoodLog);
  const language = profile?.language || 'ar';
  const isRtl = language === 'ar';

  // Local UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFoods, setFilteredFoods] = useState<MockFoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<MockFoodItem | null>(null);
  const [weight, setWeight] = useState(150); // standard grams
  
  // View Modes: 'search' | 'barcode' | 'camera'
  const [mode, setMode] = useState<'search' | 'barcode' | 'camera'>('search');
  const [barcodeState, setBarcodeState] = useState<'scanning' | 'detected'>('scanning');
  const [cameraState, setCameraState] = useState<'idle' | 'scanning' | 'detected'>('idle');
  const [cameraImage, setCameraImage] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedItemType[]>([]);
  
  // Reanimated values for barcode scanner red line
  const laserPosition = useSharedValue(0);

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

  // Handle Search Filtering
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredFoods([]);
      return;
    }
    const query = text.toLowerCase();
    const results = mockFoods.filter(
      (food) =>
        food.name_en.toLowerCase().includes(query) ||
        food.name_ar.includes(query)
    );
    setFilteredFoods(results);
  };

  const handleSelectFood = (food: MockFoodItem) => {
    setSelectedFood(food);
  };

  const handleLogFood = () => {
    if (!selectedFood) return;
    
    const factor = weight / 100;
    const logSuccess = addFoodLog({
      food_id: selectedFood.id,
      name_en: selectedFood.name_en,
      name_ar: selectedFood.name_ar,
      meal_type: mealType,
      amount_g: weight,
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

  // Trigger Barcode Scan Simulation
  const triggerBarcodeScan = () => {
    setMode('barcode');
    setBarcodeState('scanning');
    
    // Simulate detecting a barcode after 2.5s
    setTimeout(() => {
      setBarcodeState('detected');
      const greekYogurt = mockFoods[4]; // Greek Yogurt
      setSelectedFood(greekYogurt);
    }, 2500);
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
        { id: 'egg_boiled', name_en: 'Boiled Egg', name_ar: 'بيض مسلوق', amount_g: 100, anchor_point: [25, 30], calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11 },
        { id: 'shakshuka', name_en: 'Eggs Shakshuka', name_ar: 'شكشكوتنا اللذيذة', amount_g: 200, anchor_point: [60, 55], calories_per_100g: 145, protein_per_100g: 9.5, carbs_per_100g: 5, fat_per_100g: 10 },
      ];
      setDetectedItems(items);
      setSelectedFood(items[0]); // Default select the first item
      setWeight(items[0].amount_g);
    }, 2000);
  };

  const handleSelectOverlayTag = (item: DetectedItemType) => {
    setSelectedFood(item);
    setWeight(item.amount_g);
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
    
    return (
      <View className="bg-white rounded-3xl border border-border-muted p-4 mt-3 shadow-md">
        <Text className={`text-base font-outfit-bold text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}>
          {isRtl ? selectedFood.name_ar : selectedFood.name_en}
        </Text>
        
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

        {/* Weight Selector Slider Mock */}
        <Text className={`text-[11px] font-outfit-semibold text-text-primary mb-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>{t.selectWeight}</Text>
        <View className={`flex-row items-center mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <TouchableOpacity 
            onPress={() => setWeight(Math.max(10, weight - 25))}
            className="w-10 h-10 rounded-xl bg-[#EAECEB] justify-center items-center"
          >
            <Text className="text-lg font-outfit-bold text-text-primary">-</Text>
          </TouchableOpacity>
          <View className="flex-1 bg-[#F8F9F8] border border-border-muted rounded-xl py-2.5 items-center mx-3">
            <Text className="text-sm font-outfit-bold text-text-primary">{weight} g</Text>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9F8' }}>
      
      {/* Header */}
      <View className={`flex-row justify-between items-center px-5 py-4 bg-white border-b border-border-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
        <TouchableOpacity 
          onPress={() => {
            if (mode !== 'search') {
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
          {filteredFoods.length > 0 ? (
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
              <Ionicons name="nutrition-outline" size={48} color="#EAECEB" />
              <Text className="text-xs text-text-muted font-inter-regular mt-4">
                {isRtl ? 'اكتب اسم طعام أو اضغط على الكاميرا للبدء.' : 'Type to search or tap shortcuts to scan.'}
              </Text>
            </View>
          )}

          {/* Dynamic Slider overlay when item is selected */}
          {selectedFood && (
            <View className="absolute bottom-5 left-5 right-5 z-20">
              {renderNutrientPreview()}
            </View>
          )}
        </View>
      )}

      {/* Barcode Mock Viewfinder */}
      {mode === 'barcode' && (
        <View className="flex-1 bg-[#1A1E1C] p-5 justify-center items-center">
          {barcodeState === 'scanning' ? (
            <View className="w-[250] h-[250] border-2 border-white rounded-2xl relative overflow-hidden justify-center items-center">
              <Animated.View className="w-full h-[2] bg-nutrient-calories absolute top-0 left-0 z-10" style={laserStyle} />
              <View className="w-[200] h-[200] border-2 border-border-muted border-dashed rounded-lg" />
              <Text className="color-white text-[11px] font-inter-medium absolute bottom-3">{t.scanBoxMsg}</Text>
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

      {/* AI Vision Viewport Mockup */}
      {mode === 'camera' && (
        <View className="flex-1 bg-[#1A1E1C]">
          {cameraState === 'idle' && (
            <View className="flex-1 justify-center items-center">
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
              <View className="bg-bg-base rounded-t-[32] p-5 border border-border-muted" style={{ height: 320 }}>
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

    </SafeAreaView>
  );
}
