import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useDiaryStore } from '@/store/useDiaryStore';
import { localRecipes } from '@/data/localRecipes';
import { PresstoButton } from '@/components/PresstoButton';

function getFallbackImage(title?: string, category?: string): string {
  const t = (title || '').toLowerCase();
  const cat = (category || '').toLowerCase();

  if (t.includes('salad') || t.includes('caesar') || t.includes('greens') || t.includes('سلطة')) {
    return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('soup') || t.includes('broth') || t.includes('adas') || t.includes('molokhia') || t.includes('شوربة') || t.includes('ملوخية') || t.includes('حساء')) {
    return 'https://images.unsplash.com/photo-1547592165-e1d17ffd26a0?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('chicken') || t.includes('meat') || t.includes('kofta') || t.includes('lamb') || t.includes('steak') || t.includes('دجاج') || t.includes('كفتة') || t.includes('لحم')) {
    return 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('fish') || t.includes('salmon') || t.includes('seafood') || t.includes('سلمون') || t.includes('سمك')) {
    return 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('breakfast') || t.includes('egg') || t.includes('shakshuka') || t.includes('toast') || t.includes('فطور') || t.includes('بيض') || t.includes('فول') || t.includes('شكشوكة') || cat === 'breakfast') {
    return 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('apple') || t.includes('berry') || t.includes('berries') || t.includes('fruit') || t.includes('snack') || t.includes('تفاح') || t.includes('توت') || t.includes('سناك') || cat === 'snack') {
    return 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80';
}

function RecipeImage({ 
  uri, 
  title, 
  category, 
  heightClass = 'h-56' 
}: { 
  uri?: string; 
  title?: string; 
  category?: string; 
  heightClass?: string 
}) {
  const [currentUri, setCurrentUri] = useState(uri || getFallbackImage(title, category));
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(!uri);

  React.useEffect(() => {
    setCurrentUri(uri || getFallbackImage(title, category));
    setFallbackMode(!uri);
  }, [uri, title, category]);

  const handleError = () => {
    if (!fallbackMode) {
      setFallbackMode(true);
      setCurrentUri(getFallbackImage(title, category));
    } else {
      setCurrentUri('https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80');
    }
  };

  return (
    <View className={`w-full ${heightClass} bg-bg-card relative justify-center items-center overflow-hidden`}>
      {/* Loading Indicator */}
      {loading && (
        <View className="absolute inset-0 bg-[#EAECEB] dark:bg-border-muted justify-center items-center">
          <ActivityIndicator size="small" color="#4C6E58" />
        </View>
      )}

      <Image
        source={{ uri: currentUri }}
        className={`w-full ${heightClass} resize-cover`}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={handleError}
      />
    </View>
  );
}

export default function RecipeDetailScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // Zustand State
  const profile = useDiaryStore((state) => state.profile);
  const addFoodLog = useDiaryStore((state) => state.addFoodLog);
  const generatedRecipes = useDiaryStore((state) => state.generatedRecipes);

  const language = profile?.language || 'ar';
  const isRtl = language === 'ar';

  // Find recipe in local recipes or generated recipes
  const recipe =
    localRecipes.find((r) => r.id === id) ||
    generatedRecipes.find((r) => r.id === id);

  // Local UI State
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [mealPlanType, setMealPlanType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snacks'>('lunch');
  const [showMealPlanPicker, setShowMealPlanPicker] = useState(false);

  if (!recipe) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#101412' : '#F8F9F8', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Ionicons name="alert-circle-outline" size={48} color="#E58C73" />
        <Text className="font-outfit-bold text-lg text-text-primary mt-4">
          {isRtl ? 'الوصفة غير موجودة' : 'Recipe not found'}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 bg-accent-sage px-6 py-3 rounded-2xl"
        >
          <Text className="text-white font-outfit-bold text-xs">{isRtl ? 'رجوع' : 'Go Back'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const t = {
    prepTime: isRtl ? 'وقت التحضير' : 'Prep Time',
    ingredients: isRtl ? 'المكونات' : 'Ingredients',
    steps: isRtl ? 'خطوات التحضير' : 'Directions',
    addToDiary: isRtl ? '+ إضافة للوجبات اليومية' : '+ Add to Food Diary',
    kcal: isRtl ? 'سعرة' : 'kcal',
    protein: isRtl ? 'بروتين' : 'protein',
    carbs: isRtl ? 'كارب' : 'carbs',
    fats: isRtl ? 'دهون' : 'fats',
    selectMealType: isRtl ? 'اختر تصنيف الوجبة' : 'Select Meal Category',
    confirm: isRtl ? 'تأكيد الإضافة' : 'Confirm & Log',
    cancel: isRtl ? 'إلغاء' : 'Cancel',
    back: isRtl ? 'رجوع' : 'Back',
  };

  const handleToggleStep = (index: number) => {
    if (completedSteps.includes(index)) {
      setCompletedSteps(completedSteps.filter((s) => s !== index));
    } else {
      setCompletedSteps([...completedSteps, index]);
    }
  };

  const handleConfirmMealPlanLog = () => {
    // Log the recipe to the daily diary
    addFoodLog({
      food_id: recipe.id,
      name_en: recipe.title_en,
      name_ar: recipe.title_ar,
      meal_type: mealPlanType,
      amount_g: recipe.ingredients.reduce((sum, i) => sum + i.weight_g, 0),
      calories: recipe.total_calories,
      protein: recipe.total_protein_g,
      carbs: recipe.total_carbs_g,
      fat: recipe.total_fat_g,
      logged_date: new Date().toISOString().split('T')[0],
    });

    setShowMealPlanPicker(false);
    
    // Redirect back to recipes list or dashboard
    router.replace('/(tabs)/recipes');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#101412' : '#F8F9F8' }}>
      {/* Header */}
      <View className={`flex-row justify-between items-center px-5 py-4 bg-bg-card border-b border-border-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
        <TouchableOpacity
          onPress={() => router.back()}
          className={`flex-row items-center py-1.5 px-3 rounded-xl bg-accent-mint ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          <Ionicons name={isRtl ? 'arrow-forward' : 'arrow-back'} size={18} color={isDark ? '#5C856C' : '#4C6E58'} />
          <Text className="font-outfit-bold text-accent-sage text-xs mx-1">
            {t.back}
          </Text>
        </TouchableOpacity>
        
        <Text className="text-base font-outfit-bold text-text-primary text-center flex-1 max-w-[200] truncate" numberOfLines={1}>
          {isRtl ? recipe.title_ar : recipe.title_en}
        </Text>
        <View className="w-16" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Image banner */}
        <RecipeImage 
          uri={recipe.image_url} 
          title={isRtl ? recipe.title_ar : recipe.title_en}
          category={recipe.category}
          heightClass="h-56" 
        />

        <View className="p-5">
          {/* Title & Description */}
          <Text className={`text-xl font-outfit-bold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
            {isRtl ? recipe.title_ar : recipe.title_en}
          </Text>
          <Text className={`text-xs font-inter-regular text-text-muted leading-relaxed mb-5 ${isRtl ? 'text-right' : 'text-left'}`}>
            {isRtl ? recipe.description_ar : recipe.description_en}
          </Text>

          {/* Interactive Macros Bento Grid */}
          <View className={`flex-row justify-between mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <View className="flex-1 items-center justify-center py-3 rounded-2xl mx-1 border border-border-muted bg-[#FFF2EE] dark:bg-[#2C1A16]">
              <Text className="text-nutrient-calories font-outfit-bold text-lg">
                {recipe.total_calories}
              </Text>
              <Text className="text-[10px] font-inter-bold text-text-muted">{t.kcal}</Text>
            </View>
            <View className="flex-1 items-center justify-center py-3 rounded-2xl mx-1 border border-border-muted bg-[#F3F7FA] dark:bg-[#15232D]">
              <Text className="text-[#7E9DB0] font-outfit-bold text-lg">
                {recipe.total_protein_g}g
              </Text>
              <Text className="text-[10px] font-inter-bold text-text-muted">{t.protein}</Text>
            </View>
            <View className="flex-1 items-center justify-center py-3 rounded-2xl mx-1 border border-border-muted bg-[#FAF6F0] dark:bg-[#2E2413]">
              <Text className="text-[#D3B177] font-outfit-bold text-lg">
                {recipe.total_carbs_g}g
              </Text>
              <Text className="text-[10px] font-inter-bold text-text-muted">{t.carbs}</Text>
            </View>
            <View className="flex-1 items-center justify-center py-3 rounded-2xl mx-1 border border-border-muted bg-[#F5F5F5] dark:bg-[#222222]">
              <Text className="text-[#9CA19E] font-outfit-bold text-lg">
                {recipe.total_fat_g}g
              </Text>
              <Text className="text-[10px] font-inter-bold text-text-muted">{t.fats}</Text>
            </View>
          </View>

          {/* Ingredients list */}
          <View className="border-t border-border-muted pt-4 mb-4">
            <Text className={`text-sm font-outfit-bold text-text-primary mb-3 ${isRtl ? 'text-right' : 'text-left'}`}>
              {t.ingredients}
            </Text>
            {recipe.ingredients.map((ing, idx) => (
              <View key={idx} className={`flex-row justify-between py-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Text className="text-xs font-inter-medium text-text-primary">
                  • {isRtl ? ing.name_ar : ing.name_en}
                </Text>
                <Text className="text-xs font-inter-bold text-text-muted">
                  {ing.weight_g} g
                </Text>
              </View>
            ))}
          </View>

          {/* Step-by-step directions checklist */}
          <View className="border-t border-border-muted pt-4 mb-6">
            <Text className={`text-sm font-outfit-bold text-text-primary mb-3 ${isRtl ? 'text-right' : 'text-left'}`}>
              {t.steps}
            </Text>
            {(isRtl ? recipe.steps_ar : recipe.steps_en).map((step, idx) => {
              const isCompleted = completedSteps.includes(idx);
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleToggleStep(idx)}
                  className={`flex-row items-start p-3 rounded-2xl mb-2 bg-bg-card border border-border-muted ${
                    isCompleted ? 'bg-[#F3F6F3] dark:bg-[#1F2E25] border-[#C3D9B6] dark:border-[#243E2C]' : ''
                  } ${isRtl ? 'flex-row-reverse' : ''}`}
                >
                  <View
                    className={`w-5 h-5 rounded border-2 border-accent-sage justify-center items-center mt-0.5 ${
                      isCompleted ? 'bg-accent-sage' : ''
                    }`}
                    style={{
                      marginRight: isRtl ? 0 : 12,
                      marginLeft: isRtl ? 12 : 0,
                    }}
                  >
                    {isCompleted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                  <Text className={`flex-1 text-xs font-inter-medium text-text-primary leading-relaxed ${
                    isCompleted ? 'text-text-muted line-through' : ''
                  } ${isRtl ? 'text-right' : 'text-left'}`}>
                    {step}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Add to daily meal log button */}
          <PresstoButton
            onPress={() => setShowMealPlanPicker(true)}
            className="bg-accent-sage py-4 rounded-2xl justify-center items-center"
          >
            <Text className="text-white font-outfit-bold text-sm">{t.addToDiary}</Text>
          </PresstoButton>
        </View>
      </ScrollView>

      {/* Meal type picker bottom sheet modal */}
      {showMealPlanPicker && (
        <Modal
          visible={showMealPlanPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMealPlanPicker(false)}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(26, 30, 28, 0.45)' }}>
            <TouchableOpacity
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              activeOpacity={1}
              onPress={() => setShowMealPlanPicker(false)}
            />
            <View className="bg-bg-base rounded-t-[32] px-6 pt-4 border border-border-muted" style={{ paddingBottom: Platform.OS === 'ios' ? 44 : 24 }}>
              {/* Drag handle */}
              <View className="w-10 h-1 bg-border-muted rounded-full align-self-center mb-5 self-center" />
              
              <Text className="text-lg font-outfit-bold text-text-primary text-center mb-3">
                {t.selectMealType}
              </Text>

              {/* Meal options */}
              <View className="my-3 gap-y-2">
                {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setMealPlanType(cat)}
                    className={`flex-row justify-between items-center p-3 border border-border-muted rounded-2xl bg-bg-card ${
                      mealPlanType === cat ? 'bg-[#F3F6F3] dark:bg-[#1F2E25] border-accent-sage' : ''
                    } ${isRtl ? 'flex-row-reverse' : ''}`}
                  >
                    <Text className={`text-sm font-inter-medium ${mealPlanType === cat ? 'text-text-primary font-inter-bold' : 'text-text-muted'}`}>
                      {cat === 'breakfast' && (isRtl ? 'الفطور' : 'Breakfast')}
                      {cat === 'lunch' && (isRtl ? 'الغداء' : 'Lunch')}
                      {cat === 'dinner' && (isRtl ? 'العشاء' : 'Dinner')}
                      {cat === 'snacks' && (isRtl ? 'وجبات خفيفة' : 'Snacks')}
                    </Text>
                    {mealPlanType === cat && (
                      <Ionicons name="checkmark" size={18} color={isDark ? '#5C856C' : '#4C6E58'} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action buttons */}
              <View className={`flex-row justify-between mt-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <TouchableOpacity
                  onPress={() => setShowMealPlanPicker(false)}
                  className="flex-1 py-3 bg-[#EAECEB] dark:bg-border-muted rounded-2xl items-center justify-center mr-3"
                  style={{ marginRight: isRtl ? 0 : 12, marginLeft: isRtl ? 12 : 0 }}
                >
                  <Text className="text-text-muted font-outfit-bold text-sm">{t.cancel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirmMealPlanLog}
                  className="flex-1 py-3 bg-accent-sage rounded-2xl items-center justify-center"
                >
                  <Text className="text-white font-outfit-bold text-sm">{t.confirm}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
