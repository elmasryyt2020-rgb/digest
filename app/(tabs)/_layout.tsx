import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useDiaryStore } from '@/store/useDiaryStore';
import { useAuthStore } from '@/store/useAuthStore';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const language = useDiaryStore((state) => state.profile?.language) || 'ar';
  const isRtl = language === 'ar';
  const insets = useSafeAreaInsets();

  const isSignedIn = useAuthStore((state) => state.isSignedIn);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isSignedIn) {
      router.replace('/');
    }
  }, [isSignedIn, isInitialized]);

  const bottomInset = insets.bottom;
  const tabHeight = 60 + bottomInset;
  const paddingBottom = bottomInset > 0 ? bottomInset : 8;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? '#5C856C' : '#4C6E58', // Sage Green dynamic
        tabBarInactiveTintColor: isDark ? '#8A9690' : '#626A66', // Muted Gray dynamic
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#161B18' : '#FFFFFF',
          borderTopWidth: 0,
          borderTopColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
          height: tabHeight,
          paddingBottom: paddingBottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'Outfit-Medium',
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isRtl ? 'الرئيسية' : 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: isRtl ? 'الوصفات الذكية' : 'AI Recipes',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'restaurant' : 'restaurant-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isRtl ? 'الملف الشخصي' : 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
