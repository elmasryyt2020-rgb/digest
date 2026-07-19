import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { RecipeType } from '@/data/localRecipes';
import { supabase } from '@/lib/supabase';

export interface MealPlanMeal {
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  ingredients: {
    name_en: string;
    name_ar: string;
    weight_g: number;
    calories_per_100g?: number;
    protein_per_100g?: number;
    carbs_per_100g?: number;
    fat_per_100g?: number;
  }[];
  steps_en: string[];
  steps_ar: string[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  tags: string[];
  image_url: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface MealPlan {
  id?: string;
  title: string;
  meals: {
    breakfast: MealPlanMeal;
    lunch: MealPlanMeal;
    dinner: MealPlanMeal;
    snack: MealPlanMeal;
  };
  grocery_list: { name_en: string; name_ar: string; weight_g: number }[];
  created_at?: string;
}


export interface UserProfile {
  name: string;
  email?: string;
  gender: 'male' | 'female';
  age: number;
  weight_kg: number;
  height_cm: number;
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
  health_goal: 'lose_weight' | 'maintain_weight' | 'gain_weight';
  language: 'ar' | 'en';
  country: 'EG' | 'GB';
  onboarded?: boolean;
  diet_type?: 'classic' | 'vegetarian' | 'vegan' | 'keto' | 'low_carb';
  exclusions?: string[];
  disliked_ingredients?: string[];
  
  // Targets (calculated dynamically but editable)
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  target_water_ml: number;

  goal_weight_kg?: number;
  
  // Measurement Units
  unit_weight?: 'kg' | 'lbs';
  unit_height?: 'cm' | 'ft_in';
  unit_water?: 'ml' | 'fl_oz';

  // Push Notifications / Reminders
  reminder_meals?: boolean;
  reminder_water?: boolean;
  reminder_workout?: boolean;

  // Custom Nutrition Adjustments / Macros
  macro_preset?: 'balanced' | 'high_protein' | 'keto' | 'custom';
  macro_carbs_pct?: number;
  macro_protein_pct?: number;
  macro_fat_pct?: number;

  // App settings extension
  app_theme?: 'light' | 'dark' | 'system';
}

export interface FoodLogEntry {
  id: string;
  food_id: string;
  name_en: string;
  name_ar: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  amount_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_date: string; // YYYY-MM-DD
  logged_at: string; // ISO string
}

export interface WaterLogEntry {
  id: string;
  amount_ml: number;
  logged_date: string;
  logged_at: string;
}

export interface WorkoutLogEntry {
  id: string;
  activity_id: string;
  activity_name_en: string;
  activity_name_ar: string;
  met_value: number;
  duration_minutes: number;
  calories_burned: number;
  logged_date: string;
  logged_at: string;
}

interface DiaryState {
  isTrial: boolean;
  profile: UserProfile | null;
  foodLogs: FoodLogEntry[];
  waterLogs: WaterLogEntry[];
  workoutLogs: WorkoutLogEntry[];
  generatedRecipesCount: number;
  isSignUpModalOpen: boolean;
  generatedRecipes: RecipeType[];
  
  // Actions
  setProfile: (profile: Partial<UserProfile>) => void;
  initializeDefaultProfile: () => void;
  addFoodLog: (entry: Omit<FoodLogEntry, 'id' | 'logged_at'>) => boolean; // Returns true if logged, false if blocked by trial
  deleteFoodLog: (id: string) => void;
  addWaterLog: (amount_ml: number, date: string) => void;
  addWorkoutLog: (entry: Omit<WorkoutLogEntry, 'id' | 'calories_burned' | 'logged_at'>) => void;
  deleteWorkoutLog: (id: string) => void;
  incrementRecipesCount: () => boolean; // Returns true if allowed, false if blocked by trial
  setSignUpModalOpen: (open: boolean) => void;
  triggerSignUp: () => void;
  addGeneratedRecipe: (recipe: RecipeType) => RecipeType;
  activeMealPlan: MealPlan | null;
  setActiveMealPlan: (plan: MealPlan | null) => void;
  syncToSupabase: (userId: string) => Promise<void>;
  fetchFromSupabase: (userId: string) => Promise<void>;
  resetAll: () => void;
}

// Calculate targets using Mifflin-St Jeor
export function calculateNutrientTargets(profile: Omit<UserProfile, 'target_calories' | 'target_protein_g' | 'target_carbs_g' | 'target_fat_g' | 'target_water_ml'>): Pick<UserProfile, 'target_calories' | 'target_protein_g' | 'target_carbs_g' | 'target_fat_g' | 'target_water_ml'> {
  const { weight_kg, height_cm, age, gender, activity_level, health_goal } = profile;

  // 1. Calculate BMR
  let bmr = 0;
  if (gender === 'male') {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  } else {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  }

  // 2. Active Multipliers (TDEE)
  const multipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
  };
  const tdee = bmr * multipliers[activity_level];

  // 3. Goal Adjustments
  let target_calories = tdee;
  if (health_goal === 'lose_weight') {
    target_calories = tdee - 500;
  } else if (health_goal === 'gain_weight') {
    target_calories = tdee + 300;
  }
  // Clamp calories to minimum safe level
  target_calories = Math.max(1200, Math.round(target_calories));

  // 4. Macro Targets
  let target_protein_g = 0;
  let target_fat_g = 0;
  let target_carbs_g = 0;

  if (
    profile.macro_carbs_pct !== undefined &&
    profile.macro_protein_pct !== undefined &&
    profile.macro_fat_pct !== undefined
  ) {
    const cPct = profile.macro_carbs_pct;
    const pPct = profile.macro_protein_pct;
    const fPct = profile.macro_fat_pct;
    target_protein_g = Math.round((target_calories * (pPct / 100)) / 4);
    target_fat_g = Math.round((target_calories * (fPct / 100)) / 9);
    target_carbs_g = Math.round((target_calories * (cPct / 100)) / 4);
  } else {
    // Protein: 2.0g per kg of body weight
    target_protein_g = Math.round(weight_kg * 2.0);
    
    // Fat: 25% of total calories (1g fat = 9 kcal)
    target_fat_g = Math.round((target_calories * 0.25) / 9);

    // Carbs: Remaining calories (1g carb = 4 kcal)
    const protein_calories = target_protein_g * 4;
    const fat_calories = target_fat_g * 9;
    const remaining_calories = target_calories - (protein_calories + fat_calories);
    target_carbs_g = Math.max(50, Math.round(remaining_calories / 4));
  }

  // Water: 35ml per kg of body weight, rounded to nearest 250ml
  const target_water_ml = Math.round((weight_kg * 35) / 250) * 250;

  return {
    target_calories,
    target_protein_g,
    target_carbs_g,
    target_fat_g,
    target_water_ml,
  };
}

const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  const r = Math.random() * 16 | 0;
  return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
});

