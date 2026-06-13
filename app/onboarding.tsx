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

import { useDiaryStore, calculateNutrientTargets } from '@/store/useDiaryStore';
import { PresstoButton } from '@/components/PresstoButton';

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

  return (
    <View className="flex-1 bg-bg-base">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-border-muted bg-white">
        <View className="flex-row items-center">
          <Ionicons name="heart" size={20} color="#4C6E58" />
          <Text className="font-outfit-bold text-lg text-text-primary ml-1.5">digest</Text>
        </View>

        {/* Progressive step dots */}
        <View className="flex-row items-center space-x-1.5 gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <View
              key={i}
              className="h-1.5 rounded-full"
              style={{
                width: i === step ? 20 : 6,
                backgroundColor: i <= step ? '#4C6E58' : 'rgba(98, 106, 102, 0.15)',
              }}
            />
          ))}
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
        <View className="p-6 bg-white border-t border-border-muted">
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

export default function OnboardingScreen() {
  const router = useRouter();
  const setProfile = useDiaryStore((state) => state.setProfile);

  // Form states
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [name, setName] = useState('');
  const [country, setCountry] = useState<'EG' | 'GB'>('EG');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthYear, setBirthYear] = useState('1998');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('75');
  const [activity, setActivity] = useState<'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active'>('moderately_active');
  const [goal, setGoal] = useState<'lose_weight' | 'maintain_weight' | 'gain_weight'>('lose_weight');

  // Loading shim states for Step 3
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Analyzing biometrics...');
  const spinValue = useRef(new Animated.Value(0)).current;

  // Setup spinning animation for Step 3
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (step === 3) {
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

  // Loading steps simulation
  useEffect(() => {
    if (step === 3) {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 0.05;
        if (currentProgress >= 1) {
          clearInterval(interval);
          setLoadingProgress(1);
          
          // Save parameters to draft profile
          const currentYear = new Date().getFullYear();
          const ageVal = currentYear - (parseInt(birthYear) || 28);
          const weightVal = parseFloat(weight) || 75;
          const heightVal = parseFloat(height) || 175;

          const baseProfile = {
            name: name.trim() || 'Guest',
            gender,
            age: ageVal,
            weight_kg: weightVal,
            height_cm: heightVal,
            activity_level: activity,
            health_goal: goal,
            language: 'en' as const, // default English for funnel screen
            country,
            onboarded: false, // will set to true on Clerk Signup completion
          };

          const targets = calculateNutrientTargets(baseProfile);
          setProfile({
            ...baseProfile,
            ...targets,
          });

          // Transition to onboarding results
          router.replace('/onboarding_results');
        } else {
          setLoadingProgress(currentProgress);
          if (currentProgress < 0.35) {
            setLoadingText('Analyzing biometrics...');
          } else if (currentProgress < 0.70) {
            setLoadingText('Computing BMR and metabolic rate...');
          } else {
            setLoadingText('Selecting localized recipes...');
          }
        }
      }, 150);

      return () => clearInterval(interval);
    }
  }, [step]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Steps Navigation
  const handleStep0Next = () => {
    if (name.trim().length >= 2) {
      setStep(1);
    }
  };

  const handleStep1Next = () => {
    const hVal = parseFloat(height);
    const wVal = parseFloat(weight);
    const yVal = parseInt(birthYear);
    const currentYear = new Date().getFullYear();

    if (
      hVal >= 100 && hVal <= 250 &&
      wVal >= 30 && wVal <= 300 &&
      yVal >= 1900 && yVal <= currentYear
    ) {
      setStep(2);
    }
  };

  const handleStep2Next = () => {
    setStep(3);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9F8' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {step === 0 && (
          <OnboardShell
            step={0}
            ctaLabel="Continue"
            ctaDisabled={name.trim().length < 2}
            onNext={handleStep0Next}
          >
            <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
              <Text className="font-outfit-semibold text-[11px] text-text-muted uppercase tracking-wider mb-2">
                Step 1 of 3 · Identity
              </Text>
              <Text className="font-outfit-bold text-3xl text-text-primary tracking-tight mb-3">
                Let's get to know <Text style={{ fontStyle: 'italic' }}>you</Text>.
              </Text>
              <Text className="font-inter text-sm text-text-muted leading-relaxed mb-8">
                Your personalized targets will be customized based on your body biometrics and country location.
              </Text>

              {/* Name Input */}
              <View className="mb-6">
                <Text className="font-outfit-semibold text-xs text-text-primary mb-2">
                  What is your name?
                </Text>
                <TextInput
                  className="bg-white border border-border-muted rounded-2xl p-4 font-inter text-text-primary text-base"
                  placeholder="Enter your name..."
                  placeholderTextColor="#9CA19E"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              {/* Country preference */}
              <View className="mb-6">
                <Text className="font-outfit-semibold text-xs text-text-primary mb-2">
                  Country of Residence (for localized recommendations)
                </Text>
                <View className="gap-3">
                  <TouchableOpacity
                    onPress={() => setCountry('EG')}
                    className={`flex-row justify-between items-center p-4 border rounded-2xl bg-white ${
                      country === 'EG' ? 'border-accent-sage bg-[#F3F6F3]' : 'border-border-muted'
                    }`}
                  >
                    <View>
                      <Text className={`text-sm font-inter-semibold ${country === 'EG' ? 'text-text-primary' : 'text-text-muted'}`}>
                        Egypt (EG)
                      </Text>
                      <Text className="text-[10px] font-inter text-text-muted mt-0.5">
                        Prioritize Middle Eastern and Egyptian recipes
                      </Text>
                    </View>
                    {country === 'EG' && <Ionicons name="checkmark-circle" size={20} color="#4C6E58" />}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setCountry('GB')}
                    className={`flex-row justify-between items-center p-4 border rounded-2xl bg-white ${
                      country === 'GB' ? 'border-accent-sage bg-[#F3F6F3]' : 'border-border-muted'
                    }`}
                  >
                    <View>
                      <Text className={`text-sm font-inter-semibold ${country === 'GB' ? 'text-text-primary' : 'text-text-muted'}`}>
                        United Kingdom (GB)
                      </Text>
                      <Text className="text-[10px] font-inter text-text-muted mt-0.5">
                        Prioritize Western and European recipes
                      </Text>
                    </View>
                    {country === 'GB' && <Ionicons name="checkmark-circle" size={20} color="#4C6E58" />}
                  </TouchableOpacity>
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
                Step 2 of 3 · Biometrics
              </Text>
              <Text className="font-outfit-bold text-3xl text-text-primary tracking-tight mb-3">
                Your body details.
              </Text>
              <Text className="font-inter text-sm text-text-muted leading-relaxed mb-6">
                Your biometrics help calculate metabolic rates accurately using the Mifflin-St Jeor formula.
              </Text>

              {/* Gender selection */}
              <View className="mb-6">
                <Text className="font-outfit-semibold text-xs text-text-primary mb-3">
                  Gender
                </Text>
                <View className="flex-row gap-4">
                  <TouchableOpacity
                    onPress={() => setGender('male')}
                    className={`flex-1 p-4 border rounded-2xl bg-white items-center flex-row justify-center ${
                      gender === 'male' ? 'border-accent-sage bg-[#F3F6F3]' : 'border-border-muted'
                    }`}
                  >
                    <Ionicons name="male" size={18} color={gender === 'male' ? '#4C6E58' : '#626A66'} />
                    <Text className={`text-sm font-outfit-bold ml-2 ${gender === 'male' ? 'text-accent-sage' : 'text-text-muted'}`}>
                      Male
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setGender('female')}
                    className={`flex-1 p-4 border rounded-2xl bg-white items-center flex-row justify-center ${
                      gender === 'female' ? 'border-accent-sage bg-[#F3F6F3]' : 'border-border-muted'
                    }`}
                  >
                    <Ionicons name="female" size={18} color={gender === 'female' ? '#4C6E58' : '#626A66'} />
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
                  className="bg-white border border-border-muted rounded-2xl p-4 font-inter text-text-primary text-base"
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
                    className="bg-white border border-border-muted rounded-2xl p-4 font-inter text-text-primary text-base text-center"
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
                    className="bg-white border border-border-muted rounded-2xl p-4 font-inter text-text-primary text-base text-center"
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

        {step === 2 && (
          <OnboardShell
            step={2}
            ctaLabel="Calculate plan"
            onNext={handleStep2Next}
          >
            <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
              <Text className="font-outfit-semibold text-[11px] text-text-muted uppercase tracking-wider mb-2">
                Step 3 of 3 · Lifestyle
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
                        className={`flex-row justify-between items-center p-3.5 border rounded-2xl bg-white ${
                          activity === level ? 'border-accent-sage bg-[#F3F6F3]' : 'border-border-muted'
                        }`}
                      >
                        <Text className={`text-xs font-inter-medium ${activity === level ? 'text-text-primary font-inter-semibold' : 'text-text-muted'}`}>
                          {titles[level]}
                        </Text>
                        {activity === level && <Ionicons name="checkmark" size={16} color="#4C6E58" />}
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
                        className={`flex-row justify-between items-center p-3.5 border rounded-2xl bg-white ${
                          goal === g ? 'border-accent-sage bg-[#F3F6F3]' : 'border-border-muted'
                        }`}
                      >
                        <Text className={`text-xs font-inter-medium ${goal === g ? 'text-text-primary font-inter-semibold' : 'text-text-muted'}`}>
                          {titles[g]}
                        </Text>
                        {goal === g && <Ionicons name="checkmark" size={16} color="#4C6E58" />}
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
              <View className="w-full bg-white rounded-3xl border border-border-muted p-6 items-center shadow-sm">
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
                    color="#4C6E58"
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
                <View className="w-full h-2 bg-[#EAECEB] rounded-full overflow-hidden mb-4">
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
