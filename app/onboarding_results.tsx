import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';

import { useDiaryStore } from '@/store/useDiaryStore';
import { PresstoButton } from '@/components/PresstoButton';
import { RecipeType, localRecipes } from '@/data/localRecipes';
import MealSwapBottomSheet from '@/components/MealSwapBottomSheet';

export default function OnboardingResultsScreen() {
  const router = useRouter();
  const profile = useDiaryStore((state) => state.profile);

  // Targets are computed in onboarding.tsx and set in Zustand
  const targetCalories = profile?.target_calories || 1850;
  const targetProtein = profile?.target_protein_g || 130;
  const targetCarbs = profile?.target_carbs_g || 190;
  const targetFat = profile?.target_fat_g || 60;
  const country = profile?.country || 'EG';
  const goal = profile?.health_goal || 'lose_weight';
  const dietType = profile?.diet_type || 'classic';
  const exclusions = profile?.exclusions || [];
  const dislikedIngredients = profile?.disliked_ingredients || [];

  // Selected meals for the 4 slots
  const [selectedMeals, setSelectedMeals] = useState<Record<string, RecipeType>>({});
  
  // Swap Sheet state
  const [swapVisible, setSwapVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');

  // Load initial 4 meals matching preferences
  useEffect(() => {
    const categories = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
    const initialSelected: Record<string, RecipeType> = {};
    
    categories.forEach((cat) => {
      let matches = localRecipes.filter((recipe) => {
        if (recipe.category !== cat) return false;
        if (recipe.country_origin !== country && recipe.country_origin !== 'GLOBAL') return false;

        // Diet Type match
        if (dietType && dietType !== 'classic') {
          const tags = recipe.tags.map((t) => t.toLowerCase());
          if (dietType === 'vegetarian') {
            if (!tags.includes('vegetarian') && !tags.includes('vegan')) return false;
          } else if (dietType === 'vegan') {
            if (!tags.includes('vegan')) return false;
          } else if (dietType === 'keto' || dietType === 'low_carb') {
            if (!tags.includes('keto-friendly') && !tags.includes('low carb')) return false;
          }
        }

        // Exclusions filter
        if (exclusions && exclusions.length > 0) {
          const recipeTitle = (recipe.title_en + ' ' + recipe.description_en).toLowerCase();
          const ingredientsList = recipe.ingredients.map((i) => i.name_en.toLowerCase());
          for (const excl of exclusions) {
            const check = excl.toLowerCase().replace('-free', '');
            if (ingredientsList.some((i) => i.includes(check)) || recipeTitle.includes(check)) {
              return false;
            }
          }
        }

        // Disliked ingredients filter
        if (dislikedIngredients && dislikedIngredients.length > 0) {
          const recipeTitle = (recipe.title_en + ' ' + recipe.description_en).toLowerCase();
          const ingredientsList = recipe.ingredients.map((i) => i.name_en.toLowerCase());
          for (const disliked of dislikedIngredients) {
            const check = disliked.toLowerCase();
            if (ingredientsList.some((i) => i.includes(check)) || recipeTitle.includes(check)) {
              return false;
            }
          }
        }

        return true;
      });

      // Fallbacks
      if (matches.length === 0) {
        matches = localRecipes.filter((recipe) => recipe.category === cat && (recipe.country_origin === country || recipe.country_origin === 'GLOBAL'));
      }
      if (matches.length === 0) {
        matches = localRecipes.filter((recipe) => recipe.category === cat);
      }

      initialSelected[cat] = matches[0] || localRecipes.find((r) => r.category === cat)!;
    });

    setSelectedMeals(initialSelected);
  }, [country, dietType, exclusions, dislikedIngredients]);

  const handleOpenSwap = (category: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    setActiveCategory(category);
    setSwapVisible(true);
  };

  const handleSelectMeal = (recipe: RecipeType) => {
    setSelectedMeals((prev) => ({
      ...prev,
      [recipe.category]: recipe,
    }));
  };

  // SVG Chart data based on goal
  const chartWidth = 320;
  const chartHeight = 120;
  
  const getChartPath = () => {
    if (goal === 'lose_weight') {
      return `M 20 20 Q 100 50, 180 80 T 300 100`;
    } else if (goal === 'gain_weight') {
      return `M 20 100 Q 100 80, 180 50 T 300 20`;
    } else {
      return `M 20 60 Q 100 55, 180 65 T 300 60`;
    }
  };

  const getPoints = () => {
    if (goal === 'lose_weight') {
      return [
        { x: 20, y: 20, label: 'Wk 1' },
        { x: 110, y: 55, label: 'Wk 2' },
        { x: 200, y: 82, label: 'Wk 3' },
        { x: 300, y: 100, label: 'Wk 4' },
      ];
    } else if (goal === 'gain_weight') {
      return [
        { x: 20, y: 100, label: 'Wk 1' },
        { x: 110, y: 78, label: 'Wk 2' },
        { x: 200, y: 48, label: 'Wk 3' },
        { x: 300, y: 20, label: 'Wk 4' },
      ];
    } else {
      return [
        { x: 20, y: 60, label: 'Wk 1' },
        { x: 110, y: 57, label: 'Wk 2' },
        { x: 200, y: 63, label: 'Wk 3' },
        { x: 300, y: 60, label: 'Wk 4' },
      ];
    }
  };

  const points = getPoints();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9F8' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        {/* Title */}
        <Text className="font-outfit-semibold text-[11px] text-text-muted uppercase tracking-wider mb-2">
          Calculations Complete
        </Text>
        <Text className="font-outfit-bold text-3xl text-text-primary tracking-tight mb-2">
          Your custom <Text style={{ fontStyle: 'italic' }}>plan</Text>.
        </Text>
        <Text className="font-inter text-sm text-text-muted leading-relaxed mb-6">
          We have generated your target macros and weight projection based on your profile inputs.
        </Text>

        {/* Target Calories Bento Box */}
        <View className="bg-white rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
          <Text className="font-outfit-bold text-xs text-text-primary mb-1">Daily Target Calories</Text>
          <Text className="font-outfit-bold text-4xl text-nutrient-calories tracking-tight mb-4">{targetCalories} kcal</Text>
          
          <Text className="font-outfit-bold text-xs text-text-primary mb-3">Daily Macronutrient Targets</Text>
          <View className="flex-row justify-between gap-2">
            
            {/* Protein */}
            <View className="flex-1 bg-[#7E9DB0]/10 rounded-2xl p-3 items-center">
              <Text className="font-outfit-bold text-base text-[#5D7E92]">{targetProtein}g</Text>
              <Text className="font-inter text-[10px] text-[#5D7E92] font-semibold mt-0.5">Protein</Text>
            </View>

            {/* Carbs */}
            <View className="flex-1 bg-[#D3B177]/10 rounded-2xl p-3 items-center">
              <Text className="font-outfit-bold text-base text-[#A9894E]">{targetCarbs}g</Text>
              <Text className="font-inter text-[10px] text-[#A9894E] font-semibold mt-0.5">Carbs</Text>
            </View>

            {/* Fat */}
            <View className="flex-1 bg-[#9CA19E]/10 rounded-2xl p-3 items-center">
              <Text className="font-outfit-bold text-base text-[#767B78]">{targetFat}g</Text>
              <Text className="font-inter text-[10px] text-[#767B78] font-semibold mt-0.5">Fats</Text>
            </View>
          </View>
        </View>

        {/* SVG Weight projection graph */}
        <View className="bg-white rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
          <Text className="font-outfit-bold text-xs text-text-primary mb-1">Predicted Weight Trajectory</Text>
          <Text className="font-inter text-[10px] text-text-muted mb-4">4-week projection curve based on metabolic targets</Text>
          
          <View className="items-center my-2 justify-center">
            <Svg width={chartWidth} height={chartHeight}>
              <Path
                d={getChartPath()}
                fill="none"
                stroke="#4C6E58"
                strokeWidth={3}
              />
              {points.map((p, idx) => (
                <React.Fragment key={idx}>
                  <Circle
                    cx={p.x}
                    cy={p.y}
                    r={5}
                    fill="#F8F9F8"
                    stroke="#4C6E58"
                    strokeWidth={2}
                  />
                  <SvgText
                    x={p.x}
                    y={p.y > 60 ? p.y - 12 : p.y + 18}
                    fontSize="9"
                    fontFamily="Inter-Medium"
                    fill="#626A66"
                    textAnchor="middle"
                  >
                    {p.label}
                  </SvgText>
                </React.Fragment>
              ))}
            </Svg>
          </View>
        </View>

        {/* Daily 4-Meal Plan Preview */}
        <Text className="font-outfit-bold text-lg text-text-primary mb-3">Daily Meal Plan Preview</Text>
        
        {['breakfast', 'lunch', 'dinner', 'snack'].map((category) => {
          const recipe = selectedMeals[category];
          if (!recipe) return null;

          return (
            <View key={category} className="bg-white rounded-3xl border border-border-muted p-5 mb-4 shadow-sm relative overflow-hidden">
              {/* Card Header */}
              <View className="flex-row justify-between items-center mb-3">
                <View className="bg-accent-mint px-2.5 py-1 rounded-full">
                  <Text className="text-[10px] font-outfit-bold text-accent-sage uppercase">{category}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleOpenSwap(category as any)}
                  className="flex-row items-center bg-bg-base border border-border-muted px-2.5 py-1 rounded-full gap-1"
                >
                  <Ionicons name="refresh-outline" size={12} color="#4C6E58" />
                  <Text className="text-[10px] font-outfit-bold text-accent-sage">Swap</Text>
                </TouchableOpacity>
              </View>

              {/* Meal Title & Calories */}
              <Text className="font-outfit-bold text-base text-text-primary mb-1">{recipe.title_en}</Text>
              <Text className="font-inter text-xs text-text-muted mb-4">
                {recipe.total_calories} kcal · P: {recipe.total_protein_g}g · C: {recipe.total_carbs_g}g · F: {recipe.total_fat_g}g
              </Text>

              {/* Locked recipe details */}
              <View className="relative min-h-[90px] justify-center overflow-hidden rounded-2xl">
                {/* Fake/Blurred content */}
                <View className="opacity-15" pointerEvents="none">
                  <Text className="font-outfit-bold text-[10px] text-text-primary mb-1.5">Ingredients:</Text>
                  {recipe.ingredients.map((ing, i) => (
                    <Text key={i} className="font-inter text-[9px] text-text-muted mb-0.5">• {ing.weight_g}g {ing.name_en}</Text>
                  ))}
                  <Text className="font-outfit-bold text-[10px] text-text-primary mt-2 mb-1">Directions:</Text>
                  <Text className="font-inter text-[9px] text-text-muted">1. Place the ingredients in a large bowl...</Text>
                </View>

                {/* Frosted Glassmorphic Lock Overlay */}
                <View style={styles.frostedOverlay} className="absolute inset-0 items-center justify-center p-3 border border-white/40">
                  <Ionicons name="lock-closed" size={16} color="#4C6E58" className="mb-1" />
                  <Text className="font-outfit-bold text-xs text-text-primary text-center">Recipe details locked</Text>
                  <Text className="font-inter text-[9px] text-text-muted text-center mt-0.5">Create your account to reveal instructions</Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* Claim Plan Action Card */}
        <View className="bg-white border border-border-muted rounded-3xl p-5 mt-4 shadow-lg">
          <View className="flex-row items-center gap-1.5 mb-2">
            <Ionicons name="lock-closed" size={16} color="#626A66" />
            <Text className="font-outfit-semibold text-[11px] text-text-muted uppercase tracking-wider">
              More details waiting
            </Text>
          </View>
          
          <Text className="font-outfit-bold text-xl text-text-primary tracking-tight mb-2">
            Unlock your full personalized health profile
          </Text>
          
          <Text className="font-inter text-xs text-text-muted leading-relaxed mb-5">
            Sign up free to unlock your custom calorie calculators, full AI meal diary scanner, localized recipe search, and shopping lists.
          </Text>

          <PresstoButton
            onPress={() => router.push('/sign-up')}
            className="bg-accent-sage rounded-2xl py-4 flex-row justify-center items-center shadow-sm"
          >
            <Text className="text-white font-outfit-bold text-sm">Claim My Personalized Plan & Start</Text>
          </PresstoButton>
        </View>

      </ScrollView>

      {/* Meal Swap Bottom Sheet */}
      <MealSwapBottomSheet
        visible={swapVisible}
        onClose={() => setSwapVisible(false)}
        mealCategory={activeCategory}
        currentRecipe={selectedMeals[activeCategory] || null}
        onSelectMeal={handleSelectMeal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  frostedOverlay: {
    backgroundColor: 'rgba(248, 249, 248, 0.9)',
    backdropFilter: 'blur(4px)',
  } as any,
});
