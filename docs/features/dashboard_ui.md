# Feature Specification: Dashboard & UI Layout

This specification details the layout structure, visual widgets, navigation tab configuration, and animations for the **digest** home dashboard using NativeWind (Tailwind CSS).

---

## 1. Visual Composition & Styling (NativeWind)

The dashboard layout is built strictly using Tailwind classes.

```tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProgressRing } from '@/components/ProgressRing';
import { PresstoButton } from '@/components/PresstoButton';

export default function DashboardScreen() {
  return (
    // SafeAreaView requires inline/StyleSheet style according to exceptions list
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9F8' }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header Section */}
        <View className="mb-6 flex-row justify-between items-center">
          <View>
            <Text className="text-xs text-[#626A66] font-inter-medium">May 18, 2026</Text>
            <Text className="text-2xl font-outfit-bold text-[#1A1E1C]">Greetings Robert,</Text>
            <Text className="text-sm text-[#626A66] font-inter-regular">Ready to Track Your Wellness?</Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-white border border-[#EAECEB] justify-center items-center">
            {/* User Profile Trigger Icon */}
          </View>
        </View>

        {/* Bento Grid: Caloric Rings & Macro Widgets */}
        <View className="bg-white p-6 rounded-3xl border border-[#EAECEB] flex-row justify-between items-center mb-6">
          <View className="items-center">
            <ProgressRing percentage={0.39} size={100} />
            <Text className="text-xs text-[#626A66] font-inter-medium mt-2">900 / 2300 kcal</Text>
            <Text className="text-xs font-outfit-semibold text-[#1A1E1C]">Calories</Text>
          </View>

          <View className="flex-col space-y-4">
            {/* Macro Details Row */}
            <View>
              <Text className="text-xs text-[#7E9DB0] font-inter-bold">Protein</Text>
              <Text className="text-sm font-outfit-semibold text-[#1A1E1C]">53g / 125g</Text>
            </View>
            <View>
              <Text className="text-xs text-[#D3B177] font-inter-bold">Carbs</Text>
              <Text className="text-sm font-outfit-semibold text-[#1A1E1C]">140g / 230g</Text>
            </View>
            <View>
              <Text className="text-xs text-[#9CA19E] font-inter-bold">Fats</Text>
              <Text className="text-sm font-outfit-semibold text-[#1A1E1C]">24g / 65g</Text>
            </View>
          </View>
        </View>

        {/* Daily vs. Weekly Toggle */}
        <View className="flex-row bg-[#EAECEB] p-1 rounded-2xl mb-6">
          <PresstoButton className="flex-1 bg-white py-2 rounded-xl items-center">
            <Text className="text-xs font-outfit-bold text-[#1A1E1C]">Daily</Text>
          </PresstoButton>
          <PresstoButton className="flex-1 py-2 rounded-xl items-center">
            <Text className="text-xs font-outfit-medium text-[#626A66]">Weekly</Text>
          </PresstoButton>
        </View>

        {/* Meal Logs Bento List */}
        <View className="flex-row flex-wrap justify-between">
          <View className="w-[48%] bg-white p-4 rounded-3xl border border-[#EAECEB] mb-4">
            <Text className="font-outfit-semibold text-[#1A1E1C]">Breakfast</Text>
            <Text className="text-xs text-[#626A66] mt-1">Boiled Eggs & Toast</Text>
            <Text className="text-[10px] text-[#626A66] mt-4">8:00 AM</Text>
          </View>
          <View className="w-[48%] bg-white p-4 rounded-3xl border border-[#EAECEB] mb-4 justify-between">
            <View>
              <Text className="font-outfit-semibold text-[#1A1E1C]">Lunch</Text>
              <Text className="text-xs text-red-300">Not Logged Yet</Text>
            </View>
            <Text className="text-[10px] text-[#4C6E58] font-inter-medium mt-4">+ Add Log</Text>
          </View>
        </View>

        {/* Water Intake Section */}
        <View className="bg-white p-6 rounded-3xl border border-[#EAECEB] mt-2 items-center">
          <Text className="font-outfit-semibold text-[#1A1E1C] mb-2">Water Intake</Text>
          <Text className="text-2xl font-outfit-bold text-[#4C6E58] mb-4">1200 / 2500 ml</Text>
          <View className="flex-row space-x-4">
            <PresstoButton className="bg-[#E2ECD7] px-4 py-2 rounded-xl">
              <Text className="text-xs text-[#4C6E58] font-inter-bold">+250ml</Text>
            </PresstoButton>
            <PresstoButton className="bg-[#E2ECD7] px-4 py-2 rounded-xl">
              <Text className="text-xs text-[#4C6E58] font-inter-bold">+500ml</Text>
            </PresstoButton>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## 2. Interactive Components & Animations

*   **Calorie Ring:** Uses `react-native-reanimated` SVG components with timing ease configurations.
*   **Press States:** Wrapped in `pressto` components for elastic spring haptics on user taps.
*   **Water Animation:** Animated wave fill transition using `react-native-reanimated` translations.
*   **Layout Easing:** Muted card entries and slides are handled by custom timing hooks utilizing custom Bezier cubic easing properties via `react-native-reanimated`.

---
*End of Specification. Next Spec: Food Search & Caching Spec.*
