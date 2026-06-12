import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useDiaryStore } from '@/store/useDiaryStore';
import { useAuthStore } from '@/store/useAuthStore';
import { PresstoButton } from '@/components/PresstoButton';
import { images } from '@/constants/images';

export default function WelcomeScreen() {
  const router = useRouter();
  const profile = useDiaryStore((state) => state.profile);
  const setProfile = useDiaryStore((state) => state.setProfile);
  const initializeDefaultProfile = useDiaryStore((state) => state.initializeDefaultProfile);
  const isSignedIn = useAuthStore((state) => state.isSignedIn);

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
      {/* Ambient floating blobs */}
      <View style={[styles.blob, styles.blobSage]} />
      <View style={[styles.blob, styles.blobTerracotta]} />
      <View style={[styles.blob, styles.blobGold]} />

      <View className="flex-1 px-8 justify-between pb-10 pt-4 relative z-10">
        {/* Header */}
        <View style={[styles.header, isRtl && styles.rtlRow]}>
          {/* Logo */}
          <View style={[styles.logoContainer, isRtl && styles.rtlRow]}>
            <Ionicons name="heart" size={28} color="#4C6E58" />
            <Text className="font-outfit-bold text-2xl text-text-primary ml-2 mr-2">digest</Text>
          </View>

          {/* Language segmented control */}
          <View style={styles.langSelector}>
            <Pressable
              onPress={() => toggleLanguage('ar')}
              style={[styles.langBtn, language === 'ar' && styles.langBtnActive]}
            >
              <Text style={[styles.langText, language === 'ar' && styles.langTextActive]}>عربي</Text>
            </Pressable>
            <Pressable
              onPress={() => toggleLanguage('en')}
              style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
            >
              <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>EN</Text>
            </Pressable>
          </View>
        </View>

        {/* Hero Bento Card with Backlight Glow */}
        <View style={styles.heroWrapper}>
          {/* Backlight Glows */}
          <View style={styles.glowMint} />
          <View style={styles.glowTerracotta} />

          {/* Translucent Bento Card */}
          <View style={styles.bentoCard}>
            <Image
              source={images.welcomeHero}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Value Proposition */}
        <View style={[styles.textWrapper, isRtl && styles.rtlAlign]}>
          <Text className="font-outfit-bold text-[40px] leading-[46px] text-text-primary tracking-tighter mb-4">
            {t.titleLine1}{'\n'}/ <Text style={styles.italicText}>{t.titleLine2}</Text>
          </Text>
          <Text className="font-inter text-base text-text-muted leading-relaxed max-w-[320px]">
            {t.subtitle}
          </Text>
        </View>

        {/* CTA Actions */}
        <View className="w-full">
          <PresstoButton
            onPress={() => router.push('/onboarding')}
            className="bg-accent-sage rounded-full py-5 items-center justify-center shadow-sm"
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
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobSage: {
    top: 60,
    left: -40,
    width: 180,
    height: 180,
    backgroundColor: '#4C6E58',
    opacity: 0.08,
  },
  blobTerracotta: {
    top: '45%',
    right: -60,
    width: 220,
    height: 220,
    backgroundColor: '#E58C73',
    opacity: 0.08,
  },
  blobGold: {
    bottom: 80,
    left: -30,
    width: 160,
    height: 160,
    backgroundColor: '#D3B177',
    opacity: 0.1,
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
  langSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(98, 106, 102, 0.06)',
    padding: 3,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(98, 106, 102, 0.08)',
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  langBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1A1E1C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 1,
    elevation: 1,
  },
  langText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#626A66',
  },
  langTextActive: {
    color: '#1A1E1C',
    fontWeight: '600',
  },
  heroWrapper: {
    height: '35%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 16,
  },
  glowMint: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#E2ECD7',
    opacity: 0.45,
    filter: 'blur(35px)',
    transform: [{ translateX: -40 }, { translateY: -20 }],
  },
  glowTerracotta: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#E58C73',
    opacity: 0.2,
    filter: 'blur(30px)',
    transform: [{ translateX: 50 }, { translateY: 30 }],
  },
  bentoCard: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#4C6E58',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  heroImage: {
    width: '85%',
    height: '85%',
  },
  textWrapper: {
    marginTop: 8,
    width: '100%',
  },
  rtlAlign: {
    alignItems: 'flex-end',
  },
  italicText: {
    fontStyle: 'italic',
  },
});
