import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { View, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useDiaryStore } from '@/store/useDiaryStore';
import { useAuthStore } from '@/store/useAuthStore';
import { SupabaseSignUpModal } from '@/components/SupabaseSignUpModal';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { NavigationBar } from 'expo-navigation-bar';

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
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const profile = useDiaryStore((state) => state.profile);

  const { colorScheme, setColorScheme } = useColorScheme();
  const appTheme = profile?.app_theme || 'system';

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // Initialize default user statistics and Supabase auth on mount
      initializeDefaultProfile();
      initializeAuth();
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    setColorScheme(appTheme);
  }, [appTheme, setColorScheme]);



  if (!loaded) {
    return null;
  }

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#101412',
      card: '#161B18',
    },
  };

  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#F8F9F8',
      card: '#FFFFFF',
    },
  };

  return (
    <KeyboardProvider>
      <View style={{ flex: 1 }} className={colorScheme === 'dark' ? 'dark bg-bg-base' : 'bg-bg-base'}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        {Platform.OS === 'android' && (
          <NavigationBar style={colorScheme === 'dark' ? 'dark' : 'light'} />
        )}
        <ThemeProvider value={colorScheme === 'dark' ? customDarkTheme : customLightTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="onboarding_results" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="sign-up" options={{ headerShown: false }} />
            <Stack.Screen name="sign-in" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="diary/index" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="food/search" options={{ headerShown: false }} />
          </Stack>
        </ThemeProvider>
      </View>
      
      {/* Global Supabase SignUp Modal triggered when limits are reached */}
      <SupabaseSignUpModal />
    </KeyboardProvider>
  );
}