const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
};

const getOrGenerateUuid = (str: string) => {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  return uuid();
};


export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      isTrial: true,
      profile: null,
      foodLogs: [],
      waterLogs: [],
      workoutLogs: [],
      generatedRecipesCount: 0,
      isSignUpModalOpen: false,
      generatedRecipes: [],
      activeMealPlan: null,

      initializeDefaultProfile: () => {
        if (get().profile) return;

        // Auto-detect language and country
        const locales = Localization.getLocales();
        const deviceLanguage = locales[0]?.languageCode;
        const activeLanguage = (deviceLanguage === 'ar' ? 'ar' : 'en') as 'ar' | 'en';
        
        // Infer default country
        const regionCode = locales[0]?.regionCode;
        const activeCountry = (regionCode === 'EG' || regionCode === 'GB' ? regionCode : 'EG') as 'EG' | 'GB';

        const defaultRawProfile: Omit<UserProfile, 'target_calories' | 'target_protein_g' | 'target_carbs_g' | 'target_fat_g' | 'target_water_ml'> = {
          name: activeLanguage === 'ar' ? 'زائر' : 'Guest',
          gender: 'male' as const,
          age: 28,
          weight_kg: 80,
          height_cm: 178,
          activity_level: 'moderately_active' as const,
          health_goal: 'lose_weight' as const,
          language: activeLanguage,
          country: activeCountry,
          onboarded: false,
          diet_type: 'classic',
          exclusions: [],
          disliked_ingredients: [],
          goal_weight_kg: 70,
          unit_weight: 'kg',
          unit_height: 'cm',
          unit_water: 'ml',
          reminder_meals: true,
          reminder_water: true,
          reminder_workout: true,
          macro_preset: 'balanced',
          macro_carbs_pct: 40,
          macro_protein_pct: 30,
          macro_fat_pct: 30,
          app_theme: 'system',
        };

        const targets = calculateNutrientTargets(defaultRawProfile);

        set({
          profile: {
            ...defaultRawProfile,
            ...targets,
          } as UserProfile,
        });
      },

      setProfile: (newProfileFields) => {
        set((state) => {
          const currentProfile = state.profile;
          if (!currentProfile) return {};

          const updatedRaw = {
            ...currentProfile,
            ...newProfileFields,
          };

          // Re-calculate targets if core metrics or custom macro percentages change
          const coreMetricsChanged =
            newProfileFields.weight_kg !== undefined ||
            newProfileFields.height_cm !== undefined ||
            newProfileFields.age !== undefined ||
            newProfileFields.gender !== undefined ||
            newProfileFields.activity_level !== undefined ||
            newProfileFields.health_goal !== undefined ||
            newProfileFields.macro_carbs_pct !== undefined ||
            newProfileFields.macro_protein_pct !== undefined ||
            newProfileFields.macro_fat_pct !== undefined;

          const targets = coreMetricsChanged
            ? calculateNutrientTargets(updatedRaw)
            : {
                target_calories: updatedRaw.target_calories,
                target_protein_g: updatedRaw.target_protein_g,
                target_carbs_g: updatedRaw.target_carbs_g,
                target_fat_g: updatedRaw.target_fat_g,
                target_water_ml: updatedRaw.target_water_ml,
              };

          return {
            profile: {
              ...updatedRaw,
              ...targets,
            },
          };
        });

        // Sync to Supabase in background if logged in
        (async () => {
          try {
            const userId = await getCurrentUserId();
            if (userId) {
              const profile = get().profile;
              if (profile) {
                const birthYear = new Date().getFullYear() - (profile.age || 28);
                const date_of_birth = `${birthYear}-01-01`;

                await supabase.from('profiles').upsert({
                  id: userId,
                  email: profile.email || '',
                  display_name: profile.name || 'Guest',
                  language: profile.language || 'ar',
                  country: profile.country || 'EG',
                  date_of_birth,
                  gender: profile.gender || 'male',
                  height_cm: profile.height_cm || 175,
                  weight_kg: profile.weight_kg || 75,
                  activity_level: profile.activity_level || 'moderately_active',
                  health_goal: profile.health_goal || 'lose_weight',
                  target_calories: profile.target_calories || 2000,
                  target_protein_g: profile.target_protein_g || 120,
                  target_carbs_g: profile.target_carbs_g || 200,
                  target_fat_g: profile.target_fat_g || 65,
                  target_water_ml: profile.target_water_ml || 2500,
                  diet_type: profile.diet_type || 'classic',
                  exclusions: profile.exclusions || [],
                  disliked_ingredients: profile.disliked_ingredients || [],
                  goal_weight_kg: profile.goal_weight_kg || null,
                  unit_weight: profile.unit_weight || 'kg',
                  unit_height: profile.unit_height || 'cm',
                  unit_water: profile.unit_water || 'ml',
                  reminder_meals: profile.reminder_meals !== undefined ? profile.reminder_meals : true,
                  reminder_water: profile.reminder_water !== undefined ? profile.reminder_water : true,
                  reminder_workout: profile.reminder_workout !== undefined ? profile.reminder_workout : true,
                  macro_preset: profile.macro_preset || 'balanced',
                  macro_carbs_pct: profile.macro_carbs_pct || 40,
                  macro_protein_pct: profile.macro_protein_pct || 30,
                  macro_fat_pct: profile.macro_fat_pct || 30,
                  app_theme: profile.app_theme || 'system',
                });
              }
            }
          } catch (err) {
            console.error('Error syncing profile update to Supabase:', err);
          }
        })();
      },

      addFoodLog: (entry) => {
        const id = uuid();
        const logged_at = new Date().toISOString();
        const newEntry: FoodLogEntry = {
          ...entry,
          id,
          logged_at,
        };

        set((state) => ({
          foodLogs: [...state.foodLogs, newEntry],
        }));

        (async () => {
          try {
            const userId = await getCurrentUserId();
            if (userId) {
              const amount = entry.amount_g || 100;
              const calories_per_100g = ((entry.calories || 0) / amount) * 100;
              const protein_per_100g = ((entry.protein || 0) / amount) * 100;
              const carbs_per_100g = ((entry.carbs || 0) / amount) * 100;
              const fat_per_100g = ((entry.fat || 0) / amount) * 100;

              await supabase.from('foods_cache').upsert({
                id: entry.food_id,
                name_en: entry.name_en,
                name_ar: entry.name_ar,
                calories_per_100g,
                protein_per_100g,
                carbs_per_100g,
                fat_per_100g,
                source: entry.food_id.startsWith('usda:') ? 'usda' : (entry.food_id.startsWith('off:') ? 'off' : 'custom'),
              }, { onConflict: 'id', ignoreDuplicates: true } as any);

              await supabase.from('food_logs').upsert({
                id,
                user_id: userId,
                food_id: entry.food_id,
                meal_type: entry.meal_type,
                amount_g: entry.amount_g,
                logged_date: entry.logged_date,
                logged_at,
              });
            }
          } catch (err) {
            console.error('Error syncing added food log:', err);
          }
        })();

        return true;
      },

      deleteFoodLog: (id) => {
        set((state) => ({
          foodLogs: state.foodLogs.filter((log) => log.id !== id),
        }));

        (async () => {
          try {
            const userId = await getCurrentUserId();
            if (userId) {
              await supabase.from('food_logs').delete().eq('id', id).eq('user_id', userId);
            }
          } catch (err) {
            console.error('Error syncing deleted food log:', err);
          }
        })();
      },

      addWaterLog: (amount_ml, date) => {
        const id = uuid();
        const logged_at = new Date().toISOString();
        const newEntry: WaterLogEntry = {
          id,
          amount_ml,
          logged_date: date,
          logged_at,
        };
        set((state) => ({
          waterLogs: [...state.waterLogs, newEntry],
        }));

        (async () => {
          try {
            const userId = await getCurrentUserId();
            if (userId) {
              await supabase.from('water_logs').upsert({
                id,
                user_id: userId,
                amount_ml,
                logged_date: date,
                logged_at,
              });
            }
          } catch (err) {
            console.error('Error syncing added water log:', err);
          }
        })();
      },

      addWorkoutLog: (entry) => {
        const weight = get().profile?.weight_kg || 80;
        const durationHours = entry.duration_minutes / 60;
        const calories_burned = Math.round(entry.met_value * weight * durationHours);
        const id = uuid();
        const logged_at = new Date().toISOString();

        const newEntry: WorkoutLogEntry = {
          ...entry,
          id,
          calories_burned,
          logged_at,
        };

        set((state) => ({
          workoutLogs: [...state.workoutLogs, newEntry],
        }));

        (async () => {
          try {
            const userId = await getCurrentUserId();
            if (userId) {
              await supabase.from('workout_logs').upsert({
                id,
                user_id: userId,
                activity_name_en: entry.activity_name_en,
                activity_name_ar: entry.activity_name_ar,
                met_value: entry.met_value,
                duration_minutes: entry.duration_minutes,
                calories_burned,
                logged_date: entry.logged_date,
                logged_at,
              });
            }
          } catch (err) {
            console.error('Error syncing added workout log:', err);
          }
        })();
      },

      deleteWorkoutLog: (id) => {
        set((state) => ({
          workoutLogs: state.workoutLogs.filter((log) => log.id !== id),
        }));

        (async () => {
          try {
            const userId = await getCurrentUserId();
            if (userId) {
              await supabase.from('workout_logs').delete().eq('id', id).eq('user_id', userId);
            }
          } catch (err) {
            console.error('Error syncing deleted workout log:', err);
          }
        })();
      },

      incrementRecipesCount: () => {
        set((state) => ({
          generatedRecipesCount: state.generatedRecipesCount + 1,
        }));
        return true;
      },

      setSignUpModalOpen: (open) => set({ isSignUpModalOpen: open }),

      triggerSignUp: () => {
        set({ isSignUpModalOpen: true });
      },

      addGeneratedRecipe: (recipe) => {
        const recipeId = recipe.id.startsWith('ai_') ? uuid() : recipe.id;
        const updatedRecipe = { ...recipe, id: recipeId };

        set((state) => ({
          generatedRecipes: [...state.generatedRecipes, updatedRecipe]
        }));

        (async () => {
          try {
            const userId = await getCurrentUserId();
            if (userId) {
              await supabase.from('generated_recipes').upsert({
                id: recipeId,
                user_id: userId,
                title_en: recipe.title_en,
                title_ar: recipe.title_ar,
                description_en: recipe.description_en,
                description_ar: recipe.description_ar,
                ingredients: recipe.ingredients,
                steps_en: recipe.steps_en,
                steps_ar: recipe.steps_ar,
                total_calories: recipe.total_calories,
                total_protein_g: recipe.total_protein_g,
                total_carbs_g: recipe.total_carbs_g,
                total_fat_g: recipe.total_fat_g,
                image_url: recipe.image_url,
                country_origin: recipe.country_origin || 'EG',
              });
            }
          } catch (err) {
            console.error('Error syncing added recipe to Supabase:', err);
          }
        })();

        return updatedRecipe;
      },

      setActiveMealPlan: (plan) => {
        set({ activeMealPlan: plan });
      },

      syncToSupabase: async (userId) => {
        const profile = get().profile;
        if (!profile) return;

        // Ensure all local log IDs are valid UUIDs for Supabase compatibility
        const updatedRecipes = get().generatedRecipes.map(recipe => ({
          ...recipe,
          id: getOrGenerateUuid(recipe.id)
        }));

        const updatedFoodLogs = get().foodLogs.map(entry => ({
          ...entry,
          id: getOrGenerateUuid(entry.id)
        }));

        const updatedWaterLogs = get().waterLogs.map(entry => ({
          ...entry,
          id: getOrGenerateUuid(entry.id)
        }));

        const updatedWorkoutLogs = get().workoutLogs.map(entry => ({
          ...entry,
          id: getOrGenerateUuid(entry.id)
        }));

        set({
          generatedRecipes: updatedRecipes,
          foodLogs: updatedFoodLogs,
          waterLogs: updatedWaterLogs,
          workoutLogs: updatedWorkoutLogs,
        });

        // Upsert Profile
        const birthYear = new Date().getFullYear() - (profile.age || 28);
        const date_of_birth = `${birthYear}-01-01`;

        const { error: profileErr } = await supabase.from('profiles').upsert({
          id: userId,
          email: profile.email || '',
          display_name: profile.name || 'Guest',
          language: profile.language || 'ar',
          country: profile.country || 'EG',
          date_of_birth,
          gender: profile.gender || 'male',
          height_cm: profile.height_cm || 175,
          weight_kg: profile.weight_kg || 75,
          activity_level: profile.activity_level || 'moderately_active',
          health_goal: profile.health_goal || 'lose_weight',
          target_calories: profile.target_calories || 2000,
          target_protein_g: profile.target_protein_g || 120,
          target_carbs_g: profile.target_carbs_g || 200,
          target_fat_g: profile.target_fat_g || 65,
          target_water_ml: profile.target_water_ml || 2500,
          diet_type: profile.diet_type || 'classic',
          exclusions: profile.exclusions || [],
          disliked_ingredients: profile.disliked_ingredients || [],
          goal_weight_kg: profile.goal_weight_kg || null,
          unit_weight: profile.unit_weight || 'kg',
          unit_height: profile.unit_height || 'cm',
          unit_water: profile.unit_water || 'ml',
          reminder_meals: profile.reminder_meals !== undefined ? profile.reminder_meals : true,
          reminder_water: profile.reminder_water !== undefined ? profile.reminder_water : true,
          reminder_workout: profile.reminder_workout !== undefined ? profile.reminder_workout : true,
          macro_preset: profile.macro_preset || 'balanced',
          macro_carbs_pct: profile.macro_carbs_pct || 40,
          macro_protein_pct: profile.macro_protein_pct || 30,
          macro_fat_pct: profile.macro_fat_pct || 30,
          app_theme: profile.app_theme || 'system',
        });

        if (profileErr) {
          console.error('Error syncing profile:', profileErr.message);
          return;
        }

        // Sync Active Meal Plan if exists
        try {
          const activeMealPlan = get().activeMealPlan;
          if (activeMealPlan) {
            // Query if a meal plan already exists for this user to reuse its ID
            const { data: existingPlans } = await supabase
              .from('meal_plans')
              .select('id')
              .eq('user_id', userId)
              .limit(1);
            
            const planId = existingPlans?.[0]?.id || activeMealPlan.id || undefined;

            const { data: upsertedData, error: upsertErr } = await supabase.from('meal_plans').upsert({
              id: planId,
              user_id: userId,
              title: activeMealPlan.title || 'Daily Meal Plan',
              plan_data: activeMealPlan.meals,
              grocery_list: activeMealPlan.grocery_list,
            }).select('id');

            if (!upsertErr && upsertedData && upsertedData.length > 0) {
              set({
                activeMealPlan: {
                  ...activeMealPlan,
                  id: upsertedData[0].id,
                }
              });
            }
          }
        } catch (err) {
          console.error('Error syncing meal plan to Supabase:', err);
        }

        // Upsert Generated Recipes
        for (const recipe of updatedRecipes) {
          await supabase.from('generated_recipes').upsert({
            id: recipe.id,
            user_id: userId,
            title_en: recipe.title_en,
            title_ar: recipe.title_ar,
            description_en: recipe.description_en,
            description_ar: recipe.description_ar,
            ingredients: recipe.ingredients,
            steps_en: recipe.steps_en,
            steps_ar: recipe.steps_ar,
            total_calories: recipe.total_calories,
            total_protein_g: recipe.total_protein_g,
            total_carbs_g: recipe.total_carbs_g,
            total_fat_g: recipe.total_fat_g,
            image_url: recipe.image_url,
            country_origin: recipe.country_origin || 'EG',
          });
        }

        // Upsert Food Logs
        for (const entry of updatedFoodLogs) {
          const amount = entry.amount_g || 100;
          const calories_per_100g = ((entry.calories || 0) / amount) * 100;
          const protein_per_100g = ((entry.protein || 0) / amount) * 100;
          const carbs_per_100g = ((entry.carbs || 0) / amount) * 100;
          const fat_per_100g = ((entry.fat || 0) / amount) * 100;

          await supabase.from('foods_cache').upsert({
            id: entry.food_id,
            name_en: entry.name_en,
            name_ar: entry.name_ar,
            calories_per_100g,
            protein_per_100g,
            carbs_per_100g,
            fat_per_100g,
            source: 'custom',
          });

          await supabase.from('food_logs').upsert({
            id: entry.id,
            user_id: userId,
            food_id: entry.food_id,
            meal_type: entry.meal_type,
            amount_g: entry.amount_g,
            logged_date: entry.logged_date,
            logged_at: entry.logged_at,
          });
        }

        // Upsert Water Logs
        for (const entry of updatedWaterLogs) {
          await supabase.from('water_logs').upsert({
            id: entry.id,
            user_id: userId,
            amount_ml: entry.amount_ml,
            logged_date: entry.logged_date,
            logged_at: entry.logged_at,
          });
        }

        // Upsert Workout Logs
        for (const entry of updatedWorkoutLogs) {
          await supabase.from('workout_logs').upsert({
            id: entry.id,
            user_id: userId,
            activity_name_en: entry.activity_name_en,
            activity_name_ar: entry.activity_name_ar,
            met_value: entry.met_value,
            duration_minutes: entry.duration_minutes,
            calories_burned: entry.calories_burned,
            logged_date: entry.logged_date,
            logged_at: entry.logged_at,
          });
        }

        set({ isTrial: false });
      },

      fetchFromSupabase: async (userId) => {
        try {
          // 1. Fetch Profile
          const { data: dbProfile, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (profileErr && profileErr.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileErr);
          }

          let profile = get().profile;
          if (dbProfile) {
            const birthYear = new Date(dbProfile.date_of_birth).getFullYear();
            const age = new Date().getFullYear() - birthYear;
            profile = {
              name: dbProfile.display_name || 'Guest',
              email: dbProfile.email,
              gender: dbProfile.gender || 'male',
              age,
              weight_kg: parseFloat(dbProfile.weight_kg),
              height_cm: parseFloat(dbProfile.height_cm),
              activity_level: dbProfile.activity_level,
              health_goal: dbProfile.health_goal,
              language: dbProfile.language || 'ar',
              country: dbProfile.country || 'EG',
              onboarded: true,
              target_calories: parseFloat(dbProfile.target_calories),
              target_protein_g: parseFloat(dbProfile.target_protein_g),
              target_carbs_g: parseFloat(dbProfile.target_carbs_g),
              target_fat_g: parseFloat(dbProfile.target_fat_g),
              target_water_ml: parseFloat(dbProfile.target_water_ml),
              diet_type: dbProfile.diet_type || 'classic',
              exclusions: dbProfile.exclusions || [],
              disliked_ingredients: dbProfile.disliked_ingredients || [],
              goal_weight_kg: dbProfile.goal_weight_kg ? parseFloat(dbProfile.goal_weight_kg) : undefined,
              unit_weight: dbProfile.unit_weight || 'kg',
              unit_height: dbProfile.unit_height || 'cm',
              unit_water: dbProfile.unit_water || 'ml',
              reminder_meals: dbProfile.reminder_meals !== null ? dbProfile.reminder_meals : true,
              reminder_water: dbProfile.reminder_water !== null ? dbProfile.reminder_water : true,
              reminder_workout: dbProfile.reminder_workout !== null ? dbProfile.reminder_workout : true,
              macro_preset: dbProfile.macro_preset || 'balanced',
              macro_carbs_pct: dbProfile.macro_carbs_pct !== null ? parseInt(dbProfile.macro_carbs_pct) : 40,
              macro_protein_pct: dbProfile.macro_protein_pct !== null ? parseInt(dbProfile.macro_protein_pct) : 30,
              macro_fat_pct: dbProfile.macro_fat_pct !== null ? parseInt(dbProfile.macro_fat_pct) : 30,
              app_theme: dbProfile.app_theme || 'system',
            };
          }

          // 2. Fetch Food Logs with joined foods_cache
          const { data: dbFoodLogs, error: foodErr } = await supabase
            .from('food_logs')
            .select(`
              id,
              food_id,
              meal_type,
              amount_g,
              logged_date,
              logged_at,
              foods_cache (
                name_en,
                name_ar,
                calories_per_100g,
                protein_per_100g,
                carbs_per_100g,
                fat_per_100g
              )
            `)
            .eq('user_id', userId);

          let foodLogs = get().foodLogs;
          if (dbFoodLogs) {
            foodLogs = dbFoodLogs.map((log: any) => {
              const food = log.foods_cache || { name_en: 'Unknown', name_ar: 'غير معروف', calories_per_100g: 0, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 0 };
              const amount = parseFloat(log.amount_g);
              return {
                id: log.id,
                food_id: log.food_id,
                meal_type: log.meal_type,
                amount_g: amount,
                name_en: food.name_en,
                name_ar: food.name_ar,
                calories: (parseFloat(food.calories_per_100g) * amount) / 100,
                protein: (parseFloat(food.protein_per_100g) * amount) / 100,
                carbs: (parseFloat(food.carbs_per_100g) * amount) / 100,
                fat: (parseFloat(food.fat_per_100g) * amount) / 100,
                logged_date: log.logged_date,
                logged_at: log.logged_at,
              };
            });
          }

          // 3. Fetch Water Logs
          const { data: dbWaterLogs, error: waterErr } = await supabase
            .from('water_logs')
            .select('*')
            .eq('user_id', userId);

          let waterLogs = get().waterLogs;
          if (dbWaterLogs) {
            waterLogs = dbWaterLogs.map((log: any) => ({
              id: log.id,
              amount_ml: parseFloat(log.amount_ml),
              logged_date: log.logged_date,
              logged_at: log.logged_at,
            }));
          }

          // 4. Fetch Workout Logs
          const { data: dbWorkoutLogs, error: workoutErr } = await supabase
            .from('workout_logs')
            .select('*')
            .eq('user_id', userId);

          let workoutLogs = get().workoutLogs;
          if (dbWorkoutLogs) {
            workoutLogs = dbWorkoutLogs.map((log: any) => ({
              id: log.id,
              activity_id: 'custom',
              activity_name_en: log.activity_name_en,
              activity_name_ar: log.activity_name_ar,
              met_value: parseFloat(log.met_value),
              duration_minutes: parseFloat(log.duration_minutes),
              calories_burned: parseFloat(log.calories_burned),
              logged_date: log.logged_date,
              logged_at: log.logged_at,
            }));
          }

          // 5. Fetch Generated Recipes
          const { data: dbRecipes, error: recipeErr } = await supabase
            .from('generated_recipes')
            .select('*')
            .eq('user_id', userId);

          let generatedRecipes = get().generatedRecipes;
          if (dbRecipes) {
            generatedRecipes = dbRecipes.map((r: any) => ({
              id: r.id,
              title_en: r.title_en,
              title_ar: r.title_ar,
              description_en: r.description_en,
              description_ar: r.description_ar,
              ingredients: r.ingredients,
              steps_en: r.steps_en,
              steps_ar: r.steps_ar,
              total_calories: parseFloat(r.total_calories),
              total_protein_g: parseFloat(r.total_protein_g),
              total_carbs_g: parseFloat(r.total_carbs_g),
              total_fat_g: parseFloat(r.total_fat_g),
              image_url: r.image_url,
              country_origin: r.country_origin,
              category: 'lunch',
              tags: ['AI Generated'],
            }));
          }

          // 6. Fetch Active Meal Plan
          const { data: dbMealPlans } = await supabase
            .from('meal_plans')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1);

          let activeMealPlan = get().activeMealPlan;
          if (dbMealPlans && dbMealPlans.length > 0) {
            const plan = dbMealPlans[0];
            activeMealPlan = {
              id: plan.id,
              title: plan.title,
              meals: plan.plan_data as any,
              grocery_list: plan.grocery_list as any,
              created_at: plan.created_at,
            };
          }

          set({
            profile,
            foodLogs,
            waterLogs,
            workoutLogs,
            generatedRecipes,
            activeMealPlan,
            isTrial: false,
          });
        } catch (err) {
          console.error('Error fetching data from Supabase:', err);
        }
      },

      resetAll: () => {
        set({
          isTrial: true,
          profile: null,
          foodLogs: [],
          waterLogs: [],
          workoutLogs: [],
          generatedRecipesCount: 0,
          isSignUpModalOpen: false,
          generatedRecipes: [],
          activeMealPlan: null,
        });
        get().initializeDefaultProfile();
      },
    }),
    {
      name: 'digest-diary-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
