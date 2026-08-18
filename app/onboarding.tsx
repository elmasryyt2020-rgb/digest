import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as Localization from 'expo-localization';

import { useDiaryStore, calculateNutrientTargets } from '@/store/useDiaryStore';
import { PresstoButton } from '@/components/PresstoButton';
import { parseLocalizedFloat, parseLocalizedInt } from '@/lib/formatters';
import { Alert } from 'react-native';

// OnboardShell component that houses progressive step dots and next button
interface OnboardShellProps {
  step: number;
  total?: number;
  children: React.ReactNode;
  ctaLabel?: string;
  ctaDisabled?: boolean;
  showFooter?: boolean;
  skip?: boolean;
  onNext: () => void;
}

function OnboardShell({
  step,
  total = 4,
  children,
  ctaLabel = 'Next',
  ctaDisabled = false,
  showFooter = true,
  skip = true,
  onNext,
}: OnboardShellProps) {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className="flex-1 bg-bg-base">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-border-muted bg-bg-card">
        <View className="flex-row items-center">
          <Ionicons name="heart" size={20} color={isDark ? '#5C856C' : '#4C6E58'} />
          <Text className="font-outfit-bold text-lg text-text-primary ml-1.5">digest</Text>
        </View>

        {/* Progressive step dots */}
        <View className="flex-row items-center space-x-1.5 gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => {
            const activeStep = step === 4 ? 3 : step;
            return (
              <View
                key={i}
                className="h-1.5 rounded-full"
                style={{
                  width: i === activeStep ? 20 : 6,
                  backgroundColor: i <= activeStep ? (isDark ? '#5C856C' : '#4C6E58') : (isDark ? 'rgba(138, 150, 144, 0.15)' : 'rgba(98, 106, 102, 0.15)'),
                }}
              />
            );
          })}
        </View>

        {/* Skip action */}
        {skip ? (
          <TouchableOpacity onPress={() => router.push('/sign-up')}>
            <Text className="font-inter-medium text-xs text-text-muted underline">Skip</Text>
          </TouchableOpacity>
        ) : (
          <View className="w-8" />
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        {children}
      </View>

      {/* Footer CTA */}
      {showFooter && (
        <View className="p-6 bg-bg-card border-t border-border-muted">
          <PresstoButton
            disabled={ctaDisabled}
            onPress={onNext}
            className={`w-full py-4 rounded-full flex-row justify-center items-center ${
              ctaDisabled ? 'bg-border-muted opacity-50' : 'bg-accent-sage'
            }`}
          >
            <Text className="text-white font-outfit-bold text-base">{ctaLabel}</Text>
          </PresstoButton>
        </View>
      )}
    </View>
  );
}

import { supabase } from '@/lib/supabase';

