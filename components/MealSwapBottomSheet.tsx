import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecipeType, localRecipes } from '@/data/localRecipes';
import { useDiaryStore } from '@/store/useDiaryStore';
import { useColorScheme } from 'nativewind';

interface MealSwapBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  mealCategory: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  currentRecipe: RecipeType | null;
  onSelectMeal: (recipe: RecipeType) => void;
}

export default function MealSwapBottomSheet({
  visible,
  onClose,
  mealCategory,
  currentRecipe,
  onSelectMeal,
}: MealSwapBottomSheetProps) {
  const profile = useDiaryStore((state) => state.profile);
  const setProfile = useDiaryStore((state) => state.setProfile);

  const country = profile?.country || 'EG';
  const dietType = profile?.diet_type || 'classic';
  const exclusions = profile?.exclusions || [];
  const dislikedIngredients = profile?.disliked_ingredients || [];

  // Determine excludable ingredient of the current recipe
  const getExcludableIngredient = (recipe: RecipeType | null): string => {
    if (!recipe) return '';
    const nameLower = (recipe.title_en + ' ' + recipe.description_en).toLowerCase();
    
    if (nameLower.includes('bread') || nameLower.includes('falafel')) return 'Bread';
    if (nameLower.includes('rice') || nameLower.includes('koshary') || nameLower.includes('salmon')) return 'Rice';
    if (nameLower.includes('meat') || nameLower.includes('kofta') || nameLower.includes('chicken') || nameLower.includes('lamb')) return 'Meat';
    if (nameLower.includes('cheese') || nameLower.includes('milk') || nameLower.includes('butter')) return 'Dairy';
    if (nameLower.includes('egg') || nameLower.includes('shakshuka')) return 'Eggs';
    return 'Grains';
  };

  const ingredientToExclude = getExcludableIngredient(currentRecipe);
  const isExcludedAlready = dislikedIngredients.some(
    (item) => item.toLowerCase() === ingredientToExclude.toLowerCase()
  );

  const [excludeChecked, setExcludeChecked] = useState(isExcludedAlready);

  useEffect(() => {
    setExcludeChecked(isExcludedAlready);
  }, [isExcludedAlready, currentRecipe]);

  // Handle excludable ingredient toggle
  const handleToggleExclude = () => {
    if (!ingredientToExclude) return;

    const currentList = [...dislikedIngredients];
    let newList: string[];

    if (excludeChecked) {
      // Remove exclusion
      newList = currentList.filter(
        (item) => item.toLowerCase() !== ingredientToExclude.toLowerCase()
      );
      setExcludeChecked(false);
    } else {
      // Add exclusion
      newList = [...currentList, ingredientToExclude];
      setExcludeChecked(true);
    }

    // Update in Zustand
    setProfile({ disliked_ingredients: newList });
  };

  // Helper to filter alternative recipes
  const getAlternatives = (): RecipeType[] => {
    const list = localRecipes.filter((recipe) => {
      // Same category
      if (recipe.category !== mealCategory) return false;
      // Skip the currently active recipe
      if (currentRecipe && recipe.id === currentRecipe.id) return false;
      // Country match
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

    // Fallback: If no alternatives are found with tight filters, widen the search
    if (list.length === 0) {
      return localRecipes.filter(
        (recipe) =>
          recipe.category === mealCategory &&
          (!currentRecipe || recipe.id !== currentRecipe.id)
      );
    }

    return list.slice(0, 2); // Show top 2 alternatives
  };

  const alternatives = getAlternatives();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} className="flex-1 bg-black/40 justify-end">
        <Pressable className="bg-bg-card rounded-t-3xl p-6 pb-10 border-t border-border-muted max-h-[85%]">
          {/* Drag Handle */}
          <View className="w-12 h-1.5 bg-border-muted rounded-full self-center mb-5" />

          {/* Header */}
          <View className="flex-row justify-between items-center mb-5">
            <Text className="font-outfit-bold text-xl text-text-primary capitalize">
              Swap {mealCategory}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close-circle" size={24} color={isDark ? '#8A9690' : '#626A66'} />
            </TouchableOpacity>
          </View>

          {/* Exclude Checkbox */}
          {ingredientToExclude ? (
            <TouchableOpacity
              onPress={handleToggleExclude}
              className="flex-row items-center bg-[#F3F6F3] dark:bg-[#1F2E25] border border-border-muted rounded-2xl p-4 mb-6"
            >
              <Ionicons
                name={excludeChecked ? 'checkbox' : 'square-outline'}
                size={20}
                color={isDark ? '#5C856C' : '#4C6E58'}
              />
              <Text className="font-inter text-xs text-text-primary ml-2.5">
                Exclude <Text className="font-inter-bold">{ingredientToExclude}</Text> from future plans
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Title */}
          <Text className="font-outfit-semibold text-xs text-text-primary uppercase tracking-wider mb-3">
            Alternative Options
          </Text>

          {/* Scrollable list */}
          <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
            <View className="gap-3">
              {alternatives.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  onPress={() => {
                    onSelectMeal(recipe);
                    onClose();
                  }}
                  className="border border-border-muted rounded-2xl p-4 bg-bg-base flex-row justify-between items-center"
                >
                  <View className="flex-1 pr-3">
                    <Text className="font-outfit-bold text-sm text-text-primary mb-1">
                      {recipe.title_en}
                    </Text>
                    <Text className="font-inter text-[10px] text-text-muted">
                      {recipe.total_calories} kcal · P: {recipe.total_protein_g}g · C: {recipe.total_carbs_g}g · F: {recipe.total_fat_g}g
                    </Text>
                  </View>
                  <View className="bg-accent-sage/10 px-3 py-1.5 rounded-xl">
                    <Text className="font-outfit-bold text-xs text-accent-sage">Select</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {alternatives.length === 0 ? (
                <Text className="font-inter text-xs text-text-muted text-center py-6">
                  No alternative meals found.
                </Text>
              ) : null}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
