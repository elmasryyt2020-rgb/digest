import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';

import { useDiaryStore } from '@/store/useDiaryStore';
import { PresstoButton } from '@/components/PresstoButton';

export default function OnboardingResultsScreen() {
  const router = useRouter();
  const profile = useDiaryStore((state) => state.profile);

  // Targets are computed in onboarding.tsx and set in Zustand
  const targetCalories = profile?.target_calories || 1850;
  const targetProtein = profile?.target_protein_g || 130;
  const targetCarbs = profile?.target_carbs_g || 190;
  const targetFat = profile?.target_fat_g || 60;
  const country = profile?.country || 'EG';
  const goal = profile?.health_goal || 'lose_weight';

  // Localized Meal suggestions
  const suggestions = country === 'EG'
    ? [
        { name: 'Grilled Kofta & Baladi Bread', calories: '480 kcal', desc: 'Lean beef grilled kofta served inside whole wheat baladi bread with tahini and fresh parsley.' },
        { name: 'Foul Mudammas & Falafel', calories: '380 kcal', desc: 'Slow-cooked fava beans with olive oil, cumin, served with two baked falafels and green salad.' },
        { name: 'Koshari Bowl (Rice, Lentils, Macaroni)', calories: '540 kcal', desc: 'Traditional Egyptian mix of lentils, rice, pasta, topped with tomato sauce and crispy onions.' }
      ]
    : [
        { name: 'Oatmeal with Berries', calories: '320 kcal', desc: 'Organic rolled oats boiled in almond milk, topped with fresh raspberries, blueberries, and honey.' },
        { name: 'Grilled Salmon & Asparagus', calories: '460 kcal', desc: 'Atlantic salmon fillet grilled with herbs, served with steamed asparagus and baby potatoes.' },
        { name: 'Chicken Tikka Masala with Rice', calories: '580 kcal', desc: 'Spiced chicken breast simmered in a creamy tomato sauce, served alongside white basmati rice.' }
      ];

  // SVG Chart data based on goal
  const chartWidth = 320;
  const chartHeight = 120;
  
  const getChartPath = () => {
    if (goal === 'lose_weight') {
      return `M 20 20 Q 100 50, 180 80 T 300 100`; // Downward curve
    } else if (goal === 'gain_weight') {
      return `M 20 100 Q 100 80, 180 50 T 300 20`; // Upward curve
    } else {
      return `M 20 60 Q 100 55, 180 65 T 300 60`; // Flat/Wavy curve
    }
  };

  const getPoints = () => {
    if (goal === 'lose_weight') {
      return [
        { x: 20, y: 20, label: 'Wk 1' },
        { x: 110, y: 55, label: 'Wk 2' },
        { x: 200, y: 82, label: 'Wk 3' },
        { x: 300, y: 100, label: 'Wk 4' },
      ];
    } else if (goal === 'gain_weight') {
      return [
        { x: 20, y: 100, label: 'Wk 1' },
        { x: 110, y: 78, label: 'Wk 2' },
        { x: 200, y: 48, label: 'Wk 3' },
        { x: 300, y: 20, label: 'Wk 4' },
      ];
    } else {
      return [
        { x: 20, y: 60, label: 'Wk 1' },
        { x: 110, y: 57, label: 'Wk 2' },
        { x: 200, y: 63, label: 'Wk 3' },
        { x: 300, y: 60, label: 'Wk 4' },
      ];
    }
  };

  const points = getPoints();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9F8' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 220 }} showsVerticalScrollIndicator={false}>
        
        {/* Title */}
        <Text className="font-outfit-semibold text-[11px] text-text-muted uppercase tracking-wider mb-2">
          Calculations Complete
        </Text>
        <Text className="font-outfit-bold text-3xl text-text-primary tracking-tight mb-2">
          Your custom <Text style={{ fontStyle: 'italic' }}>plan</Text>.
        </Text>
        <Text className="font-inter text-sm text-text-muted leading-relaxed mb-6">
          We have generated your target macros and weight projection based on your profile inputs.
        </Text>

        {/* Target Calories Bento Box */}
        <View className="bg-white rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
          <Text className="font-outfit-bold text-xs text-text-primary mb-1">Daily Target Calories</Text>
          <Text className="font-outfit-bold text-4xl text-nutrient-calories tracking-tight mb-4">{targetCalories} kcal</Text>
          
          <Text className="font-outfit-bold text-xs text-text-primary mb-3">Daily Macronutrient Targets</Text>
          <View className="flex-row justify-between gap-2">
            
            {/* Protein */}
            <View className="flex-1 bg-[#7E9DB0]/10 rounded-2xl p-3 items-center">
              <Text className="font-outfit-bold text-base text-[#5D7E92]">{targetProtein}g</Text>
              <Text className="font-inter text-[10px] text-[#5D7E92] font-semibold mt-0.5">Protein</Text>
            </View>

            {/* Carbs */}
            <View className="flex-1 bg-[#D3B177]/10 rounded-2xl p-3 items-center">
              <Text className="font-outfit-bold text-base text-[#A9894E]">{targetCarbs}g</Text>
              <Text className="font-inter text-[10px] text-[#A9894E] font-semibold mt-0.5">Carbs</Text>
            </View>

            {/* Fat */}
            <View className="flex-1 bg-[#9CA19E]/10 rounded-2xl p-3 items-center">
              <Text className="font-outfit-bold text-base text-[#767B78]">{targetFat}g</Text>
              <Text className="font-inter text-[10px] text-[#767B78] font-semibold mt-0.5">Fats</Text>
            </View>
          </View>
        </View>

        {/* SVG Weight projection graph */}
        <View className="bg-white rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
          <Text className="font-outfit-bold text-xs text-text-primary mb-1">Predicted Weight Trajectory</Text>
          <Text className="font-inter text-[10px] text-text-muted mb-4">4-week projection curve based on metabolic targets</Text>
          
          <View className="items-center my-2 justify-center">
            <Svg width={chartWidth} height={chartHeight}>
              {/* Curve line */}
              <Path
                d={getChartPath()}
                fill="none"
                stroke="#4C6E58"
                strokeWidth={3}
              />
              
              {/* Point dots */}
              {points.map((p, idx) => (
                <React.Fragment key={idx}>
                  <Circle
                    cx={p.x}
                    cy={p.y}
                    r={5}
                    fill="#F8F9F8"
                    stroke="#4C6E58"
                    strokeWidth={2}
                  />
                  <SvgText
                    x={p.x}
                    y={p.y > 60 ? p.y - 12 : p.y + 18}
                    fontSize="9"
                    fontFamily="Inter-Medium"
                    fill="#626A66"
                    textAnchor="middle"
                  >
                    {p.label}
                  </SvgText>
                </React.Fragment>
              ))}
            </Svg>
          </View>
        </View>

        {/* Localized Meal Recommendations */}
        <View className="bg-white rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
          <Text className="font-outfit-bold text-xs text-text-primary mb-1">Localized Recipe Suggestions</Text>
          <Text className="font-inter text-[10px] text-text-muted mb-4">Customized recipes fitting your selected regional profile</Text>
          
          <View className="gap-3">
            {suggestions.map((item, idx) => (
              <View key={idx} className="border border-border-muted rounded-2xl p-4 bg-[#F8F9F8]">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="font-outfit-bold text-xs text-text-primary flex-1 mr-2">{item.name}</Text>
                  <Text className="font-inter text-[10px] text-nutrient-calories font-bold">{item.calories}</Text>
                </View>
                <Text className="font-inter text-[10px] text-text-muted leading-relaxed">{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Lock Overlay Shield */}
      <View style={styles.lockContainer} pointerEvents="box-none">
        {/* Simulated Faded Gradient Masks */}
        <View style={[styles.gradientLayer, { backgroundColor: '#F8F9F8', opacity: 0.2, bottom: 200, height: 20 }]} />
        <View style={[styles.gradientLayer, { backgroundColor: '#F8F9F8', opacity: 0.5, bottom: 180, height: 20 }]} />
        <View style={[styles.gradientLayer, { backgroundColor: '#F8F9F8', opacity: 0.8, bottom: 160, height: 20 }]} />
        <View style={[styles.gradientLayer, { backgroundColor: '#F8F9F8', opacity: 0.95, bottom: 0, height: 160 }]} />

        {/* Gated lock card */}
        <View className="mx-6 mb-6 bg-white border border-border-muted rounded-3xl p-5 shadow-lg relative z-20">
          <View className="flex-row items-center gap-1.5 mb-2">
            <Ionicons name="lock-closed" size={16} color="#626A66" />
            <Text className="font-outfit-semibold text-[11px] text-text-muted uppercase tracking-wider">
              More details waiting
            </Text>
          </View>
          
          <Text className="font-outfit-bold text-xl text-text-primary tracking-tight mb-2">
            Unlock your full personalized health profile
          </Text>
          
          <Text className="font-inter text-xs text-text-muted leading-relaxed mb-4">
            Sign up free to unlock your custom calorie calculators, full AI meal diary scanner, localized recipe search, and shopping lists.
          </Text>

          <PresstoButton
            onPress={() => router.push('/sign-up')}
            className="bg-accent-sage rounded-2xl py-4 flex-row justify-center items-center"
          >
            <Text className="text-white font-outfit-bold text-sm">Sign up to reveal</Text>
          </PresstoButton>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  lockContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
  },
  gradientLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