export default function OnboardingScreen() {
  const router = useRouter();
  const setProfile = useDiaryStore((state) => state.setProfile);
  const setActiveMealPlan = useDiaryStore((state) => state.setActiveMealPlan);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Form states
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0); // 0: Body Details, 1: Goals & Activity, 2: Diet & Preferences, 3: Budget, 4: Calculations Loading
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthYear, setBirthYear] = useState('1998');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('75');
  const [activity, setActivity] = useState<'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active'>('moderately_active');
  const [goal, setGoal] = useState<'lose_weight' | 'maintain_weight' | 'gain_weight'>('lose_weight');
  const [dietType, setDietType] = useState<'classic' | 'vegetarian' | 'vegan' | 'keto' | 'low_carb'>('classic');
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [budget, setBudget] = useState<'low' | 'medium' | 'high'>('medium');

  // Loading shim states for Step 3
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Analyzing biometrics...');
  const spinValue = useRef(new Animated.Value(0)).current;

  // Setup spinning animation for Step 4
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (step === 4) {
      animation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
    } else {
      spinValue.setValue(0);
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [step]);

  // Loading steps simulation & AI meal plan generation
  useEffect(() => {
    if (step === 4) {
      let isMounted = true;
      let currentProgress = 0;

      // Animate progress bar up to 90% slowly while API processes
      const progressInterval = setInterval(() => {
        if (!isMounted) return;
        if (currentProgress < 0.90) {
          currentProgress += 0.05;
          setLoadingProgress(Math.min(currentProgress, 0.90));
          if (currentProgress < 0.35) {
            setLoadingText('Analyzing biometrics...');
          } else if (currentProgress < 0.70) {
            setLoadingText('Detecting country from IP...');
          } else {
            setLoadingText('Compiling custom meal plan...');
          }
        }
      }, 150);

      const generatePlan = async () => {
        const locales = Localization.getLocales();
        const regionCode = locales[0]?.regionCode;
        const detectedCountry = (regionCode === 'EG' || regionCode === 'GB' ? regionCode : 'EG') as 'EG' | 'GB';

        const currentYear = new Date().getFullYear();
        const birthYearNum = parseLocalizedInt(birthYear, 1996);
        const ageVal = Math.max(10, Math.min(120, currentYear - birthYearNum));
        const weightVal = parseLocalizedFloat(weight, 75);
        const heightVal = parseLocalizedFloat(height, 175);

        const baseProfile = {
          name: 'Guest',
          gender,
          age: ageVal,
          weight_kg: weightVal,
          height_cm: heightVal,
          activity_level: activity,
          health_goal: goal,
          language: 'en' as const, // default English for funnel screen
          country: detectedCountry,
          onboarded: false,
          diet_type: dietType,
          exclusions: exclusions,
          disliked_ingredients: [],
          budget: budget,
        };

        const targets = calculateNutrientTargets(baseProfile);

        try {
          const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
            body: {
              gender,
              age: ageVal,
              weight_kg: weightVal,
              height_cm: heightVal,
              activity_level: activity,
              health_goal: goal,
              diet_type: dietType,
              exclusions,
              country: detectedCountry,
              budget,
            }
          });

          if (error || !data) {
            let errorMsg = error?.message || 'Failed to generate meal plan';
            try {
              if (error && (error as any).context) {
                const errBody = await (error as any).context.json();
                if (errBody?.error) errorMsg = errBody.error;
              }
            } catch {}
            throw new Error(errorMsg);
          }

          if (isMounted) {
            clearInterval(progressInterval);
            setLoadingProgress(1.0);
            setLoadingText('Finalizing plan...');

            setProfile({
              ...baseProfile,
              target_calories: data.target_calories || targets.target_calories,
              target_protein_g: data.target_protein_g || targets.target_protein_g,
              target_carbs_g: data.target_carbs_g || targets.target_carbs_g,
              target_fat_g: data.target_fat_g || targets.target_fat_g,
              target_water_ml: data.target_water_ml || targets.target_water_ml,
            });

            setActiveMealPlan({
              title: 'My Custom Plan',
              meals: data.meals,
              grocery_list: data.grocery_list,
            });

            setTimeout(() => {
              if (isMounted) router.replace('/onboarding_results');
            }, 300);
          }
        } catch (err) {
          console.error('Error generating AI meal plan, falling back to local recipes:', err);
          if (isMounted) {
            clearInterval(progressInterval);
            setLoadingProgress(1.0);
            setLoadingText('Applying standard plan...');

            setProfile({
              ...baseProfile,
              ...targets,
            });
            setActiveMealPlan(null);

            setTimeout(() => {
              if (isMounted) router.replace('/onboarding_results');
            }, 500);
          }
        }
      };

      generatePlan();

      return () => {
        isMounted = false;
        clearInterval(progressInterval);
      };
    }
  }, [step, budget]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Steps Navigation
  const handleStep0Next = () => {
    const hVal = parseLocalizedFloat(height, 0);
    const wVal = parseLocalizedFloat(weight, 0);
    const yVal = parseLocalizedInt(birthYear, 0);
    const currentYear = new Date().getFullYear();

    if (!birthYear.trim() || yVal < 1920 || yVal > currentYear - 10) {
      Alert.alert('Invalid Year of Birth', 'Please enter a valid birth year (e.g. 1995).');
      return;
    }
    if (!weight.trim() || wVal < 30 || wVal > 300) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight in kg (e.g. 75).');
      return;
    }
    if (!height.trim() || hVal < 100 || hVal > 250) {
      Alert.alert('Invalid Height', 'Please enter a valid height in cm (e.g. 175).');
      return;
    }
    setStep(1);
  };

  const handleStep1Next = () => {
    setStep(2);
  };

  const handleStep2Next = () => {
    setStep(3);
  };

  const handleStep3Next = () => {
    setStep(4);
  };

  const toggleExclusion = (id: string) => {
    if (exclusions.includes(id)) {
      setExclusions(exclusions.filter(e => e !== id));
    } else {
      setExclusions([...exclusions, id]);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#101412' : '#F8F9F8' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {step === 0 && (
          <OnboardShell
            step={0}
            ctaLabel="Continue"
            onNext={handleStep0Next}
          >
            <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
              <Text className="font-outfit-semibold text-[11px] text-text-muted uppercase tracking-wider mb-2">
                Step 1 of 4 · Body Details
              </Text>
              <Text className="font-outfit-bold text-3xl text-text-primary tracking-tight mb-3">
                Your body details.
              </Text>
              <Text className="font-inter text-sm text-text-muted leading-relaxed mb-6">
                Your body details help calculate metabolic rates accurately using the Mifflin-St Jeor formula.
              </Text>

              {/* Gender selection */}
              <View className="mb-6">
                <Text className="font-outfit-semibold text-xs text-text-primary mb-3">
                  Gender
                </Text>
                <View className="flex-row gap-4">
                  <TouchableOpacity
                    onPress={() => setGender('male')}
                    className={`flex-1 p-4 border rounded-2xl bg-bg-card items-center flex-row justify-center ${
                      gender === 'male' ? 'border-accent-sage bg-[#F3F6F3] dark:bg-[#1F2E25]' : 'border-border-muted'
                    }`}
                  >
                    <Ionicons name="male" size={18} color={gender === 'male' ? (isDark ? '#5C856C' : '#4C6E58') : (isDark ? '#8A9690' : '#626A66')} />
                    <Text className={`text-sm font-outfit-bold ml-2 ${gender === 'male' ? 'text-accent-sage' : 'text-text-muted'}`}>
                      Male
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setGender('female')}
                    className={`flex-1 p-4 border rounded-2xl bg-bg-card items-center flex-row justify-center ${
                      gender === 'female' ? 'border-accent-sage bg-[#F3F6F3] dark:bg-[#1F2E25]' : 'border-border-muted'
                    }`}
                  >
                    <Ionicons name="female" size={18} color={gender === 'female' ? (isDark ? '#5C856C' : '#4C6E58') : (isDark ? '#8A9690' : '#626A66')} />
                    <Text className={`text-sm font-outfit-bold ml-2 ${gender === 'female' ? 'text-accent-sage' : 'text-text-muted'}`}>
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Year of birth */}
              <View className="mb-6">
                <Text className="font-outfit-semibold text-xs text-text-primary mb-2">
                  Year of Birth
                </Text>
                <TextInput
                  className="bg-bg-card border border-border-muted rounded-2xl p-4 font-inter text-text-primary text-base"
                  placeholder="e.g., 1995"
                  placeholderTextColor="#9CA19E"
                  keyboardType="numeric"
                  maxLength={4}
                  value={birthYear}
                  onChangeText={setBirthYear}
                />
              </View>

              {/* Height & Weight Row */}
              <View className="flex-row gap-4 mb-6">
                <View className="flex-1">
                  <Text className="font-outfit-semibold text-xs text-text-primary mb-2">
                    Height (cm)
                  </Text>
                  <TextInput
                    className="bg-bg-card border border-border-muted rounded-2xl p-4 font-inter text-text-primary text-base text-center"
                    placeholder="175"
                    placeholderTextColor="#9CA19E"
                    keyboardType="numeric"
                    value={height}
                    onChangeText={setHeight}
                  />
                </View>

                <View className="flex-1">
                  <Text className="font-outfit-semibold text-xs text-text-primary mb-2">
                    Weight (kg)
                  </Text>
                  <TextInput
                    className="bg-bg-card border border-border-muted rounded-2xl p-4 font-inter text-text-primary text-base text-center"
                    placeholder="75"
                    placeholderTextColor="#9CA19E"
                    keyboardType="numeric"
                    value={weight}
                    onChangeText={setWeight}
                  />
                </View>
              </View>
            </ScrollView>
          </OnboardShell>
        )}

        {step === 1 && (
          <OnboardShell
            step={1}
            ctaLabel="Continue"
            onNext={handleStep1Next}
          >
            <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
              <Text className="font-outfit-semibold text-[11px] text-text-muted uppercase tracking-wider mb-2">
                Step 2 of 4 · Goals & Activity
              </Text>
              <Text className="font-outfit-bold text-3xl text-text-primary tracking-tight mb-3">
                Daily activity & goals.
              </Text>
              <Text className="font-inter text-sm text-text-muted leading-relaxed mb-6">
                Tell us how active you are and what wellness target you would like to hit.
              </Text>

              {/* Activity levels */}
              <View className="mb-6">
                <Text className="font-outfit-semibold text-xs text-text-primary mb-2.5">
                  How active are you daily?
                </Text>
                <View className="gap-2">
                  {(['sedentary', 'lightly_active', 'moderately_active', 'very_active'] as const).map((level) => {
                    const titles = {
                      sedentary: 'Sedentary (desk job / little exercise)',
                      lightly_active: 'Lightly active (light exercise 1-3 days)',
                      moderately_active: 'Moderately active (active exercise 3-5 days)',
                      very_active: 'Very active (heavy training daily)',
                    };
                    return (
                      <TouchableOpacity
                        key={level}
                        onPress={() => setActivity(level)}
                        className={`flex-row justify-between items-center p-3.5 border rounded-2xl bg-bg-card ${
                          activity === level ? 'border-accent-sage bg-[#F3F6F3] dark:bg-[#1F2E25]' : 'border-border-muted'
                        }`}
                      >
                        <Text className={`text-xs font-inter-medium ${activity === level ? 'text-text-primary font-inter-semibold' : 'text-text-muted'}`}>
                          {titles[level]}
                        </Text>
                        {activity === level && <Ionicons name="checkmark" size={16} color={isDark ? '#5C856C' : '#4C6E58'} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Health goals */}
              <View className="mb-6">
                <Text className="font-outfit-semibold text-xs text-text-primary mb-2.5">
                  What is your wellness goal?
                </Text>
                <View className="gap-2">
                  {(['lose_weight', 'maintain_weight', 'gain_weight'] as const).map((g) => {
                    const titles = {
                      lose_weight: 'Lose Weight (-500 kcal deficit)',
                      maintain_weight: 'Maintain Weight (healthy balance)',
                      gain_weight: 'Gain Weight (+300 kcal surplus)',
                    };
                    return (
                      <TouchableOpacity
                        key={g}
                        onPress={() => setGoal(g)}
                        className={`flex-row justify-between items-center p-3.5 border rounded-2xl bg-bg-card ${
                          goal === g ? 'border-accent-sage bg-[#F3F6F3] dark:bg-[#1F2E25]' : 'border-border-muted'
                        }`}
                      >
                        <Text className={`text-xs font-inter-medium ${goal === g ? 'text-text-primary font-inter-semibold' : 'text-text-muted'}`}>
                          {titles[g]}
                        </Text>
                        {goal === g && <Ionicons name="checkmark" size={16} color={isDark ? '#5C856C' : '#4C6E58'} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </OnboardShell>
        )}

        {step === 2 && (
          <OnboardShell
            step={2}
            ctaLabel="Continue"
            onNext={handleStep2Next}
          >
            <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
              <Text className="font-outfit-semibold text-[11px] text-text-muted uppercase tracking-wider mb-2">
                Step 3 of 4 · Diet & Preferences
              </Text>
              <Text className="font-outfit-bold text-3xl text-text-primary tracking-tight mb-3">
                Diet type & exclusions.
              </Text>
              <Text className="font-inter text-sm text-text-muted leading-relaxed mb-6">
                Personalize your diet profile and toggle any common ingredient exclusions.
              </Text>

              {/* Diet Type Grid */}
              <View className="mb-6">
                <Text className="font-outfit-semibold text-xs text-text-primary mb-2.5">
                  Diet Type
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { id: 'classic', label: 'Classic / Anything' },
                    { id: 'vegetarian', label: 'Vegetarian' },
                    { id: 'vegan', label: 'Vegan' },
                    { id: 'keto', label: 'Keto' },
                    { id: 'low_carb', label: 'Low Carb' },
                  ].map((diet) => (
                    <TouchableOpacity
                      key={diet.id}
                      onPress={() => setDietType(diet.id as any)}
                      style={{ width: '48%' }}
                      className={`p-3.5 border rounded-2xl bg-bg-card items-center justify-center ${
                        dietType === diet.id ? 'border-accent-sage bg-[#F3F6F3] dark:bg-[#1F2E25]' : 'border-border-muted'
                      }`}
                    >
                      <Text className={`text-xs text-center font-inter-medium ${dietType === diet.id ? 'text-text-primary font-inter-semibold' : 'text-text-muted'}`}>
                        {diet.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Common Exclusions Grid */}
              <View className="mb-6">
                <Text className="font-outfit-semibold text-xs text-text-primary mb-2.5">
                  Common Exclusions / Allergies
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { id: 'gluten-free', label: 'Gluten-Free' },
                    { id: 'dairy-free', label: 'Dairy-Free' },
                    { id: 'nut-free', label: 'Nut-Free' },
                    { id: 'seafood-free', label: 'Seafood-Free' },
                  ].map((excl) => {
                    const isSelected = exclusions.includes(excl.id);
                    return (
                      <TouchableOpacity
                        key={excl.id}
                        onPress={() => toggleExclusion(excl.id)}
                        className={`px-4 py-2.5 border rounded-full bg-bg-card flex-row items-center gap-1.5 ${
                          isSelected ? 'border-accent-sage bg-[#F3F6F3] dark:bg-[#1F2E25]' : 'border-border-muted'
                        }`}
                      >
                        <Ionicons
                          name={isSelected ? "checkmark-circle" : "add-circle-outline"}
                          size={14}
                          color={isSelected ? (isDark ? "#5C856C" : "#4C6E58") : (isDark ? "#8A9690" : "#626A66")}
                        />
                        <Text className={`text-xs font-inter-medium ${isSelected ? 'text-text-primary font-inter-semibold' : 'text-text-muted'}`}>
                          {excl.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </OnboardShell>
        )}

        {step === 3 && (
          <OnboardShell
            step={3}
            ctaLabel="Calculate plan"
            onNext={handleStep3Next}
          >
            <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
              <Text className="font-outfit-semibold text-[11px] text-text-muted uppercase tracking-wider mb-2">
                Step 4 of 4 · Weekly Budget
              </Text>
              <Text className="font-outfit-bold text-3xl text-text-primary tracking-tight mb-3">
                Choose your grocery budget.
              </Text>
              <Text className="font-inter text-sm text-text-muted leading-relaxed mb-6">
                Choose a weekly grocery tier. The app plans nutritious meals using localized Egyptian market prices.
              </Text>

              <View className="gap-3">
                {[
                  { id: 'low', label: 'Low Budget', desc: '600 EGP/month (~150 EGP/week)\nFocuses on staples, cottage cheese, eggs, pasta, lentils' },
                  { id: 'medium', label: 'Medium Budget', desc: '1000 EGP/month (~250 EGP/week)\nAdds eggs, black honey, tahini, and more variety' },
                  { id: 'high', label: 'High Budget', desc: '1400 EGP/month (~350 EGP/week)\nAdds ghee, imported beef, halva, and premium items' }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setBudget(item.id as any)}
                    className={`p-4 border rounded-2xl bg-bg-card flex-row justify-between items-center ${
                      budget === item.id ? 'border-accent-sage bg-[#F3F6F3] dark:bg-[#1F2E25]' : 'border-border-muted'
                    }`}
                  >
                    <View className="flex-1 pr-3">
                      <Text className={`text-sm font-outfit-bold ${budget === item.id ? 'text-text-primary font-outfit-bold' : 'text-text-primary'}`}>
                        {item.label}
                      </Text>
                      <Text className="text-xs text-text-muted mt-1 leading-normal">
                        {item.desc}
                      </Text>
                    </View>
                    <Ionicons
                      name={budget === item.id ? "radio-button-on" : "radio-button-off"}
                      size={20}
                      color={budget === item.id ? (isDark ? "#5C856C" : "#4C6E58") : (isDark ? "#8A9690" : "#626A66")}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </OnboardShell>
        )}

        {step === 4 && (
          <OnboardShell
            step={4}
            showFooter={false}
            skip={false}
            onNext={() => {}}
          >
            <View className="flex-1 justify-center items-center px-8 pb-16">
              <Text className="font-outfit-semibold text-[11px] text-text-muted uppercase tracking-wider mb-2">
                Processing funnels
              </Text>
              <Text className="font-outfit-bold text-3xl text-text-primary text-center tracking-tight mb-8">
                Reading everything{'\n'}
                <Text style={{ fontStyle: 'italic' }}>so you don't have to.</Text>
              </Text>

              {/* Loader visual */}
              <View className="w-full bg-bg-card rounded-3xl border border-border-muted p-6 items-center shadow-sm">
                <Animated.View
                  style={{
                    transform: [{ rotate: spin }],
                    width: 48,
                    height: 48,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  className="mb-6"
                >
                  <Ionicons
                    name="refresh-outline"
                    size={48}
                    color={isDark ? '#5C856C' : '#4C6E58'}
                    style={{
                      width: 48,
                      height: 48,
                      lineHeight: 48,
                      textAlign: 'center',
                      includeFontPadding: false,
                    }}
                  />
                </Animated.View>

                <Text className="font-outfit-bold text-base text-text-primary mb-3">
                  Creating Your Health Plan
                </Text>

                {/* Horizontal Progress Bar */}
                <View className="w-full h-2 bg-border-muted rounded-full overflow-hidden mb-4">
                  <View
                    className="h-full bg-accent-sage rounded-full"
                    style={{ width: `${loadingProgress * 100}%` }}
                  />
                </View>

                {/* Loading Status Text */}
                <Text className="font-inter text-xs text-text-muted text-center h-4">
                  {loadingText}
                </Text>
              </View>
            </View>
          </OnboardShell>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
