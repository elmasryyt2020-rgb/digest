import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useDiaryStore } from '@/store/useDiaryStore';
import { ClerkSignUpModal } from '@/components/ClerkSignUpModal';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Suppress Reanimated reading value during component render warnings from third-party libraries
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

// Import global CSS styling for NativeWind
import '../global.css';

// Import Expo Google Fonts
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

export {
  ErrorBoundary,
} from 'expo-router';

// Prevent splash screen auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Outfit-Regular': Outfit_400Regular,
    'Outfit-Medium': Outfit_500Medium,
    'Outfit-SemiBold': Outfit_600SemiBold,
    'Outfit-Bold': Outfit_700Bold,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-Bold': Inter_700Bold,
  });

  const initializeDefaultProfile = useDiaryStore((state) => state.initializeDefaultProfile);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // Initialize default user statistics on mount
      initializeDefaultProfile();
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <KeyboardProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="onboarding_results" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="diary/index" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="food/search" options={{ headerShown: false }} />
      </Stack>
      
      {/* Global Clerk SignUp Modal triggered when limits are reached */}
      <ClerkSignUpModal />
    </KeyboardProvider>
  );
}
