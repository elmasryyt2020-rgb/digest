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
import { ingredientSuggestions, IngredientSuggestion } from '@/data/ingredients';

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

  // Zustand State
  const profile = useDiaryStore((state) => state.profile);
  const incrementRecipesCount = useDiaryStore((state) => state.incrementRecipesCount);
  const addGeneratedRecipe = useDiaryStore((state) => state.addGeneratedRecipe);
  const triggerSignUp = useDiaryStore((state) => state.triggerSignUp);
  const isSignedIn = useAuthStore((state) => state.isSignedIn);
  
  const language = profile?.language || 'ar';
  const isRtl = language === 'ar';
  const userCountry = profile?.country || 'EG';

  // Local UI State
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [customIngredient, setCustomIngredient] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<'recommend' | 'pantry'>('recommend');
  
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
    recommend: isRtl ? 'اقتراحات لك' : 'Recommended',
    pantry: isRtl ? 'محتويات الثلاجة' : 'Pantry search',
    ingredientsTitle: isRtl ? 'اختر المكونات المتوفرة لديك:' : 'Select available ingredients:',
    addCustom: isRtl ? 'أضف مكوناً مخصصاً' : 'Add custom ingredient',
    generateBtn: isRtl ? 'ابتكر وصفة بالذكاء الاصطناعي' : 'Generate AI Recipe',
    kcal: isRtl ? 'سعرة' : 'kcal',
    protein: isRtl ? 'بروتين' : 'protein',
    carbs: isRtl ? 'كارب' : 'carbs',
    emptyPantry: isRtl ? 'حدد مكونين على الأقل للبدء.' : 'Select at least 2 ingredients to start.',
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#101412' : '#F8F9F8' }}>
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
      </View>

      {activeTab === 'recommend' ? (
        /* Recommendations Feed */
        <ScrollView 
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
      ) : (
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
