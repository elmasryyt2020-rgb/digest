import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

import { useDiaryStore } from '@/store/useDiaryStore';
import { useAuthStore } from '@/store/useAuthStore';

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

  // Styling properties
  const bgColor = isDark ? '#101412' : '#F8F9F8';
  const heartColor = isDark ? '#5C856C' : '#4C6E58';

  useEffect(() => {
    // 1. Scale up and fade in the Heart Logo
    logoScale.value = withTiming(1.0, {
      duration: 800,
      easing: Easing.out(Easing.back(1.5)),
    });
    logoOpacity.value = withTiming(1.0, {
      duration: 650,
    });

    // 2. Fade in the "digest" text slightly later
    textOpacity.value = withDelay(
      400,
      withTiming(1.0, {
        duration: 500,
      })
    );

    // 3. Navigate only after authorization is initialized AND splash animation is complete (1.8s)
    let navigationTimer: ReturnType<typeof setTimeout>;

    const performRedirect = () => {
      if (profile?.onboarded && isSignedIn) {
        router.replace('/(tabs)');
      } else {
        router.replace('/welcome');
      }
    };

    const checkAndRedirect = () => {
      // If auth isn't initialized yet, wait and check again in 100ms
      if (!isInitialized) {
        navigationTimer = setTimeout(checkAndRedirect, 100);
      } else {
        performRedirect();
      }
    };

    // Initial delay of 1.8s for the splash entrance animation
    navigationTimer = setTimeout(checkAndRedirect, 1800);

    return () => clearTimeout(navigationTimer);
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
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Ambient background glow matching Welcome screen style but subtle */}
      <View style={[styles.glowSage, { backgroundColor: isDark ? '#1F2E25' : '#E2ECD7' }]} />

      <View className="items-center justify-center z-10">
        <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
          <Ionicons name="heart" size={90} color={heartColor} />
        </Animated.View>
        <Animated.View style={textAnimatedStyle}>
          <Text className="font-outfit-bold text-4xl text-text-primary mt-5 tracking-wider">
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
  },
  glowSage: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.1,
  },
});
