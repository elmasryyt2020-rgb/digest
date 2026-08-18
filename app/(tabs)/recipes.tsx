import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';

import { useDiaryStore } from '@/store/useDiaryStore';
import { useAuthStore } from '@/store/useAuthStore';
import { localRecipes, RecipeType } from '@/data/localRecipes';
import { PresstoButton } from '@/components/PresstoButton';
import { supabase } from '@/lib/supabase';
import { ingredientSuggestions, IngredientSuggestion } from '../../data/ingredients';

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
  heightClass = 'h-40' 
}: { 
  uri?: string; 
  title?: string; 
  category?: string; 
  heightClass?: string 
}) {
  const [currentUri, setCurrentUri] = React.useState(uri || getFallbackImage(title, category));
  const [loading, setLoading] = React.useState(true);
  const [fallbackMode, setFallbackMode] = React.useState(!uri);

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

const commonIngredients = ingredientSuggestions.slice(0, 9);

export default function RecipesScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = windowWidth - 40;

  // Zustand State
  const profile = useDiaryStore((state) => state.profile);
  const setProfile = useDiaryStore((state) => state.setProfile);
  const incrementRecipesCount = useDiaryStore((state) => state.incrementRecipesCount);
  const addGeneratedRecipe = useDiaryStore((state) => state.addGeneratedRecipe);
  const generatedRecipes = useDiaryStore((state) => state.generatedRecipes);
  const triggerSignUp = useDiaryStore((state) => state.triggerSignUp);
  const isSignedIn = useAuthStore((state) => state.isSignedIn);
  const activeMealPlan = useDiaryStore((state) => state.activeMealPlan);
  const setActiveMealPlan = useDiaryStore((state) => state.setActiveMealPlan);
  const addFoodLog = useDiaryStore((state) => state.addFoodLog);
  
  const language = profile?.language || 'ar';
  const isRtl = language === 'ar';
  const userCountry = profile?.country || 'EG';

  // Local UI State
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [customIngredient, setCustomIngredient] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<'recommend' | 'pantry' | 'plan'>('recommend');
  
  const weekdaysList = [
    { id: 'sunday', label_en: 'Sun', label_ar: 'الأحد' },
    { id: 'monday', label_en: 'Mon', label_ar: 'الإثنين' },
    { id: 'tuesday', label_en: 'Tue', label_ar: 'الثلاثاء' },
    { id: 'wednesday', label_en: 'Wed', label_ar: 'الأربعاء' },
    { id: 'thursday', label_en: 'Thu', label_ar: 'الخميس' },
    { id: 'friday', label_en: 'Fri', label_ar: 'الجمعة' },
    { id: 'saturday', label_en: 'Sat', label_ar: 'السبت' },
  ];
  const getTodayWeekday = () => {
    const dayIndex = new Date().getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayIndex];
  };
  const [activeDay, setActiveDay] = useState<string>(getTodayWeekday());
  const [updatingBudget, setUpdatingBudget] = useState(false);

  // Look up the selected day's meal plan; fall back to null (not the entire
  // WeeklyMeals object) so the empty state renders when the day is missing.
  const dayPlan = activeMealPlan?.meals ? (
    (activeMealPlan.meals as Record<string, any>)[activeDay] ?? null
  ) : null;

  // AI Generator states
  const [isGenerating, setIsGenerating] = useState(false);

  const blurTimeoutRef = React.useRef<any>(null);

  React.useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  // Recommendations feed based on country
  const feedRecipes = localRecipes.filter(
    (recipe) => recipe.country_origin === userCountry || recipe.country_origin === 'GLOBAL'
  );

  const filteredSuggestions = searchQuery.trim()
    ? ingredientSuggestions.filter(item =>
        item.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name_ar.includes(searchQuery)
      ).slice(0, 5)
    : [];

  const t = {
    title: isRtl ? 'وصفات ذكية' : 'AI Recipes',
    recommend: isRtl ? 'وصفاتي' : 'My Recipes',
    pantry: isRtl ? 'محتويات الثلاجة' : 'Pantry search',
    plan: isRtl ? 'خطة وجباتي' : 'My Plan',
    ingredientsTitle: isRtl ? 'اختر المكونات المتوفرة لديك:' : 'Select available ingredients:',
    addCustom: isRtl ? 'أضف مكوناً مخصصاً' : 'Add custom ingredient',
    generateBtn: isRtl ? 'ابتكر وصفة بالذكاء الاصطناعي' : 'Generate AI Recipe',
    kcal: isRtl ? 'سعرة' : 'kcal',
    protein: isRtl ? 'بروتين' : 'protein',
    carbs: isRtl ? 'كارب' : 'carbs',
    emptyPantry: isRtl ? 'حدد مكونين على الأقل للبدء.' : 'Select at least 2 ingredients to start.',
    myRecipes: isRtl ? 'وصفاتي المبتكرة' : 'My Generated Recipes',
    createFirstRecipe: isRtl ? 'ابتكر وصفتك الأولى بالذكاء الاصطناعي!' : 'Create your first AI recipe!',
    tryPantrySearch: isRtl ? 'استخدم محتويات الثلاجة لابتكار وصفات مخصصة.' : 'Use pantry search to generate custom recipes.',
    fats: isRtl ? 'دهون' : 'fats',
    recommendedTitle: isRtl ? 'وصفات مقترحة لك' : 'Recommended for You',
  };

  const handleToggleIngredient = (name: string) => {
    if (selectedIngredients.includes(name)) {
      setSelectedIngredients(selectedIngredients.filter((i) => i !== name));
    } else {
      setSelectedIngredients([...selectedIngredients, name]);
    }
  };

  const handleAddCustomIngredient = () => {
    if (!customIngredient.trim()) return;
    const item = customIngredient.trim();
    if (!selectedIngredients.includes(item)) {
      setSelectedIngredients([...selectedIngredients, item]);
    }
    setCustomIngredient('');
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleGenerateRecipe = async () => {
    if (selectedIngredients.length < 2) return;

    if (!isSignedIn) {
      triggerSignUp();
      return;
    }

    const allowed = incrementRecipesCount();
    if (!allowed) return;

    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const { data, error } = await supabase.functions.invoke('generate-recipe', {
        body: {
          ingredients: selectedIngredients,
          language,
          country: userCountry,
          health_goal: profile?.health_goal,
          diet_type: profile?.diet_type,
          exclusions: profile?.exclusions,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (error || !data) {
        throw new Error(error?.message || 'Failed to generate recipe');
      }

      // Add to store generated list and navigate to detail page
      const recipeToSave: RecipeType = {
        ...data,
        id: `ai_${Date.now()}`,
      };

      const generated = addGeneratedRecipe(recipeToSave);
      router.push(`/recipes/${generated.id}` as any);
    } catch (err) {
      console.error('Error generating AI recipe:', err);
      Alert.alert(
        isRtl ? 'عذرًا، حدث خطأ' : 'Error',
        isRtl ? 'حدث خطأ أثناء ابتكار الوصفة بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.' : 'Could not generate recipe. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateBudget = async (level: 'low' | 'medium' | 'high') => {
    if (!isSignedIn) {
      triggerSignUp();
      return;
    }
    setUpdatingBudget(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const { data: planData, error: planError } = await supabase.functions.invoke('generate-meal-plan', {
        body: {
          gender: profile?.gender,
          age: profile?.age,
          weight_kg: profile?.weight_kg,
          height_cm: profile?.height_cm,
          activity_level: profile?.activity_level,
          health_goal: profile?.health_goal,
          diet_type: profile?.diet_type,
          exclusions: profile?.exclusions,
          country: profile?.country,
          budget: level,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (planError || !planData) throw new Error(planError?.message || 'Failed to update plan');

      // Update profile budget locally (store re-syncs targets only when core
      // biometrics change; budget is an app-preference field).
      setProfile({ ...(profile ?? {}), budget: level });

      // setActiveMealPlan expects a MealPlan ({ title, meals, grocery_list }),
      // NOT the raw Edge Function response (which also carries target_*).
      // Without unwrapping here, activeMealPlan.meals becomes the whole
      // response and activeDay's meals resolve to undefined -> empty state.
      setActiveMealPlan({
        title: 'My Custom Plan',
        meals: planData.meals,
        grocery_list: planData.grocery_list,
      });

      // Persist budget + new weekly plan to Supabase. NOTE: the table is
      // `meal_plans` (columns: id, user_id, title, plan_data, grocery_list,
      // created_at) — there is no `user_meal_plans` table in the schema.
      if (token && session?.user?.id) {
        await supabase.from('profiles').update({ budget: level }).eq('id', session.user.id);

        // Reuse the user's existing meal_plans row if present so we update
        // the active plan in place instead of stacking rows on every toggle.
        const { data: existing } = await supabase
          .from('meal_plans')
          .select('id')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        await supabase.from('meal_plans').upsert({
          id: existing?.[0]?.id,
          user_id: session.user.id,
          title: 'My Custom Plan',
          plan_data: planData.meals,
          grocery_list: planData.grocery_list,
        });
      }

      const budgetLabel = isRtl
        ? level === 'low' ? 'اقتصادية' : level === 'medium' ? 'متوسطة' : 'مرتفعة'
        : level.charAt(0).toUpperCase() + level.slice(1);
      Alert.alert(
        isRtl ? 'تم تحديث الميزانية' : 'Budget Updated',
        isRtl
          ? `تم تحديث خطة الوجبات بنجاح إلى المستوى ${budgetLabel}!`
          : `Meal plan successfully updated to ${level} budget!`
      );
    } catch (error) {
      console.error(error);
      Alert.alert(isRtl ? 'خطأ' : 'Error', isRtl ? 'فشل تحديث الخطة' : 'Failed to update plan');
    } finally {
      setUpdatingBudget(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? '#101412' : '#F8F9F8' }}>
      {/* Header */}
      <View className={`flex-row justify-between items-center px-5 py-4 bg-bg-card border-b border-border-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
        <View className="w-16" />
        <Text className="text-base font-outfit-bold text-text-primary">{t.title}</Text>
        <View className="w-16" />
      </View>

      {/* Tab Selector Segment */}
      <View className="flex-row bg-[#EAECEB] dark:bg-border-muted p-1 rounded-2xl mx-5 mt-4">
        <PresstoButton 
          onPress={() => setActiveTab('recommend')}
          className="flex-1 py-2 rounded-xl items-center"
          style={activeTab === 'recommend' ? [styles.activeTab, { backgroundColor: isDark ? '#161B18' : '#FFFFFF' }] : null}
          accessibilityRole="button"
          accessibilityLabel={t.recommend}
          accessibilityState={{ selected: activeTab === 'recommend' }}
        >
          <Text className={`text-xs font-outfit-medium ${activeTab === 'recommend' ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
            {t.recommend}
          </Text>
        </PresstoButton>
        <PresstoButton 
          onPress={() => setActiveTab('pantry')}
          className="flex-1 py-2 rounded-xl items-center"
          style={activeTab === 'pantry' ? [styles.activeTab, { backgroundColor: isDark ? '#161B18' : '#FFFFFF' }] : null}
          accessibilityRole="button"
          accessibilityLabel={t.pantry}
          accessibilityState={{ selected: activeTab === 'pantry' }}
        >
          <Text className={`text-xs font-outfit-medium ${activeTab === 'pantry' ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
            {t.pantry}
          </Text>
        </PresstoButton>
        <PresstoButton 
          onPress={() => setActiveTab('plan')}
          className="flex-1 py-2 rounded-xl items-center"
          style={activeTab === 'plan' ? [styles.activeTab, { backgroundColor: isDark ? '#161B18' : '#FFFFFF' }] : null}
          accessibilityRole="button"
          accessibilityLabel={t.plan}
          accessibilityState={{ selected: activeTab === 'plan' }}
        >
          <Text className={`text-xs font-outfit-medium ${activeTab === 'plan' ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
            {t.plan}
          </Text>
        </PresstoButton>
      </View>

      {activeTab === 'recommend' ? (
        /* Recommendations Feed */
        <ScrollView 
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* My Recipes Section */}
          <View className="mb-6">
            <Text className={`text-sm font-outfit-bold text-text-primary mb-3 ${isRtl ? 'text-right' : 'text-left'}`}>
              {t.myRecipes}
            </Text>
            
            {generatedRecipes.length === 0 ? (
              <TouchableOpacity
                onPress={() => setActiveTab('pantry')}
                className="bg-bg-card border border-dashed border-border-muted rounded-3xl p-5 items-center justify-center"
                activeOpacity={0.7}
              >
                <View className="bg-accent-mint p-3 rounded-full mb-2">
                  <Ionicons name="restaurant-outline" size={20} color={isDark ? '#5C856C' : '#4C6E58'} />
                </View>
                <Text className="text-xs font-outfit-bold text-text-primary mb-1 text-center">
                  {t.createFirstRecipe}
                </Text>
                <Text className="text-[10px] font-inter-regular text-text-muted text-center">
                  {t.tryPantrySearch}
                </Text>
              </TouchableOpacity>
            ) : (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                snapToInterval={cardWidth + 16}
                decelerationRate="fast"
                snapToAlignment="start"
                contentContainerStyle={{ 
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  gap: 16
                }}
              >
                {generatedRecipes.map((recipe) => (
                  <TouchableOpacity
                    key={recipe.id}
                    onPress={() => router.push(`/recipes/${recipe.id}` as any)}
                    className="bg-bg-card rounded-3xl border border-border-muted overflow-hidden shadow-sm animate-none"
                    style={{ width: cardWidth }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={isRtl ? recipe.title_ar : recipe.title_en}
                  >
                    <RecipeImage 
                      uri={recipe.image_url} 
                      title={language === 'ar' ? recipe.title_ar : recipe.title_en}
                      category={recipe.category}
                      heightClass="h-40" 
                    />
                    <View className="p-4">
                      <Text 
                        numberOfLines={1}
                        className={`text-sm font-outfit-bold text-text-primary mb-1.5 ${isRtl ? 'text-right' : 'text-left'}`}
                      >
                        {isRtl ? recipe.title_ar : recipe.title_en}
                      </Text>
                      
                      <Text 
                        numberOfLines={2} 
                        className={`text-[11px] font-inter-regular text-text-muted leading-relaxed mb-3 ${isRtl ? 'text-right' : 'text-left'}`}
                      >
                        {isRtl ? recipe.description_ar : recipe.description_en}
                      </Text>

                      {/* Macros info strip */}
                      <View className={`flex-row items-center flex-wrap ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <Text className="text-[10px] font-inter-semibold text-text-muted">
                          🔥 {recipe.total_calories} {t.kcal} |
                        </Text>
                        <Text className="text-[10px] font-inter-semibold text-[#7E9DB0] ml-1">
                          💪 {recipe.total_protein_g}g {t.protein} |
                        </Text>
                        <Text className="text-[10px] font-inter-semibold text-[#D3B177] ml-1">
                          🌾 {recipe.total_carbs_g}g {t.carbs} |
                        </Text>
                        <Text className="text-[10px] font-inter-semibold text-[#9CA19E] ml-1">
                          🥑 {recipe.total_fat_g}g {t.fats}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Recommended Section Header */}
          <Text className={`text-sm font-outfit-bold text-text-primary mb-3 mt-2 ${isRtl ? 'text-right' : 'text-left'}`}>
            {t.recommendedTitle}
          </Text>

          {feedRecipes.map((recipe) => (
            <TouchableOpacity
              key={recipe.id}
              onPress={() => router.push(`/recipes/${recipe.id}` as any)}
              className="bg-bg-card rounded-3xl border border-border-muted mb-5 overflow-hidden shadow-sm animate-none"
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={isRtl ? recipe.title_ar : recipe.title_en}
            >
              <RecipeImage 
                uri={recipe.image_url} 
                title={language === 'ar' ? recipe.title_ar : recipe.title_en}
                category={recipe.category}
                heightClass="h-40" 
              />
              <View className="p-4">
                {/* Tags row */}
                <View className={`flex-row mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  {recipe.tags.slice(0, 2).map((tag, idx) => (
                    <View key={idx} className="bg-accent-mint px-2 py-1 rounded-lg mr-1.5">
                      <Text className="color-accent-sage text-[9px] font-outfit-bold">{tag}</Text>
                    </View>
                  ))}
                </View>
                
                <Text className={`text-sm font-outfit-bold text-text-primary mb-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {isRtl ? recipe.title_ar : recipe.title_en}
                </Text>
                
                <Text numberOfLines={2} className={`text-[11px] font-inter-regular text-text-muted leading-relaxed mb-3 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {isRtl ? recipe.description_ar : recipe.description_en}
                </Text>

                {/* Macros info strip */}
                <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <Text className="text-[10px] font-inter-semibold text-text-muted">
                    🔥 {recipe.total_calories} {t.kcal} |
                  </Text>
                  <Text className="text-[10px] font-inter-semibold text-[#7E9DB0] ml-1">
                    💪 {recipe.total_protein_g}g {t.protein} |
                  </Text>
                  <Text className="text-[10px] font-inter-semibold text-[#D3B177] ml-1">
                    🌾 {recipe.total_carbs_g}g {t.carbs}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : activeTab === 'pantry' ? (
        /* Refrigerator Pantry inventory list builder */
        <View className="flex-1 p-5">
          {isGenerating ? (
            /* Shimmer loading skeleton */
            <View className="flex-1 justify-center items-center pb-20">
              <ActivityIndicator size="large" color={isDark ? '#5C856C' : '#4C6E58'} />
              <Text className="mt-6 text-sm font-outfit-bold text-text-primary">
                {isRtl ? 'جارٍ صياغة وصفة مغذية مخصصة...' : 'Crafting custom nutritious recipe...'}
              </Text>
            </View>
          ) : (
            <View className="flex-1 justify-between">
              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingBottom: showSuggestions && filteredSuggestions.length > 0 ? 250 : 40
                }}
              >
                <Text className={`text-sm font-outfit-bold text-text-primary mb-3 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.ingredientsTitle}
                </Text>

                {/* Ingredient Tag Grid */}
                <View className={`flex-row flex-wrap mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  {commonIngredients.map((ing) => {
                    const name = isRtl ? ing.name_ar : ing.name_en;
                    const isSelected = selectedIngredients.includes(name);
                    return (
                      <TouchableOpacity
                        key={ing.name_en}
                        onPress={() => handleToggleIngredient(name)}
                        className={`flex-row items-center bg-bg-card border border-border-muted px-3 py-2 rounded-2xl mr-2 mb-2 ${
                          isSelected ? 'bg-accent-mint border-accent-sage' : ''
                        }`}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                        accessibilityLabel={name}
                      >
                        <Text className="mr-1 text-sm">{ing.icon}</Text>
                        <Text className={`text-xs font-inter-medium ${isSelected ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
                          {name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Selected custom/searched ingredients */}
                {selectedIngredients.filter(name => !commonIngredients.some(c => (language === 'ar' ? c.name_ar : c.name_en) === name)).length > 0 && (
                  <View className={`flex-row flex-wrap mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    {selectedIngredients
                      .filter(name => !commonIngredients.some(c => (language === 'ar' ? c.name_ar : c.name_en) === name))
                      .map((name) => (
                        <TouchableOpacity
                          key={name}
                          onPress={() => handleToggleIngredient(name)}
                          className="flex-row items-center bg-accent-mint border border-accent-sage px-3 py-2 rounded-2xl mr-2 mb-2"
                          accessibilityRole="button"
                          accessibilityLabel={`${name}, ${isRtl ? 'اضغط للحذف' : 'tap to remove'}`}
                        >
                          <Text className="text-xs font-inter-medium text-text-primary font-outfit-bold mr-1">{name}</Text>
                          <Ionicons name="close-circle" size={14} color="#4C6E58" />
                        </TouchableOpacity>
                      ))}
                  </View>
                )}

                {/* Custom input */}
                <View className={`flex-row items-center mt-2 gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <View className="flex-1 relative">
                    <TextInput
                      className={`w-full bg-bg-card border border-border-muted rounded-2xl px-4 py-3 font-inter-regular text-xs text-text-primary ${
                        isRtl ? 'text-right' : 'text-left'
                      }`}
                      placeholder={t.addCustom}
                      placeholderTextColor="#9CA19E"
                      value={customIngredient}
                      onChangeText={(text) => {
                        setCustomIngredient(text);
                        setSearchQuery(text);
                        setShowSuggestions(text.trim().length > 0);
                      }}
                      onFocus={() => {
                        if (customIngredient.trim().length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        blurTimeoutRef.current = setTimeout(() => {
                          setShowSuggestions(false);
                        }, 200);
                      }}
                      onSubmitEditing={handleAddCustomIngredient}
                      returnKeyType="done"
                    />

                    {/* Suggestions Dropdown overlay */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <View className="absolute top-12 left-0 right-0 bg-bg-card border border-border-muted rounded-2xl shadow-lg z-50 overflow-hidden">
                        {filteredSuggestions.map((item, index) => {
                          const name = language === 'ar' ? item.name_ar : item.name_en;
                          const subName = language === 'ar' ? item.name_en : item.name_ar;
                          const isLast = index === filteredSuggestions.length - 1;
                          return (
                            <TouchableOpacity
                              key={item.name_en}
                              onPress={() => {
                                handleToggleIngredient(name);
                                setCustomIngredient('');
                                setSearchQuery('');
                                setShowSuggestions(false);
                              }}
                              accessibilityRole="button"
                              accessibilityLabel={name}
                              className={`flex-row items-center justify-between px-4 py-3 ${
                                isLast ? '' : 'border-b border-border-muted'
                              } active:bg-accent-mint`}
                            >
                              <View className="flex-row items-center">
                                <Text className="text-sm mr-2">{item.icon}</Text>
                                <Text className="text-xs font-inter-medium text-text-primary">{name}</Text>
                              </View>
                              <Text className="text-[10px] font-inter-regular text-text-muted">{subName}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                  <TouchableOpacity 
                    onPress={handleAddCustomIngredient}
                    accessibilityRole="button"
                    accessibilityLabel={isRtl ? 'إضافة مكون مخصص' : 'Add custom ingredient'}
                    className="w-11 h-11 rounded-2xl bg-accent-sage justify-center items-center"
                  >
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Generate Button */}
              <View className="pt-4">
                {selectedIngredients.length < 2 && (
                  <Text className="text-center text-[11px] font-inter-medium text-nutrient-calories mb-2">
                    {t.emptyPantry}
                  </Text>
                )}
                <PresstoButton
                  onPress={handleGenerateRecipe}
                  disabled={selectedIngredients.length < 2}
                  accessibilityRole="button"
                  accessibilityLabel={t.generateBtn}
                  className={`rounded-2xl py-4 items-center justify-center ${
                    selectedIngredients.length >= 2 ? 'bg-accent-sage' : 'bg-border-muted'
                  }`}
                >
                  <Text className={`text-xs font-outfit-bold ${
                    selectedIngredients.length >= 2 ? 'text-white' : 'text-text-muted'
                  }`}>
                    {t.generateBtn}
                  </Text>
                </PresstoButton>
              </View>
            </View>
          )}
        </View>
      ) : (
        /* Daily Meal Plan Tab */
        <ScrollView 
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Budget Picker */}
          <View className="mb-6">
            <Text className={`font-outfit-bold text-sm text-text-primary mb-3 ${isRtl ? 'text-right' : 'text-left'}`}>
              {isRtl ? 'ميزانية الأسبوع' : 'Weekly Budget'}
            </Text>
            <View className={`flex-row bg-[#EAECEB] dark:bg-border-muted p-1 rounded-2xl ${isRtl ? 'flex-row-reverse' : ''}`}>
              {(['low', 'medium', 'high'] as const).map((level) => {
                // Store default for budget is 'medium' (useDiaryStore.ts), so
                // never fall back to 'low' when profile.budget is unset.
                const isSelected = profile?.budget === level || (!profile?.budget && level === 'medium');
                const labels = {
                  low: isRtl ? 'اقتصادية' : 'Low',
                  medium: isRtl ? 'متوسطة' : 'Medium',
                  high: isRtl ? 'مرتفعة' : 'High'
                };
                return (
                  <PresstoButton 
                    key={level}
                    onPress={() => handleUpdateBudget(level)}
                    className="flex-1 py-2 rounded-xl items-center"
                    style={isSelected ? [styles.activeTab, { backgroundColor: isDark ? '#161B18' : '#FFFFFF' }] : null}
                  >
                    <Text className={`text-xs font-outfit-medium ${isSelected ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
                      {labels[level]}
                    </Text>
                  </PresstoButton>
                );
              })}
            </View>
          </View>

          {/* Weekday Calendar */}
          <View className="mb-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: isRtl ? 'row-reverse' : 'row', gap: 10 }}>
              {weekdaysList.map((day) => {
                const isActive = activeDay === day.id;
                return (
                  <TouchableOpacity
                    key={day.id}
                    onPress={() => setActiveDay(day.id)}
                    className={`w-14 h-16 rounded-2xl justify-center items-center border ${
                      isActive ? 'bg-accent-mint border-accent-sage' : 'bg-bg-card border-border-muted'
                    }`}
                  >
                    <Text className={`text-xs font-inter-medium ${isActive ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
                      {isRtl ? day.label_ar : day.label_en}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {(activeMealPlan && activeMealPlan.meals) ? (
            <View>
              {/* Grocery List Summary Panel */}
              {activeMealPlan.grocery_list && activeMealPlan.grocery_list.length > 0 && (
                <View className="bg-bg-card rounded-3xl border border-border-muted p-5 mb-6 shadow-sm">
                  <View className={`flex-row justify-between items-center mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <Ionicons name="basket-outline" size={20} color={isDark ? '#5C856C' : '#4C6E58'} />
                      <Text className={`font-outfit-bold text-sm text-text-primary ${isRtl ? 'mr-2' : 'ml-2'}`}>
                        {isRtl ? 'قائمة البقالة الموحدة' : 'Unified Grocery List'}
                      </Text>
                    </View>
                    <View className="bg-[#D3B177]/20 px-2 py-1 rounded-full">
                      <Text className="text-[10px] font-inter-semibold text-[#A9894E]">
                        {isRtl ? 'التكلفة التقديرية: ' : 'Est. Cost: '}
                        {profile?.country === 'GB'
                          ? profile?.budget === 'low'
                            ? '£15 / wk'
                            : profile?.budget === 'high'
                            ? '£35 / wk'
                            : '£25 / wk'
                          : profile?.budget === 'low'
                          ? (isRtl ? '١٥٠ ج.م / أسبوع' : '150 EGP / wk')
                          : profile?.budget === 'high'
                          ? (isRtl ? '٣٥٠ ج.م / أسبوع' : '350 EGP / wk')
                          : (isRtl ? '٢٥٠ ج.م / أسبوع' : '250 EGP / wk')}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {activeMealPlan.grocery_list.map((item: any, idx: number) => (
                      <View key={idx} className="bg-accent-mint px-3 py-1.5 rounded-full">
                        <Text className="text-[11px] font-inter-semibold text-accent-sage">
                          {item.weight_g}g {isRtl ? item.name_ar : item.name_en}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Meals list */}
              {!dayPlan || !dayPlan.breakfast ? (
                <View className="items-center py-8">
                  <Text className="font-outfit-bold text-text-muted">{isRtl ? 'لا توجد وجبات لهذا اليوم' : 'No meals for this day'}</Text>
                </View>
              ) : (
                (['breakfast', 'lunch', 'dinner', 'snack'] as const).map((category) => {
                  const plannedMeal = dayPlan[category];
                if (!plannedMeal) return null;

                const diaryMealType = category === 'snack' ? 'snacks' : category;

                return (
                  <View key={category} className="bg-bg-card rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
                    {/* Meal Header */}
                    <View className={`flex-row justify-between items-center mb-3.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <View className="bg-accent-mint px-3 py-1.5 rounded-full">
                        <Text className="text-[10px] font-outfit-bold text-accent-sage uppercase">
                          {isRtl ? (category === 'breakfast' ? 'الفطور' : category === 'lunch' ? 'الغداء' : category === 'dinner' ? 'العشاء' : 'وجبة خفيفة') : category}
                        </Text>
                      </View>
                      <Text className="text-xs font-inter-bold text-nutrient-calories">
                        🔥 {plannedMeal.total_calories} {t.kcal}
                      </Text>
                    </View>

                    {/* Meal Title & Description */}
                    <Text className={`font-outfit-bold text-lg text-text-primary mb-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {isRtl ? plannedMeal.title_ar : plannedMeal.title_en}
                    </Text>
                    <Text className={`font-inter text-xs text-text-muted mb-4 leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
                      {isRtl ? plannedMeal.description_ar : plannedMeal.description_en}
                    </Text>

                    {/* Macros Grid */}
                    <View className="flex-row gap-2 mb-4">
                      <View className="flex-1 bg-[#7E9DB0]/10 py-2 rounded-xl items-center">
                        <Text className="font-outfit-bold text-xs" style={{ color: isDark ? '#7E9DB0' : '#5D7E92' }}>{plannedMeal.total_protein_g}g</Text>
                        <Text className="font-inter text-[9px] text-text-muted mt-0.5">{isRtl ? 'بروتين' : 'Protein'}</Text>
                      </View>
                      <View className="flex-1 bg-[#D3B177]/10 py-2 rounded-xl items-center">
                        <Text className="font-outfit-bold text-xs" style={{ color: isDark ? '#D3B177' : '#A9894E' }}>{plannedMeal.total_carbs_g}g</Text>
                        <Text className="font-inter text-[9px] text-text-muted mt-0.5">{isRtl ? 'كارب' : 'Carbs'}</Text>
                      </View>
                      <View className="flex-1 bg-[#9CA19E]/10 py-2 rounded-xl items-center">
                        <Text className="font-outfit-bold text-xs" style={{ color: isDark ? '#9CA19E' : '#767B78' }}>{plannedMeal.total_fat_g}g</Text>
                        <Text className="font-inter text-[9px] text-text-muted mt-0.5">{isRtl ? 'دهون' : 'Fats'}</Text>
                      </View>
                    </View>

                    {/* Ingredients List */}
                    <Text className={`font-outfit-bold text-xs text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {isRtl ? 'المكونات:' : 'Ingredients:'}
                    </Text>
                    <View className="mb-4">
                      {plannedMeal.ingredients.map((ing: any, i: number) => (
                        <Text key={i} className={`font-inter text-[11px] text-text-muted mb-1 leading-normal ${isRtl ? 'text-right' : 'text-left'}`}>
                          • {ing.weight_g}g {isRtl ? ing.name_ar : ing.name_en}
                        </Text>
                      ))}
                    </View>

                    {/* Directions Steps */}
                    <Text className={`font-outfit-bold text-xs text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {isRtl ? 'خطوات التحضير:' : 'Instructions:'}
                    </Text>
                    <View className="mb-5">
                      {(isRtl ? plannedMeal.steps_ar : plannedMeal.steps_en).map((step: string, i: number) => (
                        <Text key={i} className={`font-inter text-[11px] text-text-muted mb-2 leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
                          {i + 1}. {step}
                        </Text>
                      ))}
                    </View>

                    {/* Add to Diary Action Button */}
                    <TouchableOpacity
                      onPress={() => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const logged = addFoodLog({
                          food_id: `custom:meal_plan_${category}_${Date.now()}`,
                          name_en: plannedMeal.title_en,
                          name_ar: plannedMeal.title_ar,
                          meal_type: diaryMealType as any,
                          amount_g: plannedMeal.ingredients.reduce((sum: number, i: any) => sum + (i.weight_g || 0), 0) || 300,
                          calories: plannedMeal.total_calories,
                          protein: plannedMeal.total_protein_g,
                          carbs: plannedMeal.total_carbs_g,
                          fat: plannedMeal.total_fat_g,
                          logged_date: todayStr,
                        });
                        if (logged) {
                          Alert.alert(
                            isRtl ? 'تم التسجيل' : 'Logged',
                            isRtl 
                              ? `تم تسجيل ${plannedMeal.title_ar} بنجاح في سجلات الفود اليومية.` 
                              : `Successfully logged ${plannedMeal.title_en} to your diary!`
                          );
                        }
                      }}
                      className="bg-accent-sage py-3.5 rounded-2xl flex-row justify-center items-center gap-2"
                    >
                      <Ionicons name="add-circle-outline" size={16} color="white" />
                      <Text className="text-white font-outfit-bold text-xs">
                        {isRtl ? 'سجل الوجبة في المفكرة اليومية' : 'Log Meal to Daily Diary'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
            </View>
          ) : (
            <View className="items-center py-12 px-6">
              <Ionicons name="calendar-outline" size={48} color={isDark ? '#8A9690' : '#626A66'} className="mb-4" />
              <Text className="font-outfit-bold text-base text-text-primary text-center mb-2">
                {isRtl ? 'لا توجد خطة وجبات بعد' : 'No Daily Meal Plan Yet'}
              </Text>
              <Text className="font-inter text-xs text-text-muted text-center leading-relaxed">
                {isRtl 
                  ? 'يرجى إكمال الاستبيان التعريفي لحساب الأهداف وتوليد خطة الوجبات المخصصة بالذكاء الاصطناعي.'
                  : 'Please complete the onboarding questionnaire to calculate targets and generate your custom AI meal plan.'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Fullscreen Loading Overlay */}
      {updatingBudget && (
        <View className="absolute inset-0 bg-black/50 z-50 justify-center items-center">
          <View className="bg-bg-card p-6 rounded-3xl items-center">
            <ActivityIndicator size="large" color="#4C6E58" />
            <Text className="text-sm font-outfit-bold text-text-primary mt-4">
              {isRtl ? 'جارٍ تحديث الميزانية...' : 'Updating Budget...'}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1,
    elevation: 1,
  },
});
