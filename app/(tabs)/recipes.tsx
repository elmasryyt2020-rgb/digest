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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useDiaryStore } from '@/store/useDiaryStore';
import { localRecipes, RecipeType } from '@/data/localRecipes';
import { PresstoButton } from '@/components/PresstoButton';

const commonIngredients = [
  { name_en: 'Chicken breast', name_ar: 'صدر دجاج', icon: '🍗' },
  { name_en: 'Fava beans', name_ar: 'فول مدمس', icon: '🌱' },
  { name_en: 'Zucchini', name_ar: 'كوسة', icon: '🥒' },
  { name_en: 'Olive oil', name_ar: 'زيت زيتون', icon: '🫒' },
  { name_en: 'Tomatoes', name_ar: 'طماطم', icon: '🍅' },
  { name_en: 'Eggs', name_ar: 'بيض', icon: '🥚' },
  { name_en: 'Potatoes', name_ar: 'بطاطس', icon: '🥔' },
  { name_en: 'Lentils', name_ar: 'عدس', icon: '🥣' },
  { name_en: 'Cheese', name_ar: 'جبنة', icon: '🧀' },
];

export default function RecipesScreen() {
  const router = useRouter();

  // Zustand State
  const profile = useDiaryStore((state) => state.profile);
  const incrementRecipesCount = useDiaryStore((state) => state.incrementRecipesCount);
  const addGeneratedRecipe = useDiaryStore((state) => state.addGeneratedRecipe);
  
  const language = profile?.language || 'ar';
  const isRtl = language === 'ar';
  const userCountry = profile?.country || 'EG';

  // Local UI State
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [customIngredient, setCustomIngredient] = useState('');
  const [activeTab, setActiveTab] = useState<'recommend' | 'pantry'>('recommend');
  
  // AI Generator states
  const [isGenerating, setIsGenerating] = useState(false);

  // Recommendations feed based on country
  const feedRecipes = localRecipes.filter(
    (recipe) => recipe.country_origin === userCountry || recipe.country_origin === 'GLOBAL'
  );

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
  };

  const handleGenerateRecipe = () => {
    if (selectedIngredients.length < 2) return;

    incrementRecipesCount();

    setIsGenerating(true);
    
    // Simulate Gemini API response delay
    setTimeout(() => {
      setIsGenerating(false);
      // Serve a generated recipe mockup
      const mockGenerated: RecipeType = {
        id: 'ai_zucchini_chicken',
        title_en: 'AI Chicken & Zucchini Sauté',
        title_ar: 'دجاج محمر مع الكوسة بالذكاء الاصطناعي',
        description_en: 'A high-protein, nutrient-rich stir fry using chicken breast, fresh zucchini, tomatoes, and olive oil. Perfect clean eating meal.',
        description_ar: 'طبق دجاج محمر غني بالبروتين مع الكوسة الطازجة، الطماطم المفرومة وزيت الزيتون. وجبة صحية ولذيذة تم ابتكارها بالذكاء الاصطناعي.',
        ingredients: [
          { name_en: 'Chicken breast', name_ar: 'صدر دجاج', weight_g: 150 },
          { name_en: 'Zucchini', name_ar: 'كوسة طازجة', weight_g: 100 },
          { name_en: 'Olive oil', name_ar: 'زيت زيتون', weight_g: 10 },
          { name_en: 'Tomatoes', name_ar: 'طماطم مفرومة', weight_g: 80 },
        ],
        steps_en: [
          'Slice the chicken breast into thin strips and season with salt and pepper.',
          'Heat olive oil in a pan and sauté the chicken until fully cooked (about 6 minutes).',
          'Add sliced zucchini and diced tomatoes to the pan. Cook for another 5 minutes.',
          'Garnish with fresh herbs and serve hot.'
        ],
        steps_ar: [
          'قطع صدر الدجاج إلى شرائح رفيعة وتبله بالملح والفلفل الأسود.',
          'سخن زيت الزيتون في مقلاة وشوح الدجاج حتى تمام النضج (حوالي 6 دقائق).',
          'أضف شرائح الكوسة والطماطم المفرومة إلى المقلاة واطه لمدة 5 دقائق إضافية.',
          'زين الطبق بالأعشاب الطازجة وقدمه ساخناً.'
        ],
        total_calories: 320,
        total_protein_g: 35,
        total_carbs_g: 8,
        total_fat_g: 14,
        image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80',
        country_origin: 'GLOBAL',
        category: 'lunch',
        tags: ['AI Generated', 'High Protein', 'Low Carb'],
      };

      // Add to store generated list and navigate to detail page
      addGeneratedRecipe(mockGenerated);
      router.push(`/recipes/${mockGenerated.id}` as any);
    }, 2000);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9F8' }}>
      {/* Header */}
      <View className={`flex-row justify-between items-center px-5 py-4 bg-white border-b border-border-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
        <View className="w-16" />
        <Text className="text-base font-outfit-bold text-text-primary">{t.title}</Text>
        <View className="w-16" />
      </View>

      {/* Tab Selector Segment */}
      <View className="flex-row bg-[#EAECEB] p-1 rounded-2xl mx-5 mt-4">
        <PresstoButton 
          onPress={() => setActiveTab('recommend')}
          className="flex-1 py-2 rounded-xl items-center"
          style={activeTab === 'recommend' ? styles.activeTab : null}
        >
          <Text className={`text-xs font-outfit-medium ${activeTab === 'recommend' ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
            {t.recommend}
          </Text>
        </PresstoButton>
        <PresstoButton 
          onPress={() => setActiveTab('pantry')}
          className="flex-1 py-2 rounded-xl items-center"
          style={activeTab === 'pantry' ? styles.activeTab : null}
        >
          <Text className={`text-xs font-outfit-medium ${activeTab === 'pantry' ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
            {t.pantry}
          </Text>
        </PresstoButton>
      </View>

      {activeTab === 'recommend' ? (
        /* Recommendations Feed */
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {feedRecipes.map((recipe) => (
            <PresstoButton
              key={recipe.id}
              onPress={() => router.push(`/recipes/${recipe.id}` as any)}
              className="bg-white rounded-3xl border border-border-muted mb-5 overflow-hidden shadow-sm"
            >
              <Image source={{ uri: recipe.image_url }} className="w-full h-40 resize-cover" />
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
            </PresstoButton>
          ))}
        </ScrollView>
      ) : (
        /* Refrigerator Pantry inventory list builder */
        <View className="flex-1 p-5">
          {isGenerating ? (
            /* Shimmer loading skeleton */
            <View className="flex-1 justify-center items-center pb-20">
              <ActivityIndicator size="large" color="#4C6E58" />
              <Text className="mt-6 text-sm font-outfit-bold text-text-primary">
                {isRtl ? 'جارٍ صياغة وصفة مغذية مخصصة...' : 'Crafting custom nutritious recipe...'}
              </Text>
            </View>
          ) : (
            <View className="flex-1 justify-between">
              <ScrollView showsVerticalScrollIndicator={false}>
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
                        className={`flex-row items-center bg-white border border-border-muted px-3 py-2 rounded-2xl mr-2 mb-2 ${
                          isSelected ? 'bg-accent-mint border-accent-sage' : ''
                        }`}
                      >
                        <Text className="mr-1 text-sm">{ing.icon}</Text>
                        <Text className={`text-xs font-inter-medium ${isSelected ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
                          {name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Custom input */}
                <View className={`flex-row items-center mt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <TextInput
                    className={`flex-1 bg-white border border-border-muted rounded-2xl px-4 py-3 font-inter-regular text-xs text-text-primary ${
                      isRtl ? 'text-right' : 'text-left'
                    }`}
                    placeholder={t.addCustom}
                    placeholderTextColor="#9CA19E"
                    value={customIngredient}
                    onChangeText={setCustomIngredient}
                  />
                  <TouchableOpacity 
                    onPress={handleAddCustomIngredient}
                    className="w-11 h-11 rounded-2xl bg-accent-sage justify-center items-center ml-2"
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
