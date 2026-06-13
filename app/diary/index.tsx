import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDiaryStore } from '@/store/useDiaryStore';

interface MicroNutrientProps {
  name_en: string;
  name_ar: string;
  value: number;
  target: number;
  unit: string;
  color: string;
  isRtl: boolean;
}

// MicroBar progress indicator
function MicroBar({ name_en, name_ar, value, target, unit, color, isRtl }: MicroNutrientProps) {
  const percentage = Math.min((value / (target || 1)) * 100, 100);
  
  return (
    <View className="mb-4">
      <View className={`flex-row justify-between items-center mb-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <Text className="text-xs font-outfit-semibold text-text-primary">{isRtl ? name_ar : name_en}</Text>
        <Text className="text-[11px] font-inter-medium text-text-muted">
          {Math.round(value * 10) / 10} / {target} {unit}
        </Text>
      </View>
      <View className="h-1.5 bg-[#F0F2F0] rounded-full overflow-hidden">
        <View 
          className="h-full rounded-full"
          style={{ 
            backgroundColor: color, 
            width: `${percentage}%` 
          }} 
        />
      </View>
    </View>
  );
}

export default function DiaryDetailsScreen() {
  const router = useRouter();
  const profile = useDiaryStore((state) => state.profile);
  const foodLogs = useDiaryStore((state) => state.foodLogs);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayFoodLogs = foodLogs.filter(log => log.logged_date === todayStr);

  const language = profile?.language || 'ar';
  const isRtl = language === 'ar';

  const t = {
    title: isRtl ? 'تحليل العناصر الغذائية' : 'Nutrient Breakdown',
    subtitle: isRtl ? 'تفاصيل الفيتامينات والمعادن والمغذيات اليومية' : 'Details of vitamins, minerals, and daily nutrients',
    back: isRtl ? 'عودة' : 'Back',
    vitamins: isRtl ? 'الفيتامينات' : 'Vitamins',
    minerals: isRtl ? 'المعادن' : 'Minerals',
    carbDetails: isRtl ? 'تفاصيل الكربوهيدرات' : 'Carbohydrate Details',
    fatDetails: isRtl ? 'تفاصيل الدهون' : 'Fat Details',
    optimal: isRtl ? 'مستويات ممتازة اليوم!' : 'Optimal levels achieved today!',
    warning: isRtl ? 'مغذيات تحتاج إلى زيادة:' : 'Nutrients needing attention:',
    fiberMsg: isRtl ? 'لقد تجاوزت هدف الألياف اليوم (ممتاز لصحة الهضم).' : 'You exceeded your fiber target today (great for digestion!).',
    vitDMsg: isRtl ? 'معدل فيتامين د منخفض اليوم. حاول التعرض للشمس أو تناول السلمون.' : 'Vitamin D average is low today. Consider sun exposure or salmon.',
  };

  const totalWeight = todayFoodLogs.reduce((sum, log) => sum + log.amount_g, 0);

  // Core micro nutrient estimates (scaled by total logged food weight)
  const micros = {
    vitaminA: (totalWeight * 2.4), // mcg
    vitaminC: (totalWeight * 0.35), // mg
    vitaminD: (totalWeight * 0.012), // mcg
    vitaminE: (totalWeight * 0.04), // mg
    vitaminB12: (totalWeight * 0.008), // mcg
    folate: (totalWeight * 0.8), // mcg
    
    calcium: (totalWeight * 2.2), // mg
    iron: (totalWeight * 0.035), // mg
    potassium: (totalWeight * 6.5), // mg
    sodium: (totalWeight * 3.8), // mg
    magnesium: (totalWeight * 0.9), // mg

    fiber: (totalWeight * 0.06), // g
    sugar: (totalWeight * 0.09), // g

    saturated: (totalWeight * 0.045), // g
    trans: (totalWeight * 0.001), // g
    cholesterol: (totalWeight * 0.45), // mg
  };

  const targets = {
    vitaminA: 900, 
    vitaminC: 90, 
    vitaminD: 15, 
    vitaminE: 15, 
    vitaminB12: 2.4, 
    folate: 400, 
    calcium: 1000, 
    iron: 18, 
    potassium: 3500, 
    sodium: 2300, 
    magnesium: 400, 
    fiber: 30, 
    sugar: 50, 
    saturated: 20, 
    trans: 2, 
    cholesterol: 300, 
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9F8' }}>
      {/* Header */}
      <View className={`flex-row justify-between items-center px-5 py-4 bg-white border-b border-border-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          className={`flex-row items-center py-1.5 px-3 rounded-xl bg-accent-mint ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          <Ionicons name={isRtl ? 'arrow-forward' : 'arrow-back'} size={18} color="#4C6E58" />
          <Text className={`font-outfit-bold text-accent-sage text-xs mx-1`}>
            {t.back}
          </Text>
        </TouchableOpacity>
        <Text className="text-base font-outfit-bold text-text-primary">{t.title}</Text>
        <View className="w-16" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Dynamic Alerts based on actual levels */}
        {totalWeight > 0 && (
          <View className="mb-5">
            {/* Optimal Alert */}
            {micros.fiber >= targets.fiber && (
              <View className={`flex-row p-3.5 rounded-2xl mb-3 border bg-accent-mint border-[#C3D9B6] ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Ionicons name="checkmark-circle" size={18} color="#4C6E58" style={{ marginRight: isRtl ? 0 : 8, marginLeft: isRtl ? 8 : 0 }} />
                <View className={`flex-1 ${isRtl ? 'items-end' : 'items-start'}`}>
                  <Text className="text-xs font-outfit-bold text-accent-sage mb-0.5">{t.optimal}</Text>
                  <Text className="text-[10px] font-inter-medium text-text-muted leading-relaxed">{t.fiberMsg}</Text>
                </View>
              </View>
            )}

            {/* Warning Alert */}
            {micros.vitaminD < (targets.vitaminD / 2) && (
              <View className={`flex-row p-3.5 rounded-2xl mb-3 border bg-[#FFF2EE] border-[#FBD5D5] ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Ionicons name="warning" size={18} color="#E58C73" style={{ marginRight: isRtl ? 0 : 8, marginLeft: isRtl ? 8 : 0 }} />
                <View className={`flex-1 ${isRtl ? 'items-end' : 'items-start'}`}>
                  <Text className="text-xs font-outfit-bold text-nutrient-calories mb-0.5">{t.warning}</Text>
                  <Text className="text-[10px] font-inter-medium text-text-muted leading-relaxed">{t.vitDMsg}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Vitamins Section */}
        <View className="bg-white rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
          <Text className={`text-sm font-outfit-bold text-text-primary mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t.vitamins}</Text>
          
          <MicroBar name_en="Vitamin A" name_ar="فيتامين أ" value={micros.vitaminA} target={targets.vitaminA} unit="mcg" color="#7E9DB0" isRtl={isRtl} />
          <MicroBar name_en="Vitamin C" name_ar="فيتامين ج" value={micros.vitaminC} target={targets.vitaminC} unit="mg" color="#E58C73" isRtl={isRtl} />
          <MicroBar name_en="Vitamin D" name_ar="فيتامين د" value={micros.vitaminD} target={targets.vitaminD} unit="mcg" color="#D3B177" isRtl={isRtl} />
          <MicroBar name_en="Vitamin E" name_ar="فيتامين هـ" value={micros.vitaminE} target={targets.vitaminE} unit="mg" color="#9CA19E" isRtl={isRtl} />
          <MicroBar name_en="Vitamin B12" name_ar="فيتامين ب١٢" value={micros.vitaminB12} target={targets.vitaminB12} unit="mcg" color="#7E9DB0" isRtl={isRtl} />
          <MicroBar name_en="Folate" name_ar="حمض الفوليك" value={micros.folate} target={targets.folate} unit="mcg" color="#4C6E58" isRtl={isRtl} />
        </View>

        {/* Minerals Section */}
        <View className="bg-white rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
          <Text className={`text-sm font-outfit-bold text-text-primary mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t.minerals}</Text>

          <MicroBar name_en="Calcium" name_ar="الكالسيوم" value={micros.calcium} target={targets.calcium} unit="mg" color="#7E9DB0" isRtl={isRtl} />
          <MicroBar name_en="Iron" name_ar="الحديد" value={micros.iron} target={targets.iron} unit="mg" color="#E58C73" isRtl={isRtl} />
          <MicroBar name_en="Potassium" name_ar="البوتاسيوم" value={micros.potassium} target={targets.potassium} unit="mg" color="#D3B177" isRtl={isRtl} />
          <MicroBar name_en="Sodium" name_ar="الصوديوم" value={micros.sodium} target={targets.sodium} unit="mg" color="#9CA19E" isRtl={isRtl} />
          <MicroBar name_en="Magnesium" name_ar="المغنيسيوم" value={micros.magnesium} target={targets.magnesium} unit="mg" color="#4C6E58" isRtl={isRtl} />
        </View>

        {/* Carbohydrates Details */}
        <View className="bg-white rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
          <Text className={`text-sm font-outfit-bold text-text-primary mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t.carbDetails}</Text>

          <MicroBar name_en="Dietary Fiber" name_ar="الألياف الغذائية" value={micros.fiber} target={targets.fiber} unit="g" color="#4C6E58" isRtl={isRtl} />
          <MicroBar name_en="Total Sugars" name_ar="السكريات الكلية" value={micros.sugar} target={targets.sugar} unit="g" color="#E58C73" isRtl={isRtl} />
        </View>

        {/* Fats Details */}
        <View className="bg-white rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
          <Text className={`text-sm font-outfit-bold text-text-primary mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t.fatDetails}</Text>

          <MicroBar name_en="Saturated Fat" name_ar="الدهون المشبعة" value={micros.saturated} target={targets.saturated} unit="g" color="#9CA19E" isRtl={isRtl} />
          <MicroBar name_en="Trans Fat" name_ar="الدهون المتحولة" value={micros.trans} target={targets.trans} unit="g" color="#E58C73" isRtl={isRtl} />
          <MicroBar name_en="Cholesterol" name_ar="الكوليسترول" value={micros.cholesterol} target={targets.cholesterol} unit="mg" color="#7E9DB0" isRtl={isRtl} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
