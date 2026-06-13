import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { RecipeType } from '@/data/localRecipes';

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
  
  // Targets (calculated dynamically but editable)
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  target_water_ml: number;
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
  triggerClerkSignUp: () => void;
  addGeneratedRecipe: (recipe: RecipeType) => void;
  syncToSupabase: (userId: string) => Promise<void>;
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
  // Protein: 2.0g per kg of body weight
  const target_protein_g = Math.round(weight_kg * 2.0);
  
  // Fat: 25% of total calories (1g fat = 9 kcal)
  const target_fat_g = Math.round((target_calories * 0.25) / 9);

  // Carbs: Remaining calories (1g carb = 4 kcal)
  const protein_calories = target_protein_g * 4;
  const fat_calories = target_fat_g * 9;
  const remaining_calories = target_calories - (protein_calories + fat_calories);
  const target_carbs_g = Math.max(50, Math.round(remaining_calories / 4));

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

          // Re-calculate targets if core metrics change
          const coreMetricsChanged =
            newProfileFields.weight_kg !== undefined ||
            newProfileFields.height_cm !== undefined ||
            newProfileFields.age !== undefined ||
            newProfileFields.gender !== undefined ||
            newProfileFields.activity_level !== undefined ||
            newProfileFields.health_goal !== undefined;

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
      },

      addFoodLog: (entry) => {
        const { isTrial, foodLogs } = get();
        
        if (isTrial) {
          // Check trial limit: 3rd distinct meal category logged in a single day
          const dateLogs = foodLogs.filter((log) => log.logged_date === entry.logged_date);
          const loggedCategories = new Set(dateLogs.map((log) => log.meal_type));
          
          if (!loggedCategories.has(entry.meal_type) && loggedCategories.size >= 2) {
            // Trying to log a 3rd distinct category!
            // Trigger sign up bottom sheet
            set({ isSignUpModalOpen: true });
            return false;
          }
        }

        const newEntry: FoodLogEntry = {
          ...entry,
          id: Math.random().toString(36).substring(7),
          logged_at: new Date().toISOString(),
        };

        set((state) => ({
          foodLogs: [...state.foodLogs, newEntry],
        }));
        return true;
      },

      deleteFoodLog: (id) => {
        set((state) => ({
          foodLogs: state.foodLogs.filter((log) => log.id !== id),
        }));
      },

      addWaterLog: (amount_ml, date) => {
        const newEntry: WaterLogEntry = {
          id: Math.random().toString(36).substring(7),
          amount_ml,
          logged_date: date,
          logged_at: new Date().toISOString(),
        };
        set((state) => ({
          waterLogs: [...state.waterLogs, newEntry],
        }));
      },

      addWorkoutLog: (entry) => {
        // Calculate calories burned
        // Calories Burned = MET * Weight (kg) * Duration (hours)
        const weight = get().profile?.weight_kg || 80;
        const durationHours = entry.duration_minutes / 60;
        const calories_burned = Math.round(entry.met_value * weight * durationHours);

        const newEntry: WorkoutLogEntry = {
          ...entry,
          id: Math.random().toString(36).substring(7),
          calories_burned,
          logged_at: new Date().toISOString(),
        };

        set((state) => ({
          workoutLogs: [...state.workoutLogs, newEntry],
        }));
      },

      deleteWorkoutLog: (id) => {
        set((state) => ({
          workoutLogs: state.workoutLogs.filter((log) => log.id !== id),
        }));
      },

      incrementRecipesCount: () => {
        const { isTrial, generatedRecipesCount } = get();
        if (isTrial && generatedRecipesCount >= 1) {
          // Attempting to generate a 2nd custom recipe in trial
          set({ isSignUpModalOpen: true });
          return false;
        }
        set((state) => ({
          generatedRecipesCount: state.generatedRecipesCount + 1,
        }));
        return true;
      },

      setSignUpModalOpen: (open) => set({ isSignUpModalOpen: open }),

      triggerClerkSignUp: () => {
        set({ isSignUpModalOpen: true });
      },

      addGeneratedRecipe: (recipe) => {
        set((state) => ({
          generatedRecipes: [...state.generatedRecipes, recipe]
        }));
      },

      syncToSupabase: async (userId) => {
        // Mock API sync network delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        // After successfully syncing all local logs to the database, transition from trial
        set({ isTrial: false });
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
