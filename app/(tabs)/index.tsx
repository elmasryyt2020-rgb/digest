import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';

import { useDiaryStore } from '@/store/useDiaryStore';
import { activities, ActivityType } from '@/data/activities';
import { ProgressRing } from '@/components/ProgressRing';
import { WaterBottle } from '@/components/WaterBottle';
import { PresstoButton } from '@/components/PresstoButton';
import { parseLocalizedFloat } from '@/lib/formatters';

export default function DashboardScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Zustand State
  const profile = useDiaryStore((state) => state.profile);
  const foodLogs = useDiaryStore((state) => state.foodLogs);
  const waterLogs = useDiaryStore((state) => state.waterLogs);
  const workoutLogs = useDiaryStore((state) => state.workoutLogs);
  const addWaterLog = useDiaryStore((state) => state.addWaterLog);
  const addWorkoutLog = useDiaryStore((state) => state.addWorkoutLog);
  const deleteWorkoutLog = useDiaryStore((state) => state.deleteWorkoutLog);

  // Redirect to Onboarding if not completed
  useEffect(() => {
    if (profile && !profile.onboarded) {
      router.replace('/onboarding' as any);
    }
  }, [profile]);

  // Local UI State
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>(activities[0]);
  const [duration, setDuration] = useState('30');
  
  // Date calculations
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Dynamic translations based on user language
  const language = profile?.language || 'ar';
  const isRtl = language === 'ar';

  const t = {
    greeting: isRtl ? 'أهلاً بك،' : 'Greetings,',
    subtitle: isRtl ? 'جاهز لمتابعة صحتك اليوم؟' : 'Ready to Track Your Wellness?',
    calories: isRtl ? 'السعرات الحرارية' : 'Calories',
    protein: isRtl ? 'البروتين' : 'Protein',
    carbs: isRtl ? 'الكربوهيدرات' : 'Carbs',
    fats: isRtl ? 'الدهون' : 'Fats',
    daily: isRtl ? 'يومي' : 'Daily',
    weekly: isRtl ? 'أسبوعي' : 'Weekly',
    breakfast: isRtl ? 'الفطور' : 'Breakfast',
    lunch: isRtl ? 'الغداء' : 'Lunch',
    dinner: isRtl ? 'العشاء' : 'Dinner',
    snacks: isRtl ? 'سناك / وجبات خفيفة' : 'Snacks',
    notLogged: isRtl ? 'لم تسجل بعد' : 'Not Logged Yet',
    addLog: isRtl ? '+ إضافة سجل' : '+ Add Log',
    waterIntake: isRtl ? 'كمية المياه المشروبة' : 'Water Intake',
    workouts: isRtl ? 'التمارين الرياضية' : 'Workouts',
    burned: isRtl ? 'سعرة حرارية محروقة' : 'kcal burned',
    logWorkout: isRtl ? '+ تسجيل تمرين' : '+ Log Workout',
    workoutDuration: isRtl ? 'المدة (بالدقائق)' : 'Duration (minutes)',
    save: isRtl ? 'حفظ' : 'Save',
    cancel: isRtl ? 'إلغاء' : 'Cancel',
    selectActivity: isRtl ? 'اختر النشاط الرياضي' : 'Select Sport Activity',
    detailLink: isRtl ? 'تفاصيل المغذيات الدقيقة' : 'Micro-nutrient details',
    weeklyAverages: isRtl ? 'المعدلات الأسبوعية' : 'Weekly Averages',
    target: isRtl ? 'الهدف' : 'Target',
  };

  // Filter daily logs
  const todayFoodLogs = foodLogs.filter(log => log.logged_date === todayStr);
  const todayWaterLogs = waterLogs.filter(log => log.logged_date === todayStr);
  const todayWorkoutLogs = workoutLogs.filter(log => log.logged_date === todayStr);

  // Sum daily nutrients
  const eatenCalories = todayFoodLogs.reduce((sum, log) => sum + log.calories, 0);
  const eatenProtein = todayFoodLogs.reduce((sum, log) => sum + log.protein, 0);
  const eatenCarbs = todayFoodLogs.reduce((sum, log) => sum + log.carbs, 0);
  const eatenFat = todayFoodLogs.reduce((sum, log) => sum + log.fat, 0);
  const totalWater = todayWaterLogs.reduce((sum, log) => sum + log.amount_ml, 0);
  const burnedCalories = todayWorkoutLogs.reduce((sum, log) => sum + log.calories_burned, 0);

  // Net Calories
  const netCalories = Math.max(0, eatenCalories - burnedCalories);
  const targetCalories = profile?.target_calories || 2000;
  
  // Weekly Aggregates (Past 7 Days Rolling Window)
  const sevenDaysAgoDate = new Date();
  sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgoDate.toISOString().split('T')[0];

  const pastWeekFoodLogs = foodLogs.filter(log => log.logged_date >= sevenDaysAgoStr);
  const pastWeekWaterLogs = waterLogs.filter(log => log.logged_date >= sevenDaysAgoStr);
  const pastWeekWorkoutLogs = workoutLogs.filter(log => log.logged_date >= sevenDaysAgoStr);

  const weeklyAvgCalories = Math.round(pastWeekFoodLogs.reduce((sum, log) => sum + log.calories, 0) / 7);
  const weeklyAvgWater = Math.round(pastWeekWaterLogs.reduce((sum, log) => sum + log.amount_ml, 0) / 7);
  const weeklyAvgBurned = Math.round(pastWeekWorkoutLogs.reduce((sum, log) => sum + log.calories_burned, 0) / 7);

  // Group food logs by meal type
  const getLogsByMealType = (type: 'breakfast' | 'lunch' | 'dinner' | 'snacks') => {
    return todayFoodLogs.filter(log => log.meal_type === type);
  };

  const handleQuickWaterAdd = (amount: number) => {
    addWaterLog(amount, todayStr);
  };

  const handleWorkoutSubmit = () => {
    const mins = parseLocalizedFloat(duration, 0);
    if (mins <= 0) return;

    addWorkoutLog({
      activity_id: selectedActivity.id,
      activity_name_en: selectedActivity.name_en,
      activity_name_ar: selectedActivity.name_ar,
      met_value: selectedActivity.met,
      duration_minutes: mins,
      logged_date: todayStr,
    });

    setIsWorkoutModalOpen(false);
    setDuration('30');
  };

  const formatCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    return new Date().toLocaleDateString(locale, options);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? '#101412' : '#F8F9F8' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View className={`flex-row justify-between items-center mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <View className={`flex-1 ${isRtl ? 'items-end' : 'items-start'}`}>
            <Text className="text-xs text-text-muted font-inter-medium mb-1">
              {formatCurrentDate()}
            </Text>
            <Text className="text-2xl font-outfit-bold text-text-primary">
              {t.greeting} {profile?.name || 'Guest'}
            </Text>
            <Text className="text-xs text-text-muted font-inter-regular mt-1">
              {t.subtitle}
            </Text>
          </View>

        </View>

        {/* Daily vs. Weekly Toggle Segment */}
        <View className="flex-row bg-[#EAECEB] dark:bg-border-muted p-1 rounded-2xl mb-5">
          <PresstoButton 
            onPress={() => setViewMode('daily')}
            className="flex-1 py-2 rounded-xl items-center"
            style={viewMode === 'daily' ? [styles.activeTab, { backgroundColor: isDark ? '#161B18' : '#FFFFFF' }] : null}
          >
            <Text className={`text-xs font-outfit-medium ${viewMode === 'daily' ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
              {t.daily}
            </Text>
          </PresstoButton>
          <PresstoButton 
            onPress={() => setViewMode('weekly')}
            className="flex-1 py-2 rounded-xl items-center"
            style={viewMode === 'weekly' ? [styles.activeTab, { backgroundColor: isDark ? '#161B18' : '#FFFFFF' }] : null}
          >
            <Text className={`text-xs font-outfit-medium ${viewMode === 'weekly' ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
              {t.weekly}
            </Text>
          </PresstoButton>
        </View>

        {/* Calorie & Macro Target Panel */}
        {viewMode === 'daily' ? (
          <View className={`bg-bg-card rounded-3xl border border-border-muted p-5 flex-row justify-between items-center mb-5 ${isRtl ? 'flex-row-reverse' : ''}`}>
            {/* Calorie Progress Ring */}
            <View className="items-center justify-center flex-1">
              <ProgressRing 
                percentage={targetCalories > 0 ? netCalories / targetCalories : 0} 
                size={110} 
                strokeWidth={11}
                color="#E58C73" 
              />
              <Text className="text-[14px] font-outfit-bold text-text-primary mt-2">
                {netCalories} / {targetCalories}
              </Text>
              <Text className="text-[10px] font-inter-bold text-text-muted">
                {t.calories} (kcal)
              </Text>
              {burnedCalories > 0 && (
                <Text className="text-[9px] font-inter-medium text-accent-sage mt-1">
                  (-{burnedCalories} {isRtl ? 'تمارين' : 'burned'})
                </Text>
              )}
            </View>

            {/* Macro Bars */}
            <View className={`flex-1 ${isRtl ? 'pr-4' : 'pl-4'}`}>
              {/* Protein */}
              <View className="mb-3">
                <View className={`flex-row justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <Text className="text-xs font-outfit-semibold text-[#7E9DB0]">{t.protein}</Text>
                  <Text className="text-xs font-inter-bold text-text-primary">{Math.round(eatenProtein)}g / {profile?.target_protein_g || 120}g</Text>
                </View>
                <View className="h-1.5 bg-[#F0F2F0] dark:bg-border-muted rounded-full mt-1 overflow-hidden">
                  <View 
                    className="h-full rounded-full bg-[#7E9DB0]" 
                    style={{ 
                      width: `${Math.min(100, (eatenProtein / (profile?.target_protein_g || 120)) * 100)}%` 
                    }} 
                  />
                </View>
              </View>

              {/* Carbs */}
              <View className="mb-3">
                <View className={`flex-row justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <Text className="text-xs font-outfit-semibold text-[#D3B177]">{t.carbs}</Text>
                  <Text className="text-xs font-inter-bold text-text-primary">{Math.round(eatenCarbs)}g / {profile?.target_carbs_g || 200}g</Text>
                </View>
                <View className="h-1.5 bg-[#F0F2F0] dark:bg-border-muted rounded-full mt-1 overflow-hidden">
                  <View 
                    className="h-full rounded-full bg-[#D3B177]" 
                    style={{ 
                      width: `${Math.min(100, (eatenCarbs / (profile?.target_carbs_g || 200)) * 100)}%` 
                    }} 
                  />
                </View>
              </View>

              {/* Fats */}
              <View className="mb-3">
                <View className={`flex-row justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <Text className="text-xs font-outfit-semibold text-[#9CA19E]">{t.fats}</Text>
                  <Text className="text-xs font-inter-bold text-text-primary">{Math.round(eatenFat)}g / {profile?.target_fat_g || 65}g</Text>
                </View>
                <View className="h-1.5 bg-[#F0F2F0] dark:bg-border-muted rounded-full mt-1 overflow-hidden">
                  <View 
                    className="h-full rounded-full bg-[#9CA19E]" 
                    style={{ 
                      width: `${Math.min(100, (eatenFat / (profile?.target_fat_g || 65)) * 100)}%` 
                    }} 
                  />
                </View>
              </View>
            </View>
          </View>
        ) : (
          /* Weekly Summary View */
          <View className="bg-bg-card rounded-3xl border border-border-muted p-5 mb-5">
            <Text className={`text-sm font-outfit-bold text-text-primary mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
              {t.weeklyAverages}
            </Text>
            
            {/* Weekly Calorie Average */}
            <View className={`flex-row items-center py-3 border-b border-border-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Ionicons name="flame-outline" size={20} color="#E58C73" />
              <View className={`flex-1 mx-3 ${isRtl ? 'items-end' : 'items-start'}`}>
                <Text className="text-xs font-outfit-semibold text-text-primary">{t.calories}</Text>
                <Text className="text-[11px] font-inter-medium text-text-muted mt-0.5">{weeklyAvgCalories} kcal / {isRtl ? 'يومي' : 'day'}</Text>
              </View>
            </View>

            {/* Weekly Water Average */}
            <View className={`flex-row items-center py-3 border-b border-border-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Ionicons name="water-outline" size={20} color="#7E9DB0" />
              <View className={`flex-1 mx-3 ${isRtl ? 'items-end' : 'items-start'}`}>
                <Text className="text-xs font-outfit-semibold text-text-primary">{t.waterIntake}</Text>
                <Text className="text-[11px] font-inter-medium text-text-muted mt-0.5">{weeklyAvgWater} ml / {isRtl ? 'يومي' : 'day'}</Text>
              </View>
            </View>

            {/* Weekly Workouts Average */}
            <View className={`flex-row items-center py-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Ionicons name="fitness-outline" size={20} color={isDark ? '#5C856C' : '#4C6E58'} />
              <View className={`flex-1 mx-3 ${isRtl ? 'items-end' : 'items-start'}`}>
                <Text className="text-xs font-outfit-semibold text-text-primary">{t.workouts}</Text>
                <Text className="text-[11px] font-inter-medium text-text-muted mt-0.5">{weeklyAvgBurned} kcal / {isRtl ? 'يومي' : 'day'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Micro-Nutrients Breakdown Navigation Button */}
        <PresstoButton
          onPress={() => router.push('/diary')}
          className="bg-accent-mint py-3.5 px-4 rounded-2xl border border-border-muted mb-6"
        >
          <View className={`flex-row justify-between items-center w-full ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Text className="text-xs font-outfit-bold text-accent-sage">
              {t.detailLink}
            </Text>
            <Ionicons name={isRtl ? 'chevron-back' : 'chevron-forward'} size={16} color={isDark ? '#5C856C' : '#4C6E58'} />
          </View>
        </PresstoButton>

        {/* Meal Logs Bento Grid */}
        <View className="flex-row flex-wrap justify-between mb-4">
          {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((mealType) => {
            const logs = getLogsByMealType(mealType);
            const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0);

            return (
              <View key={mealType} className="w-[48%] bg-bg-card rounded-3xl border border-border-muted p-4 h-[145] mb-4 justify-between">
                <View className={`flex-row justify-between items-center mb-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <Text className="font-outfit-bold text-text-primary text-[13px]">
                    {t[mealType]}
                  </Text>
                  {totalCalories > 0 && (
                    <Text className="text-[10px] font-inter-bold text-nutrient-calories">
                      {Math.round(totalCalories)}
                    </Text>
                  )}
                </View>

                {logs.length > 0 ? (
                  <View className="flex-1 justify-between">
                    <ScrollView showsVerticalScrollIndicator={false} className="max-h-[60px] mb-1">
                      {logs.map((log) => (
                        <Text key={log.id} numberOfLines={1} className={`text-[10px] text-text-muted font-inter-regular mb-0.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                          • {isRtl ? log.name_ar : log.name_en}
                        </Text>
                      ))}
                    </ScrollView>
                    <TouchableOpacity 
                      onPress={() => router.push(`/food/search?meal_type=${mealType}`)}
                      className="mt-auto pt-1"
                      style={{ alignSelf: isRtl ? 'flex-start' : 'flex-end' }}
                    >
                      <Ionicons name="add-circle" size={20} color={isDark ? '#5C856C' : '#4C6E58'} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="flex-1 justify-between">
                    <Text className={`text-[10px] text-nutrient-calories font-inter-medium mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t.notLogged}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => router.push(`/food/search?meal_type=${mealType}`)}
                      className="bg-accent-mint py-2 rounded-xl items-center justify-center mt-auto"
                    >
                      <Text className="text-[10px] text-accent-sage font-outfit-bold">
                        {t.addLog}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Water Intake Dashboard Panel */}
        <View className={`bg-bg-card rounded-3xl border border-border-muted p-5 flex-row justify-between items-center mt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <View className={`flex-1 ${isRtl ? 'items-end' : 'items-start'}`}>
            <Text className="font-outfit-bold text-text-primary text-base mb-1">
              {t.waterIntake}
            </Text>
            <Text className="text-2xl font-outfit-bold text-accent-sage mb-4">
              {totalWater} / {profile?.target_water_ml || 2500} ml
            </Text>
            
            {/* Quick Add Buttons */}
            <View className={`flex-row mt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <PresstoButton 
                onPress={() => handleQuickWaterAdd(250)}
                className="bg-accent-mint px-3 py-2 rounded-xl mr-2"
                style={isRtl ? { marginLeft: 8, marginRight: 0 } : { marginRight: 8 }}
              >
                <Text className="text-accent-sage text-[11px] font-outfit-bold">+250ml</Text>
              </PresstoButton>
              
              <PresstoButton 
                onPress={() => handleQuickWaterAdd(500)}
                className="bg-accent-mint px-3 py-2 rounded-xl"
              >
                <Text className="text-accent-sage text-[11px] font-outfit-bold">+500ml</Text>
              </PresstoButton>
            </View>
          </View>

          {/* Animated Water Bottle */}
          <WaterBottle actualMl={totalWater} targetMl={profile?.target_water_ml || 2500} />
        </View>

        {/* Active Workouts Panel */}
        <View className="bg-bg-card rounded-3xl border border-border-muted p-5 mt-5">
          <View className={`flex-row justify-between items-center mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <View className={isRtl ? 'items-end' : 'items-start'}>
              <Text className="font-outfit-bold text-text-primary text-base">
                {t.workouts}
              </Text>
              <Text className="text-[11px] font-inter-semibold text-text-muted mt-1">
                {burnedCalories} {t.burned}
              </Text>
            </View>

            <PresstoButton 
              onPress={() => setIsWorkoutModalOpen(true)}
              className="bg-accent-mint px-3 py-2 rounded-xl"
            >
              <Text className="text-accent-sage text-[11px] font-outfit-bold">{t.logWorkout}</Text>
            </PresstoButton>
          </View>

          {/* Workouts List */}
          {todayWorkoutLogs.length > 0 ? (
            <View>
              {todayWorkoutLogs.map((log) => (
                <View key={log.id} className={`flex-row justify-between items-center border-b border-border-muted py-2.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <View className={`flex-1 ${isRtl ? 'items-end' : 'items-start'}`}>
                    <Text className="text-xs font-outfit-bold text-text-primary">
                      {isRtl ? log.activity_name_ar : log.activity_name_en}
                    </Text>
                    <Text className="text-[10px] font-inter-regular text-text-muted mt-0.5">
                      {log.duration_minutes} {isRtl ? 'دقيقة' : 'minutes'}
                    </Text>
                  </View>
                  <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <Text className={`text-xs font-inter-bold text-accent-sage ${isRtl ? 'ml-3' : 'mr-3'}`}>
                      -{log.calories_burned} kcal
                    </Text>
                    <TouchableOpacity onPress={() => deleteWorkoutLog(log.id)}>
                      <Ionicons name="trash-outline" size={16} color="#E58C73" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="items-center py-4">
              <Text className="text-xs text-text-muted font-inter-regular">
                {isRtl ? 'لم تسجل أي تمارين اليوم.' : 'No workouts logged today.'}
              </Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Workout Selector Modal */}
      <Modal
        visible={isWorkoutModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsWorkoutModalOpen(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(26, 30, 28, 0.45)' }}>
          <TouchableOpacity 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            activeOpacity={1} 
            onPress={() => setIsWorkoutModalOpen(false)} 
          />
          <View className="bg-bg-base rounded-t-[32] px-6 pt-4 border border-border-muted" style={{ paddingBottom: Platform.OS === 'ios' ? 44 : 24 }}>
            <Text className="text-lg font-outfit-bold text-text-primary text-center mb-3">{t.selectActivity}</Text>
            
            {/* Scrollable list of standard activities */}
            <View className="max-h-52 my-3">
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                {activities.map((act) => (
                  <TouchableOpacity
                    key={act.id}
                    onPress={() => setSelectedActivity(act)}
                    className={`flex-row justify-between items-center py-3 px-3 border-b border-border-muted ${
                      selectedActivity.id === act.id ? 'bg-accent-mint rounded-xl' : ''
                    } ${isRtl ? 'flex-row-reverse' : ''}`}
                  >
                    <Text className={`text-xs font-inter-medium ${
                      selectedActivity.id === act.id ? 'text-text-primary font-outfit-bold' : 'text-text-muted'
                    }`}>
                      {isRtl ? act.name_ar : act.name_en}
                    </Text>
                    {selectedActivity.id === act.id && (
                      <Ionicons name="checkmark" size={18} color="#4C6E58" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Duration Input */}
            <View className="mb-5">
              <Text className={`text-xs font-outfit-semibold text-text-primary mb-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>{t.workoutDuration}</Text>
              <TextInput
                className={`bg-bg-card border border-border-muted rounded-xl px-3 py-2 font-inter-regular text-sm text-text-primary ${
                  isRtl ? 'text-right' : 'text-left'
                }`}
                style={{ paddingVertical: Platform.OS === 'ios' ? 12 : 8 }}
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
              />
            </View>

            {/* Modal Actions */}
            <View className={`flex-row justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
              <TouchableOpacity
                onPress={() => setIsWorkoutModalOpen(false)}
                className="flex-1 py-3 bg-[#EAECEB] dark:bg-border-muted rounded-xl items-center justify-center mr-3"
                style={{ marginRight: isRtl ? 0 : 12, marginLeft: isRtl ? 12 : 0 }}
              >
                <Text className="text-text-muted text-xs font-outfit-bold">{t.cancel}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleWorkoutSubmit}
                className="flex-1 py-3 bg-accent-sage rounded-xl items-center justify-center"
              >
                <Text className="text-white text-xs font-outfit-bold">{t.save}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1,
    elevation: 1,
  },
});
