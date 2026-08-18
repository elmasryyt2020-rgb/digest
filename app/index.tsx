import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';

import { useDiaryStore } from '@/store/useDiaryStore';
import { useAuthStore } from '@/store/useAuthStore';
import { images } from '@/constants/images';

export default function CustomSplashScreen() {
  const router = useRouter();
  const profile = useDiaryStore((state) => state.profile);
  const isSignedIn = useAuthStore((state) => state.isSignedIn);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation values
  const logoScale = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(12);

  // Styling properties
  const bgColor = isDark ? '#101412' : '#F8F9F8';

  useEffect(() => {
    // 1. Spring scale and fade in the official Logo
    logoScale.value = withSpring(1.0, {
      damping: 14,
      stiffness: 100,
      mass: 0.8,
    });
    logoOpacity.value = withTiming(1.0, {
      duration: 500,
    });

    // 2. Fade in and slide up the "digest" branding text
    textOpacity.value = withDelay(
      350,
      withTiming(1.0, {
        duration: 450,
      })
    );
    textTranslateY.value = withDelay(
      350,
      withTiming(0, {
        duration: 450,
        easing: Easing.out(Easing.cubic),
      })
    );

    // 3. Navigate once animation completes and auth is ready
    let timer: ReturnType<typeof setTimeout>;

    const performRedirect = () => {
      if (profile?.onboarded && isSignedIn) {
        router.replace('/(tabs)');
      } else {
        router.replace('/welcome');
      }
    };

    const checkAndRedirect = () => {
      if (!isInitialized) {
        timer = setTimeout(checkAndRedirect, 100);
      } else {
        performRedirect();
      }
    };

    // Allow the entrance animation to play for 1.4s before smoothly transitioning
    timer = setTimeout(checkAndRedirect, 1400);

    return () => clearTimeout(timer);
  }, [isInitialized, profile?.onboarded, isSignedIn]);

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
      transform: [{ scale: logoScale.value }],
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      transform: [{ translateY: textTranslateY.value }],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Ambient background glow spots matching Welcome screen aesthetic */}
      <View style={[styles.glowSage, { backgroundColor: isDark ? '#1F2E25' : '#E2ECD7' }]} />
      <View style={[styles.glowPeach, { backgroundColor: isDark ? '#E58C73' : '#E58C73', opacity: isDark ? 0.04 : 0.08 }]} />

      <View className="items-center justify-center z-10">
        <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
          <Image
            source={images.splashIcon}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>
        <Animated.View style={textAnimatedStyle}>
          <Text className="font-outfit-bold text-4xl text-text-primary mt-4 tracking-wider">
            digest
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 110,
    height: 110,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  glowSage: {
    position: 'absolute',
    top: '32%',
    left: '12%',
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.14,
    ...Platform.select({
      web: {
        filter: 'blur(60px)',
      } as any,
    }),
  },
  glowPeach: {
    position: 'absolute',
    top: '40%',
    right: '10%',
    width: 240,
    height: 240,
    borderRadius: 120,
    ...Platform.select({
      web: {
        filter: 'blur(60px)',
      } as any,
    }),
  },
});


