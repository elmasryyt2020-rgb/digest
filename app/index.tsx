import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

import { useDiaryStore } from '@/store/useDiaryStore';
import { useAuthStore } from '@/store/useAuthStore';
import { PresstoButton } from '@/components/PresstoButton';
import { images } from '@/constants/images';
import Svg, { Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';

export default function WelcomeScreen() {
  const router = useRouter();
  const profile = useDiaryStore((state) => state.profile);
  const setProfile = useDiaryStore((state) => state.setProfile);
  const initializeDefaultProfile = useDiaryStore((state) => state.initializeDefaultProfile);
  const isSignedIn = useAuthStore((state) => state.isSignedIn);

  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-12, {
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1, // Infinite loops
      true // Reverse direction on repeat
    );
  }, []);

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedShadowStyle = useAnimatedStyle(() => {
    const scale = interpolate(translateY.value, [-12, 0], [0.75, 1.0], Extrapolate.CLAMP);
    const opacity = interpolate(translateY.value, [-12, 0], [0.2, 0.55], Extrapolate.CLAMP);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // Initialize default profile to detect device locale early
  useEffect(() => {
    initializeDefaultProfile();
  }, []);

  // Auto-redirect if already onboarded and signed in
  useEffect(() => {
    if (profile?.onboarded && isSignedIn) {
      router.replace('/(tabs)');
    }
  }, [profile, isSignedIn]);

  const language = profile?.language || 'ar';
  const isRtl = language === 'ar';

  // Dynamic localized strings
  const t = {
    titleLine1: isRtl ? 'اعثر على توازنك' : 'Find your daily',
    titleLine2: isRtl ? 'اليومي.' : 'balance.',
    subtitle: isRtl
      ? 'مرافقك الذكي لتسجيل الوجبات، تحليل المقاييس الحيوية، واقتراحات الصحة المخصصة.'
      : 'Your smart companion for meal logging, biometrics analysis, and personalized wellness suggestions.',
    getStarted: isRtl ? 'ابدأ الآن' : 'Get started',
    hasAccount: isRtl ? 'هل لديك حساب بالفعل؟' : 'Already have an account?',
    signIn: isRtl ? 'تسجيل الدخول' : 'Sign in',
  };

  const toggleLanguage = (lang: 'ar' | 'en') => {
    setProfile({ language: lang });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Ambient glassmorphic glowing spots */}
      <View style={styles.glowSage} />
      <View style={styles.glowPeach} />

      <View className="flex-1 px-8 justify-between pb-10 pt-4 relative z-10">
        {/* Header */}
        <View style={[styles.header, isRtl && styles.rtlRow]}>
          {/* Logo */}
          <View style={[styles.logoContainer, isRtl && styles.rtlRow]}>
            <Ionicons name="heart" size={28} color="#4C6E58" />
            <Text className="font-outfit-bold text-2xl text-text-primary ml-2 mr-2">digest</Text>
          </View>

          {/* Language minimal switcher */}
          <View className="flex-row items-center">
            <Pressable onPress={() => toggleLanguage('ar')} className="px-1 py-2">
              <Text className={`font-inter text-xs ${language === 'ar' ? 'font-outfit-bold text-text-primary' : 'text-text-muted opacity-50'}`}>
                عربي
              </Text>
            </Pressable>
            <Text className="text-text-muted mx-2 text-xs opacity-30">•</Text>
            <Pressable onPress={() => toggleLanguage('en')} className="px-1 py-2">
              <Text className={`font-inter text-xs ${language === 'en' ? 'font-outfit-bold text-text-primary' : 'text-text-muted opacity-50'}`}>
                EN
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Floating Transparent Hero */}
        <View style={styles.heroContainer}>
          {/* Bobbing Image Wrapper */}
          <Animated.View style={[styles.heroImageWrapper, animatedImageStyle]}>
            <Image
              source={images.welcomeHero}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </Animated.View>
          
          {/* Synchronized Volumetric Shadow */}
          <Animated.View style={[styles.volumetricShadow, animatedShadowStyle]}>
            <Svg height="100%" width="100%" viewBox="0 0 200 40">
              <Defs>
                <RadialGradient
                  id="volumetricShadowGrad"
                  cx="50%"
                  cy="50%"
                  rx="50%"
                  ry="50%"
                  fx="50%"
                  fy="50%"
                >
                  <Stop offset="0%" stopColor="#1C2820" stopOpacity="0.8" />
                  <Stop offset="30%" stopColor="#1C2820" stopOpacity="0.55" />
                  <Stop offset="65%" stopColor="#1C2820" stopOpacity="0.2" />
                  <Stop offset="100%" stopColor="#1C2820" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Ellipse cx="100" cy="20" rx="90" ry="16" fill="url(#volumetricShadowGrad)" />
            </Svg>
          </Animated.View>
        </View>

        {/* Value Proposition */}
        <View style={[styles.textWrapper, isRtl && styles.rtlAlign]} className="px-2 mt-4">
          <Text className={`font-outfit-bold text-[48px] leading-[52px] text-text-primary tracking-tighter mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
            {t.titleLine1}{'\n'}/ <Text className="font-outfit-semibold italic text-accent-sage">{t.titleLine2}</Text>
          </Text>
          <Text className={`font-inter text-base text-text-muted leading-relaxed max-w-[280px] my-4 ${isRtl ? 'text-right' : 'text-left'}`}>
            {t.subtitle}
          </Text>
        </View>

        {/* CTA Actions */}
        <View className="w-full">
          <PresstoButton
            onPress={() => router.push('/onboarding')}
            style={styles.ctaButton}
            className="bg-accent-sage rounded-full py-5 items-center justify-center"
          >
            <Text className="text-white font-outfit-bold text-base tracking-wide">
              {t.getStarted}
            </Text>
          </PresstoButton>

          <PresstoButton
            onPress={() => router.push('/sign-in')}
            className="items-center py-4 mt-3"
          >
            <Text className="font-inter text-xs text-text-muted">
              {t.hasAccount}{' '}
              <Text className="text-text-primary font-inter-bold underline">
                {t.signIn}
              </Text>
            </Text>
          </PresstoButton>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9F8',
  },
  glowSage: {
    position: 'absolute',
    top: 50,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#E2ECD7',
    opacity: 0.15,
    ...Platform.select({
      web: {
        filter: 'blur(60px)',
      } as any,
    }),
  },
  glowPeach: {
    position: 'absolute',
    top: '35%',
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#E58C73',
    opacity: 0.1,
    ...Platform.select({
      web: {
        filter: 'blur(60px)',
      } as any,
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroContainer: {
    height: '38%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 12,
  },
  heroImageWrapper: {
    width: '100%',
    height: '85%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  heroImage: {
    width: '90%',
    height: '100%',
  },
  volumetricShadow: {
    position: 'absolute',
    bottom: -6,
    width: 170,
    height: 30,
    zIndex: 1,
  },
  textWrapper: {
    marginTop: 8,
    width: '100%',
  },
  rtlAlign: {
    alignItems: 'flex-end',
  },
  ctaButton: {
    borderRadius: 9999,
    shadowColor: '#4C6E58',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
});
