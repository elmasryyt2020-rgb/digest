import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { supabase } from '@/lib/supabase';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, interpolateColor, Easing } from 'react-native-reanimated';
import { useDiaryStore } from '@/store/useDiaryStore';
import { useAuthStore } from '@/store/useAuthStore';
import { PresstoButton } from '@/components/PresstoButton';
import { faqCategories } from '@/data/faqData';
import { privacySections } from '@/data/privacyData';
import { termsSections } from '@/data/termsData';
import {
  requestNotificationPermission,
  scheduleMealReminders,
  cancelMealReminders,
  scheduleWaterReminders,
  cancelWaterReminders,
  scheduleWorkoutReminders,
  cancelWorkoutReminders,
  isNotificationsSupported,
} from '@/lib/notifications';


// Helper conversions for Ft/In and Cm
const cmToFtIn = (cm: number) => {
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { ft: ft || 5, in: inches || 0 };
};

const ftInToCm = (ft: number, inches: number) => {
  const totalInches = ft * 12 + inches;
  return Math.round(totalInches * 2.54 * 10) / 10;
};

// Reusable animated Segmented Control Component
interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  selectedValue: T;
  onChange: (val: T) => void;
  isRtl?: boolean;
}

function SegmentedControl<T extends string>({ options, selectedValue, onChange, isRtl }: SegmentedControlProps<T>) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [containerWidth, setContainerWidth] = useState(0);
  const padding = 4;
  const innerWidth = containerWidth > 0 ? containerWidth - padding * 2 : 0;
  const itemWidth = innerWidth / options.length;

  const orderedOptions = isRtl ? [...options].reverse() : options;
  const activeIndex = orderedOptions.findIndex(o => o.value === selectedValue);
  const translateX = useSharedValue(0);
  const isFirstLayout = useSharedValue(true);

  if (containerWidth > 0 && activeIndex !== -1) {
    const targetX = activeIndex * itemWidth;
    if (isFirstLayout.value) {
      translateX.value = targetX;
      isFirstLayout.value = false;
    } else {
      translateX.value = withTiming(targetX, {
        duration: 200,
        easing: Easing.out(Easing.quad),
      });
    }
  }

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      width: itemWidth,
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      className="flex-row bg-[#F0F2F0] dark:bg-border-muted p-1 rounded-xl relative h-11 items-center"
    >
      {containerWidth > 0 && activeIndex !== -1 && (
        <Animated.View
          style={[
            indicatorStyle,
            {
              position: 'absolute',
              top: padding,
              bottom: padding,
              left: padding,
              backgroundColor: isDark ? '#161B18' : '#FFFFFF',
              borderRadius: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.12,
              shadowRadius: 1.5,
              elevation: 2,
            },
          ]}
        />
      )}
      {orderedOptions.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => onChange(opt.value)}
          className="flex-1 items-center justify-center h-full z-10"
          activeOpacity={0.7}
        >
          <Text
            className={`text-[11px] font-outfit-medium ${
              selectedValue === opt.value
                ? 'text-text-primary font-outfit-bold'
                : 'text-text-muted'
            }`}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Reusable animated Switch Toggle Component
interface AnimatedSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
}

function AnimatedSwitch({ value, onValueChange }: AnimatedSwitchProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const translateX = useSharedValue(value ? 18 : 2);

  translateX.value = withTiming(value ? 18 : 2, {
    duration: 200,
    easing: Easing.out(Easing.quad),
  });

  const trackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      translateX.value,
      [2, 18],
      isDark ? ['#1A2420', '#5C856C'] : ['#EAECEB', '#4C6E58']
    );
    return { backgroundColor };
  });

  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      className="w-10 h-6 rounded-full relative justify-center"
      style={{ overflow: 'hidden' }}
    >
      <Animated.View style={[trackStyle, StyleSheet.absoluteFill]} />
      <Animated.View
        style={[
          thumbStyle,
          {
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: isDark ? '#161B18' : '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 1,
            elevation: 2,
          },
        ]}
      />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  // Zustand State
  const profile = useDiaryStore((state) => state.profile);
  const setProfile = useDiaryStore((state) => state.setProfile);
  const triggerSignUp = useDiaryStore((state) => state.triggerSignUp);

  const user = useAuthStore((state) => state.user);
  const isSignedIn = useAuthStore((state) => state.isSignedIn);
  const signOut = useAuthStore((state) => state.signOut);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);

  // Local UI states
  const [exporting, setExporting] = useState(false);
  const [exportSuccessUrl, setExportSuccessUrl] = useState<string | null>(null);
  const [showBiometrics, setShowBiometrics] = useState(true);
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const [newIngredient, setNewIngredient] = useState('');

  // Additional settings UI states
  const [showMacroModal, setShowMacroModal] = useState(false);
  const [macroPreset, setMacroPreset] = useState<'balanced' | 'high_protein' | 'keto' | 'custom'>('balanced');
  const [macroCarbs, setMacroCarbs] = useState(40);
  const [macroProtein, setMacroProtein] = useState(30);
  const [macroFat, setMacroFat] = useState(30);

  const [showFaqModal, setShowFaqModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);


  // FAQ States
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [expandedFaqCategory, setExpandedFaqCategory] = useState<number | null>(null);
  const [expandedFaqQuestion, setExpandedFaqQuestion] = useState<string | null>(null);

  // Reset FAQ states when modal closes or opens
  useEffect(() => {
    if (!showFaqModal) {
      setFaqSearchQuery('');
      setExpandedFaqCategory(null);
      setExpandedFaqQuestion(null);
    }
  }, [showFaqModal]);

  // Local Biometrics Form Texts to avoid roundtrip truncation
  const [weightText, setWeightText] = useState('');
  const [goalWeightText, setGoalWeightText] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [ageText, setAgeText] = useState('');

  const language = profile?.language || 'ar';
  const isRtl = language === 'ar';

  const t = {
    title: isRtl ? 'الملف الشخصي' : 'Profile Settings',
    personalStats: isRtl ? 'المقاييس الحيوية' : 'Biometrics',
    gender: isRtl ? 'الجنس' : 'Gender',
    male: isRtl ? 'ذكر' : 'Male',
    female: isRtl ? 'أنثى' : 'Female',
    age: isRtl ? 'العمر (بالسنوات)' : 'Age (years)',
    weight: isRtl ? 'الوزن' : 'Weight',
    height: isRtl ? 'الطول' : 'Height',
    activity: isRtl ? 'مستوى النشاط' : 'Activity Level',
    goal: isRtl ? 'الهدف الصحي' : 'Health Goal',
    appSettings: isRtl ? 'إعدادات التطبيق' : 'App Settings',
    langOpt: isRtl ? 'لغة التطبيق' : 'Language',
    countryOpt: isRtl ? 'الدولة ذات الأولوية' : 'Country Priority',
    targetSummary: isRtl ? 'أهدافك الغذائية الحالية' : 'Calculated Nutrient Targets',
    calories: isRtl ? 'السعرات الحرارية' : 'Calories',
    protein: isRtl ? 'البروتين اليومي' : 'Daily Protein',
    carbs: isRtl ? 'الكربوهيدرات اليومية' : 'Daily Carbs',
    fats: isRtl ? 'الدهون اليومية' : 'Daily Fats',
    water: isRtl ? 'الماء اليومي' : 'Daily Water',
    pdfTitle: isRtl ? 'التقرير الصحي الأسبوعي' : 'Weekly Health Summary',
    pdfDesc: isRtl ? 'تصدير ملف PDF يحتوي على مخططات المغذيات الدقيقة وقائمة التسوق.' : 'Export a PDF report containing micronutrient charts and shopping list.',
    pdfBtn: isRtl ? 'تصدير تقرير PDF' : 'Export PDF Report',
    pdfGenerating: isRtl ? 'جارٍ إعداد ملف PDF...' : 'Generating PDF...',
    pdfSuccess: isRtl ? 'تم إنشاء التقرير بنجاح!' : 'Report generated successfully!',
    pdfDownload: isRtl ? 'تحميل تقرير PDF' : 'Download PDF',
    account: isRtl ? 'الحساب' : 'Account Status',
    trialMode: isRtl ? 'حساب ضيف' : 'Guest Account',
    trialMsg: isRtl ? 'يرجى تسجيل الدخول أو إنشاء حساب لحفظ بياناتك.' : 'Please sign in or register to back up your data.',
    registerBtn: isRtl ? 'إنشاء حساب / تسجيل الدخول' : 'Sign Up / Sign In',
    signOutBtn: isRtl ? 'تسجيل الخروج' : 'Sign Out',
    activeUser: isRtl ? 'حساب نشط' : 'Active Account',

    // New keys
    goalWeight: isRtl ? 'الوزن المستهدف' : 'Goal Weight',
    adjustMacros: isRtl ? 'تعديل نسب المغذيات الكبرى' : 'Adjust Macro Ratios',
    macroPresets: isRtl ? 'نسب المغذيات المقترحة' : 'Macro Presets',
    balanced: isRtl ? 'متوازن' : 'Balanced',
    highProtein: isRtl ? 'عالي البروتين' : 'High Protein',
    keto: isRtl ? 'كيتو' : 'Keto',
    custom: isRtl ? 'مخصص' : 'Custom',
    carbsPercent: isRtl ? 'نسبة الكربوهيدرات' : 'Carbs Ratio',
    proteinPercent: isRtl ? 'نسبة البروتين' : 'Protein Ratio',
    fatsPercent: isRtl ? 'نسبة الدهون' : 'Fats Ratio',
    save: isRtl ? 'حفظ' : 'Save',
    macroValidationErr: isRtl ? 'يجب أن يكون مجموع النسب ١٠٠٪ تماماً.' : 'Percentages must sum to exactly 100%.',
    unitPref: isRtl ? 'تفضيلات الوحدات' : 'Measurement Units',
    weightUnit: isRtl ? 'وحدة الوزن' : 'Weight Unit',
    heightUnit: isRtl ? 'وحدة الطول' : 'Height Unit',
    waterUnit: isRtl ? 'وحدة الماء' : 'Water Unit',
    reminders: isRtl ? 'التذكيرات والإشعارات' : 'Reminders & Notifications',
    mealReminders: isRtl ? 'تذكيرات الوجبات اليومية' : 'Daily Meal Reminders',
    waterReminders: isRtl ? 'تذكير شرب الماء' : 'Hydration Reminders',
    workoutReminders: isRtl ? 'تذكير التمارين والأنشطة' : 'Activity Reminders',
    helpFAQ: isRtl ? 'المساعدة والأسئلة الشائعة' : 'Help & FAQ',
    privacyPolicy: isRtl ? 'سياسة الخصوصية' : 'Privacy Policy',
    termsOfService: isRtl ? 'شروط الخدمة' : 'Terms of Service',
    dangerZone: isRtl ? 'منطقة الخطر وإدارة الحساب' : 'Danger Zone & Account Management',
    clearCache: isRtl ? 'مسح الذاكرة المؤقتة' : 'Clear Local Cache',
    deleteAccount: isRtl ? 'حذف الحساب نهائياً' : 'Delete Account Permanently',
    confirmClearCacheTitle: isRtl ? 'مسح الذاكرة المؤقتة' : 'Clear Local Cache',
    confirmClearCacheMsg: isRtl ? 'هل أنت متأكد من مسح الذاكرة المؤقتة؟ سيتم حذف جميع السجلات والبيانات المحفوظة محلياً.' : 'Are you sure you want to clear local cache? This will delete all your offline logs and data.',
    confirmDeleteAccountTitle: isRtl ? 'حذف الحساب نهائياً' : 'Delete Account Permanently',
    confirmDeleteAccountMsg: isRtl ? 'هل أنت متأكد من حذف حسابك بشكل نهائي؟ هذا الإجراء لا يمكن التراجع عنه وسيتم محو تاريخك بالكامل.' : 'Are you sure you want to delete your account permanently? This action cannot be undone and will erase all your history.',
    deleteBtn: isRtl ? 'حذف الحساب' : 'Delete Account',
    cancel: isRtl ? 'إلغاء' : 'Cancel',
    appTheme: isRtl ? 'مظهر التطبيق' : 'App Theme',
    light: isRtl ? 'فاتح' : 'Light',
    dark: isRtl ? 'داكن' : 'Dark',
    system: isRtl ? 'تلقائي (النظام)' : 'System Default',
    feet: isRtl ? 'قدم' : 'ft',
    inches: isRtl ? 'بوصة' : 'in',
  };

  // Sync profile data to local inputs
  useEffect(() => {
    if (profile) {
      setAgeText(profile.age?.toString() || '');
      
      // Weight (convert for display if preferred unit is lbs)
      if (profile.unit_weight === 'lbs') {
        const lbs = Math.round(profile.weight_kg * 2.20462);
        setWeightText(lbs.toString());
      } else {
        setWeightText(profile.weight_kg?.toString() || '');
      }

      // Goal Weight (convert for display if preferred unit is lbs)
      const goalW = profile.goal_weight_kg ?? 70;
      if (profile.unit_weight === 'lbs') {
        const lbs = Math.round(goalW * 2.20462);
        setGoalWeightText(lbs.toString());
      } else {
        setGoalWeightText(goalW.toString());
      }

      // Height
      setHeightCm(profile.height_cm?.toString() || '');
      const { ft, in: inches } = cmToFtIn(profile.height_cm || 178);
      setHeightFt(ft.toString());
      setHeightIn(inches.toString());
    }
  }, [profile?.weight_kg, profile?.height_cm, profile?.age, profile?.goal_weight_kg, profile?.unit_weight, profile?.unit_height]);

  const handleStatChange = async (field: string, value: any) => {
    setProfile({ [field]: value });

    // If language changed, reschedule active notifications
    if (field === 'language') {
      const newLang = value as 'ar' | 'en';
      if (profile?.reminder_meals) {
        try { await scheduleMealReminders(newLang); } catch (_) {}
      }
      if (profile?.reminder_water) {
        try { await scheduleWaterReminders(newLang); } catch (_) {}
      }
      if (profile?.reminder_workout) {
        try { await scheduleWorkoutReminders(newLang); } catch (_) {}
      }
    }
  };

  const handleReminderToggle = async (type: 'meals' | 'water' | 'workout', enabled: boolean) => {
    if (enabled) {
      if (!isNotificationsSupported) {
        Alert.alert(
          isRtl ? 'الإشعارات غير مدعومة' : 'Notifications Unsupported',
          isRtl
            ? 'ميزات الإشعارات غير مدعومة في بيئة Expo Go الحالية على أندرويد. يرجى استخدام Development Build لتشغيلها.'
            : 'Notification features are not supported in the current Expo Go environment on Android. Please use a Development Build instead.'
        );
        return;
      }

      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        Alert.alert(
          isRtl ? 'تم رفض إذن الإشعارات' : 'Notification Permission Denied',
          isRtl
            ? 'يرجى تمكين إذن الإشعارات من إعدادات جهازك لتلقي التنبيهات.'
            : 'Please enable notification permissions in your device settings to receive reminders.'
        );
        return;
      }

      // Schedule reminders
      try {
        if (type === 'meals') {
          await scheduleMealReminders(language);
        } else if (type === 'water') {
          await scheduleWaterReminders(language);
        } else if (type === 'workout') {
          await scheduleWorkoutReminders(language);
        }
      } catch (err) {
        console.error(`Error scheduling ${type} reminders:`, err);
        Alert.alert(
          isRtl ? 'خطأ' : 'Error',
          isRtl ? 'فشل في إعداد التذكيرات. يرجى المحاولة مرة أخرى.' : 'Failed to set up reminders. Please try again.'
        );
        return;
      }
    } else {
      // Cancel reminders
      try {
        if (type === 'meals') {
          await cancelMealReminders();
        } else if (type === 'water') {
          await cancelWaterReminders();
        } else if (type === 'workout') {
          await cancelWorkoutReminders();
        }
      } catch (err) {
        console.error(`Error canceling ${type} reminders:`, err);
      }
    }

    // Persist change
    handleStatChange(`reminder_${type}`, enabled);
  };

  const [reportFileName, setReportFileName] = useState<string | null>(null);

  const handleExportPDF = async () => {
    if (!isSignedIn) {
      triggerSignUp();
      return;
    }

    setExporting(true);
    setExportSuccessUrl(null);
    setReportFileName(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-pdf-report', {
        body: {},
      });

      if (error || !data || !data.url) {
        throw new Error(error?.message || 'Failed to generate report PDF');
      }

      setExportSuccessUrl(data.url);
      setReportFileName(data.fileName);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      Alert.alert(
        isRtl ? 'خطأ' : 'Error',
        isRtl ? 'فشل إنشاء تقرير PDF. يرجى المحاولة مرة أخرى.' : 'Failed to generate PDF report. Please try again.'
      );
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadAndSharePDF = async () => {
    if (!exportSuccessUrl || !reportFileName) return;

    try {
      const localUri = `${FileSystem.cacheDirectory}${reportFileName}`;
      
      // Download signed PDF locally
      const downloadResult = await FileSystem.downloadAsync(exportSuccessUrl, localUri);
      
      if (downloadResult.status !== 200) {
        throw new Error('PDF download failed');
      }

      // Check if sharing is available and share
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: isRtl ? 'تحميل التقرير الصحي' : 'Download Health Summary',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert(
          isRtl ? 'مشاركة غير مدعومة' : 'Sharing not available',
          isRtl ? 'لا يدعم هذا الجهاز مشاركة الملفات.' : 'This device does not support file sharing.'
        );
      }

      // Proactively clean up file on storage server immediately
      await supabase.functions.invoke('generate-pdf-report', {
        body: { action: 'delete', fileName: reportFileName },
      });

      // Clear state
      setExportSuccessUrl(null);
      setReportFileName(null);
      
      Alert.alert(
        isRtl ? 'تم بنجاح' : 'Success',
        isRtl ? 'تم تحميل ومشاركة التقرير الصحي بنجاح.' : 'Health report shared and downloaded successfully.'
      );
    } catch (error: any) {
      console.error('Download/Share PDF error:', error);
      Alert.alert(
        isRtl ? 'خطأ' : 'Error',
        isRtl ? 'فشل تحميل الملف. يرجى المحاولة لاحقاً.' : 'Failed to retrieve the file. Please try again.'
      );
    }
  };

  const getGoalText = () => {
    const goal = profile?.health_goal || 'lose_weight';
    if (isRtl) {
      if (goal === 'lose_weight') return 'إنقاص الوزن';
      if (goal === 'maintain_weight') return 'المحافظة على الوزن';
      return 'زيادة الوزن';
    } else {
      if (goal === 'lose_weight') return 'Lose Weight';
      if (goal === 'maintain_weight') return 'Maintain Weight';
      return 'Gain Weight';
    }
  };

  const getWeightText = () => {
    const goalWeight = profile?.goal_weight_kg || 70;
    if (profile?.unit_weight === 'lbs') {
      return `${Math.round(goalWeight * 2.20462)} lbs`;
    }
    return `${goalWeight} kg`;
  };

  // Filter FAQs based on search query
  const getFilteredFAQs = () => {
    if (!faqSearchQuery.trim()) return null;
    const query = faqSearchQuery.toLowerCase().trim();
    const results: { categoryName: string; item: any; id: string }[] = [];
    
    faqCategories.forEach((cat, catIdx) => {
      cat.items.forEach((item, itemIdx) => {
        const qText = (isRtl ? item.q_ar : item.q_en).toLowerCase();
        const aText = (isRtl ? item.a_ar : item.a_en).toLowerCase();
        if (qText.includes(query) || aText.includes(query)) {
          results.push({
            categoryName: isRtl ? cat.category_ar : cat.category_en,
            item,
            id: `${catIdx}-${itemIdx}`
          });
        }
      });
    });
    return results;
  };

  const filteredFaqs = getFilteredFAQs();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#101412' : '#F8F9F8' }}>
      {/* Header */}
      <View className={`flex-row justify-between items-center px-5 py-4 bg-bg-card border-b border-border-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
        <View className="w-10" />
        <Text className="text-base font-outfit-bold text-text-primary">{t.title}</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* User Profile Header Card */}
        <View className="bg-bg-card rounded-3xl border border-border-muted p-5 mb-5 shadow-sm items-center">
          <View className="w-16 h-16 rounded-full bg-accent-sage/10 items-center justify-center border border-accent-sage/20 mb-3">
            {isSignedIn && user ? (
              <Text className="text-xl font-outfit-bold text-accent-sage">
                {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
              </Text>
            ) : (
              <Ionicons name="person-outline" size={28} color={isDark ? '#5C856C' : '#4C6E58'} />
            )}
          </View>
          
          <Text className="text-lg font-outfit-bold text-text-primary text-center">
            {isSignedIn && user ? user.name : (isRtl ? 'زائر' : 'Guest')}
          </Text>
          <Text className="text-xs font-inter-medium text-text-muted mt-1 text-center">
            {isSignedIn && user ? user.email : (isRtl ? 'سجل لحفظ بياناتك سحابياً' : 'Sign up to backup logs')}
          </Text>



          {/* Goal Caption Summary */}
          <Text className="text-xs font-inter-regular text-text-muted mt-4 bg-bg-base px-4 py-2 rounded-xl text-center overflow-hidden">
            {isRtl 
              ? `الهدف: ${getGoalText()}  ·  الوزن المستهدف: ${getWeightText()}`
              : `Goal: ${getGoalText()}  ·  Target Weight: ${getWeightText()}`
            }
          </Text>

          {!isSignedIn && (
            <PresstoButton
              onPress={triggerSignUp}
              className="bg-accent-sage rounded-xl py-2.5 w-full items-center mt-4"
            >
              <Text className="text-white text-xs font-outfit-bold">{t.registerBtn}</Text>
            </PresstoButton>
          )}
        </View>

        {/* PDF Export Panel - Styled in Mint/Sage Green System */}
        <View className="bg-accent-mint rounded-3xl border border-[#C3D9B6] p-6 mb-5 shadow-sm">
          <Text className={`text-sm font-outfit-bold text-accent-sage mb-2.5 ${isRtl ? 'text-right' : 'text-left'}`}>
            {t.pdfTitle}
          </Text>
          <Text className={`text-xs font-inter-regular text-text-muted leading-relaxed mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
            {t.pdfDesc}
          </Text>
          
          {exporting ? (
            <View className="flex-row justify-center items-center py-2">
              <ActivityIndicator size="small" color={isDark ? '#5C856C' : '#4C6E58'} style={{ marginRight: 8 }} />
              <Text className="color-accent-sage text-xs font-outfit-bold">{t.pdfGenerating}</Text>
            </View>
          ) : exportSuccessUrl ? (
            <View className="mt-2">
              <Text className={`color-accent-sage text-xs font-outfit-bold mb-3 ${isRtl ? 'text-right' : 'text-left'}`}>✓ {t.pdfSuccess}</Text>
              <TouchableOpacity 
                onPress={handleDownloadAndSharePDF}
                className="bg-accent-sage rounded-xl py-3 flex-row items-center justify-center"
              >
                <Ionicons name="cloud-download-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text className="text-white text-xs font-outfit-bold">{t.pdfDownload}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <PresstoButton 
              onPress={handleExportPDF} 
              className="bg-accent-sage rounded-xl py-3"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="document-text-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text className="text-white text-xs font-outfit-bold">{t.pdfBtn}</Text>
              </View>
            </PresstoButton>
          )}
        </View>

        {/* Section 2: Dynamic Targets Summary Table */}
        <View className="bg-bg-card rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
          <Text className={`text-sm font-outfit-bold text-text-primary mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t.targetSummary}</Text>
          <View className="gap-y-3">
            <View className={`flex-row justify-between py-2 border-b border-[#F0F2F0] dark:border-border-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Text className="text-xs font-outfit-semibold text-text-muted">{t.calories}</Text>
              <Text className="text-xs font-inter-bold text-text-primary">{profile?.target_calories || 2000} kcal</Text>
            </View>
            <View className={`flex-row justify-between py-2 border-b border-[#F0F2F0] dark:border-border-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Text className="text-xs font-outfit-semibold text-text-muted">{t.protein}</Text>
              <Text className="text-xs font-inter-bold text-text-primary">{profile?.target_protein_g || 120} g</Text>
            </View>
            <View className={`flex-row justify-between py-2 border-b border-[#F0F2F0] dark:border-border-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Text className="text-xs font-outfit-semibold text-text-muted">{t.carbs}</Text>
              <Text className="text-xs font-inter-bold text-text-primary">{profile?.target_carbs_g || 200} g</Text>
            </View>
            <View className={`flex-row justify-between py-2 border-b border-[#F0F2F0] dark:border-border-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Text className="text-xs font-outfit-semibold text-text-muted">{t.fats}</Text>
              <Text className="text-xs font-inter-bold text-text-primary">{profile?.target_fat_g || 65} g</Text>
            </View>
            <View className={`flex-row justify-between py-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Text className="text-xs font-outfit-semibold text-text-muted">{t.water}</Text>
              <Text className="text-xs font-inter-bold text-text-primary">
                {profile?.unit_water === 'fl_oz'
                  ? `${Math.round((profile?.target_water_ml || 2500) * 0.033814)} fl oz`
                  : `${profile?.target_water_ml || 2500} ml`
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Section 3: Biometrics Settings (Collapsible) */}
        <View className={`bg-bg-card rounded-3xl border border-border-muted mb-5 shadow-sm ${showBiometrics ? 'p-5' : 'p-4'}`}>
          <TouchableOpacity
            onPress={() => setShowBiometrics(!showBiometrics)}
            className={`flex-row justify-between items-center ${showBiometrics ? 'mb-4' : ''} ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            <View className={`flex-row items-center flex-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Ionicons
                name="fitness-outline"
                size={20}
                color={isDark ? '#5C856C' : '#4C6E58'}
                style={isRtl ? { marginLeft: 10 } : { marginRight: 10 }}
              />
              <View className="flex-1">
                <Text className={`font-outfit-bold text-sm text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.personalStats}
                </Text>
                <Text className={`font-inter text-[10px] text-text-muted mt-0.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {isRtl
                    ? 'تعديل الجنس، العمر، الوزن، الطول، مستوى النشاط والهدف الصحي'
                    : 'Edit gender, age, weight, height, activity, and goals'
                  }
                </Text>
              </View>
            </View>
            <Ionicons name={showBiometrics ? "chevron-up" : "chevron-down"} size={20} color={isDark ? '#8A9690' : '#626A66'} />
          </TouchableOpacity>

          {showBiometrics && (
            <View className="gap-y-4">
              {/* Gender */}
              <View>
                <Text className={`text-xs font-outfit-semibold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t.gender}</Text>
                <SegmentedControl
                  options={[
                    { value: 'male', label: t.male },
                    { value: 'female', label: t.female }
                  ]}
                  selectedValue={profile?.gender || 'male'}
                  onChange={(val) => handleStatChange('gender', val)}
                  isRtl={isRtl}
                />
              </View>

              {/* Age */}
              <View>
                <Text className={`text-xs font-outfit-semibold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t.age}</Text>
                <TextInput
                  className={`bg-bg-card border border-border-muted rounded-xl px-3 py-2.5 font-inter-regular text-sm text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}
                  keyboardType="numeric"
                  value={ageText}
                  onChangeText={(text) => {
                    setAgeText(text);
                    handleStatChange('age', parseInt(text) || 0);
                  }}
                />
              </View>

              {/* Weight */}
              <View>
                <Text className={`text-xs font-outfit-semibold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {profile?.unit_weight === 'lbs' ? (isRtl ? 'الوزن (رطل)' : 'Weight (lbs)') : (isRtl ? 'الوزن (كجم)' : 'Weight (kg)')}
                </Text>
                <TextInput
                  className={`bg-bg-card border border-border-muted rounded-xl px-3 py-2.5 font-inter-regular text-sm text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}
                  keyboardType="numeric"
                  value={weightText}
                  onChangeText={(text) => {
                    setWeightText(text);
                    const val = parseFloat(text) || 0;
                    if (profile?.unit_weight === 'lbs') {
                      handleStatChange('weight_kg', Math.round((val / 2.20462) * 10) / 10);
                    } else {
                      handleStatChange('weight_kg', val);
                    }
                  }}
                />
              </View>

              {/* Goal Weight */}
              <View>
                <Text className={`text-xs font-outfit-semibold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {profile?.unit_weight === 'lbs' ? (isRtl ? 'الوزن المستهدف (رطل)' : 'Goal Weight (lbs)') : (isRtl ? 'الوزن المستهدف (كجم)' : 'Goal Weight (kg)')}
                </Text>
                <TextInput
                  className={`bg-bg-card border border-border-muted rounded-xl px-3 py-2.5 font-inter-regular text-sm text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}
                  keyboardType="numeric"
                  value={goalWeightText}
                  onChangeText={(text) => {
                    setGoalWeightText(text);
                    const val = parseFloat(text) || 0;
                    if (profile?.unit_weight === 'lbs') {
                      handleStatChange('goal_weight_kg', Math.round((val / 2.20462) * 10) / 10);
                    } else {
                      handleStatChange('goal_weight_kg', val);
                    }
                  }}
                />
              </View>

              {/* Height */}
              <View>
                <Text className={`text-xs font-outfit-semibold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {profile?.unit_height === 'ft_in' ? (isRtl ? 'الطول (قدم/بوصة)' : 'Height (ft/in)') : (isRtl ? 'الطول (سم)' : 'Height (cm)')}
                </Text>
                {profile?.unit_height === 'ft_in' ? (
                  <View className={`flex-row gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <View className="flex-1">
                      <TextInput
                        className="bg-bg-card border border-border-muted rounded-xl px-3 py-2.5 font-inter-regular text-sm text-text-primary text-center"
                        keyboardType="numeric"
                        value={heightFt}
                        placeholder={t.feet}
                        onChangeText={(text) => {
                          setHeightFt(text);
                          const ft = parseFloat(text) || 0;
                          const inch = parseFloat(heightIn) || 0;
                          const cm = ftInToCm(ft, inch);
                          handleStatChange('height_cm', cm);
                        }}
                      />
                      <Text className="text-[9px] text-text-muted text-center mt-1">{t.feet}</Text>
                    </View>
                    <View className="flex-1">
                      <TextInput
                        className="bg-bg-card border border-border-muted rounded-xl px-3 py-2.5 font-inter-regular text-sm text-text-primary text-center"
                        keyboardType="numeric"
                        value={heightIn}
                        placeholder={t.inches}
                        onChangeText={(text) => {
                          setHeightIn(text);
                          const ft = parseFloat(heightFt) || 0;
                          const inch = parseFloat(text) || 0;
                          const cm = ftInToCm(ft, inch);
                          handleStatChange('height_cm', cm);
                        }}
                      />
                      <Text className="text-[9px] text-text-muted text-center mt-1">{t.inches}</Text>
                    </View>
                  </View>
                ) : (
                  <TextInput
                    className={`bg-bg-card border border-border-muted rounded-xl px-3 py-2.5 font-inter-regular text-sm text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}
                    keyboardType="numeric"
                    value={heightCm}
                    onChangeText={(text) => {
                      setHeightCm(text);
                      handleStatChange('height_cm', parseFloat(text) || 0);
                    }}
                  />
                )}
              </View>

              {/* Activity Level */}
              <View>
                <Text className={`text-xs font-outfit-semibold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t.activity}</Text>
                <View className="gap-y-2">
                  {(['sedentary', 'lightly_active', 'moderately_active', 'very_active'] as const).map((level) => (
                    <TouchableOpacity
                      key={level}
                      onPress={() => handleStatChange('activity_level', level)}
                      className={`flex-row justify-between items-center p-3 border border-border-muted rounded-xl bg-bg-card ${
                        profile?.activity_level === level ? 'border-accent-sage bg-[#F3F6F3] dark:bg-[#1F2E25]' : ''
                      } ${isRtl ? 'flex-row-reverse' : ''}`}
                    >
                      <Text className={`text-xs font-inter-medium ${profile?.activity_level === level ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
                        {level === 'sedentary' && (isRtl ? 'قليل النشاط (مكتبي)' : 'Sedentary (desk job)')}
                        {level === 'lightly_active' && (isRtl ? 'نشاط خفيف (تمارين خفيفة)' : 'Lightly active')}
                        {level === 'moderately_active' && (isRtl ? 'نشط باعتدال (تمارين ٣-٥ أيام)' : 'Moderately active')}
                        {level === 'very_active' && (isRtl ? 'نشط جداً (تمارين يومية مكثفة)' : 'Very active')}
                      </Text>
                      {profile?.activity_level === level && (
                        <Ionicons name="checkmark" size={16} color={isDark ? '#5C856C' : '#4C6E58'} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Health Goal */}
              <View>
                <Text className={`text-xs font-outfit-semibold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t.goal}</Text>
                <View className="gap-y-2">
                  {(['lose_weight', 'maintain_weight', 'gain_weight'] as const).map((goal) => (
                    <TouchableOpacity
                      key={goal}
                      onPress={() => handleStatChange('health_goal', goal)}
                      className={`flex-row justify-between items-center p-3 border border-border-muted rounded-xl bg-bg-card ${
                        profile?.health_goal === goal ? 'border-accent-sage bg-[#F3F6F3] dark:bg-[#1F2E25]' : ''
                      } ${isRtl ? 'flex-row-reverse' : ''}`}
                    >
                      <Text className={`text-xs font-inter-medium ${profile?.health_goal === goal ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
                        {goal === 'lose_weight' && (isRtl ? 'إنقاص الوزن' : 'Lose Weight')}
                        {goal === 'maintain_weight' && (isRtl ? 'المحافظة على الوزن' : 'Maintain Weight')}
                        {goal === 'gain_weight' && (isRtl ? 'زيادة الوزن' : 'Gain Weight')}
                      </Text>
                      {profile?.health_goal === goal && (
                        <Ionicons name="checkmark" size={16} color={isDark ? '#5C856C' : '#4C6E58'} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Dietary Preferences Row */}
        <TouchableOpacity
          onPress={() => setShowDietaryModal(true)}
          className={`flex-row justify-between items-center p-4 border border-border-muted rounded-3xl bg-bg-card mb-5 shadow-sm ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          <View className={`flex-row items-center flex-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Ionicons name="nutrition-outline" size={20} color={isDark ? '#5C856C' : '#4C6E58'} style={isRtl ? { marginLeft: 10 } : { marginRight: 10 }} />
            <View className="flex-1">
              <Text className={`font-outfit-bold text-sm text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}>
                {isRtl ? 'التفضيلات الغذائية' : 'Dietary Preferences'}
              </Text>
              <Text className={`font-inter text-[10px] text-text-muted mt-0.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                {isRtl ? 'تعديل نوع الدايت، الأطعمة المستبعدة والمكونات المكروهة' : 'Edit diet type, exclusions, and disliked ingredients'}
              </Text>
            </View>
          </View>
          <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={20} color={isDark ? '#8A9690' : '#626A66'} />
        </TouchableOpacity>

        {/* Adjust Macro Ratios Button Row */}
        <TouchableOpacity
          onPress={() => {
            setMacroPreset(profile?.macro_preset || 'balanced');
            setMacroCarbs(profile?.macro_carbs_pct ?? 40);
            setMacroProtein(profile?.macro_protein_pct ?? 30);
            setMacroFat(profile?.macro_fat_pct ?? 30);
            setShowMacroModal(true);
          }}
          className={`flex-row justify-between items-center p-4 border border-border-muted rounded-3xl bg-bg-card mb-5 shadow-sm ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          <View className={`flex-row items-center flex-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Ionicons name="pie-chart-outline" size={20} color={isDark ? '#5C856C' : '#4C6E58'} style={isRtl ? { marginLeft: 10 } : { marginRight: 10 }} />
            <View className="flex-1">
              <Text className={`font-outfit-bold text-sm text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}>
                {t.adjustMacros}
              </Text>
              <Text className={`font-inter text-[10px] text-text-muted mt-0.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                {isRtl
                  ? `الحصة الحالية: ${
                      profile?.macro_preset === 'balanced' ? 'متوازن' :
                      profile?.macro_preset === 'high_protein' ? 'عالي البروتين' :
                      profile?.macro_preset === 'keto' ? 'كيتو' : 'مخصص'
                    } (${profile?.macro_carbs_pct ?? 40}% ك، ${profile?.macro_protein_pct ?? 30}% ب، ${profile?.macro_fat_pct ?? 30}% د)`
                  : `Current: ${
                      profile?.macro_preset === 'balanced' ? 'Balanced' :
                      profile?.macro_preset === 'high_protein' ? 'High Protein' :
                      profile?.macro_preset === 'keto' ? 'Keto' : 'Custom'
                    } (${profile?.macro_carbs_pct ?? 40}% C / ${profile?.macro_protein_pct ?? 30}% P / ${profile?.macro_fat_pct ?? 30}% F)`
                }
              </Text>
            </View>
          </View>
          <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={20} color={isDark ? '#8A9690' : '#626A66'} />
        </TouchableOpacity>

        {/* Section: Measurement Units */}
        <View className="bg-bg-card rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
          <Text className={`text-sm font-outfit-bold text-text-primary mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
            {t.unitPref}
          </Text>
          <View className="gap-y-4">
            {/* Weight Unit */}
            <View className={`flex-row justify-between items-center w-full py-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Text className="text-xs font-outfit-semibold text-text-primary">{t.weightUnit}</Text>
              <View className="w-32">
                <SegmentedControl
                  options={[
                    { value: 'kg', label: 'kg' },
                    { value: 'lbs', label: 'lbs' }
                  ]}
                  selectedValue={profile?.unit_weight || 'kg'}
                  onChange={(val) => handleStatChange('unit_weight', val)}
                  isRtl={isRtl}
                />
              </View>
            </View>

            {/* Height Unit */}
            <View className={`flex-row justify-between items-center w-full py-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Text className="text-xs font-outfit-semibold text-text-primary">{t.heightUnit}</Text>
              <View className="w-32">
                <SegmentedControl
                  options={[
                    { value: 'cm', label: 'cm' },
                    { value: 'ft_in', label: 'ft/in' }
                  ]}
                  selectedValue={profile?.unit_height || 'cm'}
                  onChange={(val) => handleStatChange('unit_height', val)}
                  isRtl={isRtl}
                />
              </View>
            </View>

            {/* Water Unit */}
            <View className={`flex-row justify-between items-center w-full py-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Text className="text-xs font-outfit-semibold text-text-primary">{t.waterUnit}</Text>
              <View className="w-32">
                <SegmentedControl
                  options={[
                    { value: 'ml', label: 'ml' },
                    { value: 'fl_oz', label: 'fl oz' }
                  ]}
                  selectedValue={profile?.unit_water || 'ml'}
                  onChange={(val) => handleStatChange('unit_water', val)}
                  isRtl={isRtl}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Section: Reminders & Notifications */}
        <View className="bg-bg-card rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
          <Text className={`text-sm font-outfit-bold text-text-primary mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
            {t.reminders}
          </Text>
          <View className="gap-y-4">
            {/* Meal Reminders */}
            <View className={`flex-row justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
              <View className={`flex-1 ${isRtl ? 'pl-4' : 'pr-4'}`}>
                <Text className={`text-xs font-outfit-semibold text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.mealReminders}
                </Text>
                <Text className={`text-[10px] text-text-muted mt-0.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {isRtl ? 'تنبيه لتسجيل الفطور والغداء والعشاء' : 'Remind me to log breakfast, lunch, and dinner'}
                </Text>
              </View>
              <AnimatedSwitch
                value={!!profile?.reminder_meals}
                onValueChange={(val) => handleReminderToggle('meals', val)}
              />
            </View>

            {/* Water Reminders */}
            <View className={`flex-row justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
              <View className={`flex-1 ${isRtl ? 'pl-4' : 'pr-4'}`}>
                <Text className={`text-xs font-outfit-semibold text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.waterReminders}
                </Text>
                <Text className={`text-[10px] text-text-muted mt-0.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {isRtl ? 'تنبيه شرب الماء للحفاظ على رطوبة جسمك' : 'Remind me to drink water throughout the day'}
                </Text>
              </View>
              <AnimatedSwitch
                value={!!profile?.reminder_water}
                onValueChange={(val) => handleReminderToggle('water', val)}
              />
            </View>

            {/* Workout Reminders */}
            <View className={`flex-row justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
              <View className={`flex-1 ${isRtl ? 'pl-4' : 'pr-4'}`}>
                <Text className={`text-xs font-outfit-semibold text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.workoutReminders}
                </Text>
                <Text className={`text-[10px] text-text-muted mt-0.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {isRtl ? 'تذكير بتسجيل أنشطتك الرياضية اليومية' : 'Remind me to log daily exercises and workouts'}
                </Text>
              </View>
              <AnimatedSwitch
                value={!!profile?.reminder_workout}
                onValueChange={(val) => handleReminderToggle('workout', val)}
              />
            </View>
          </View>
        </View>

        {/* Section 4: Application Configurations (Language, Country priority) */}
        <View className="bg-bg-card rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
          <Text className={`text-sm font-outfit-bold text-text-primary mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t.appSettings}</Text>

          {/* Language Selection */}
          <View className="mb-4">
            <Text className={`text-xs font-outfit-semibold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t.langOpt}</Text>
            <SegmentedControl
              options={[
                { value: 'ar', label: 'العربية' },
                { value: 'en', label: 'English' }
              ]}
              selectedValue={profile?.language || 'ar'}
              onChange={(val) => handleStatChange('language', val)}
              isRtl={isRtl}
            />
          </View>

          {/* Country Selection */}
          <View className="mb-4">
            <Text className={`text-xs font-outfit-semibold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t.countryOpt}</Text>
            <SegmentedControl
              options={[
                { value: 'EG', label: 'Egypt (مصر)' },
                { value: 'GB', label: 'UK (الملكة المتحدة)' }
              ]}
              selectedValue={profile?.country || 'EG'}
              onChange={(val) => handleStatChange('country', val)}
              isRtl={isRtl}
            />
          </View>

          {/* App Theme Selection */}
          <View>
            <Text className={`text-xs font-outfit-semibold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t.appTheme}</Text>
            <SegmentedControl
              options={[
                { value: 'light', label: t.light },
                { value: 'dark', label: t.dark },
                { value: 'system', label: t.system }
              ]}
              selectedValue={profile?.app_theme || 'system'}
              onChange={(val) => handleStatChange('app_theme', val)}
              isRtl={isRtl}
            />
          </View>
        </View>

        {/* Support & Legal Card */}
        <View className="bg-bg-card rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
          <Text className={`text-sm font-outfit-bold text-text-primary mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
            {isRtl ? 'المساعدة والبنود القانونية' : 'Help & Legal'}
          </Text>
          <View className="divide-y divide-[#F0F2F0] dark:divide-border-muted">
            {/* Help & FAQ */}
            <TouchableOpacity 
              onPress={() => setShowFaqModal(true)} 
              className={`flex-row justify-between items-center py-3.5 ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Ionicons name="help-circle-outline" size={18} color={isDark ? '#8A9690' : '#626A66'} style={isRtl ? { marginLeft: 8 } : { marginRight: 8 }} />
                <Text className="text-xs font-outfit-semibold text-text-primary">{t.helpFAQ}</Text>
              </View>
              <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={16} color={isDark ? '#8A9690' : '#9CA19E'} />
            </TouchableOpacity>

            {/* Privacy Policy */}
            <TouchableOpacity 
              onPress={() => setShowPrivacyModal(true)} 
              className={`flex-row justify-between items-center py-3.5 ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Ionicons name="lock-closed-outline" size={18} color={isDark ? '#8A9690' : '#626A66'} style={isRtl ? { marginLeft: 8 } : { marginRight: 8 }} />
                <Text className="text-xs font-outfit-semibold text-text-primary">{t.privacyPolicy}</Text>
              </View>
              <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={16} color={isDark ? '#8A9690' : '#9CA19E'} />
            </TouchableOpacity>

            {/* Terms of Service */}
            <TouchableOpacity 
              onPress={() => setShowTermsModal(true)} 
              className={`flex-row justify-between items-center py-3.5 ${isRtl ? 'flex-row-reverse' : ''}`}
            >

              <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Ionicons name="document-text-outline" size={18} color={isDark ? '#8A9690' : '#626A66'} style={isRtl ? { marginLeft: 8 } : { marginRight: 8 }} />
                <Text className="text-xs font-outfit-semibold text-text-primary">{t.termsOfService}</Text>
              </View>
              <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={16} color={isDark ? '#8A9690' : '#9CA19E'} />
            </TouchableOpacity>

            {/* App Version */}
            <View className={`flex-row justify-between items-center py-3.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Ionicons name="information-circle-outline" size={18} color={isDark ? '#8A9690' : '#626A66'} style={isRtl ? { marginLeft: 8 } : { marginRight: 8 }} />
                <Text className="text-xs font-outfit-semibold text-text-primary">{isRtl ? 'نسخة التطبيق' : 'App Version'}</Text>
              </View>
              <Text className="text-[10px] font-inter-semibold text-text-muted">v1.0.0 (Build 1)</Text>
            </View>
          </View>
        </View>

        {/* Section: Danger Zone */}
        <View className="bg-bg-card rounded-3xl border border-red-100 p-5 mb-5 shadow-sm bg-red-50/10">
          <Text className={`text-sm font-outfit-bold text-red-800 mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
            {t.dangerZone}
          </Text>
          <View className="gap-y-3">
            {/* Clear Cache */}
            <TouchableOpacity 
              onPress={() => {
                Alert.alert(
                  t.confirmClearCacheTitle,
                  t.confirmClearCacheMsg,
                  [
                    { text: t.cancel, style: 'cancel' },
                    { 
                      text: isRtl ? 'مسح' : 'Clear', 
                      style: 'destructive', 
                      onPress: async () => {
                        useDiaryStore.getState().resetAll();
                        if (isSignedIn && user?.id) {
                          await useDiaryStore.getState().fetchFromSupabase(user.id);
                        }
                        Alert.alert(isRtl ? 'تم المسح' : 'Cleared', isRtl ? 'تم مسح الذاكرة المؤقتة بنجاح.' : 'Local cache cleared successfully.');
                      } 
                    }
                  ]
                );
              }}
              className={`flex-row justify-between items-center p-3.5 border border-red-200/50 rounded-xl bg-bg-card ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <Text className="text-xs font-outfit-semibold text-red-600">{t.clearCache}</Text>
              <Ionicons name="trash-bin-outline" size={16} color="#DC2626" />
            </TouchableOpacity>

            {/* Delete Account */}
            <TouchableOpacity 
              onPress={() => setShowDeleteModal(true)}
              className={`flex-row justify-between items-center p-3.5 border border-red-200/50 rounded-xl bg-bg-card ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <Text className="text-xs font-outfit-semibold text-red-600">{t.deleteAccount}</Text>
              <Ionicons name="person-remove-outline" size={16} color="#DC2626" />
            </TouchableOpacity>

            {/* Sign Out (Only if signed in) */}
            {isSignedIn && (
              <TouchableOpacity 
                onPress={() => {
                  Alert.alert(
                    isRtl ? 'تسجيل الخروج' : 'Sign Out',
                    isRtl ? 'هل أنت متأكد من رغبتك في تسجيل الخروج؟' : 'Are you sure you want to sign out?',
                    [
                      { text: t.cancel, style: 'cancel' },
                      { text: t.signOutBtn, style: 'destructive', onPress: signOut }
                    ]
                  );
                }}
                className={`flex-row justify-between items-center p-3.5 border border-border-muted rounded-xl bg-bg-card ${isRtl ? 'flex-row-reverse' : ''}`}
              >
                <Text className="text-xs font-outfit-semibold text-text-primary">{t.signOutBtn}</Text>
                <Ionicons name="log-out-outline" size={16} color={isDark ? '#E5EAE5' : '#1A1E1C'} />
              </TouchableOpacity>
            )}
          </View>
        </View>

      </ScrollView>

      {/* Dietary Preferences Modal */}
      <Modal
        visible={showDietaryModal}
        animationType="slide"
        onRequestClose={() => setShowDietaryModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#101412' : '#F8F9F8' }}>
          {/* Modal Header */}
          <View className={`flex-row justify-between items-center px-5 py-4 bg-bg-card border-b border-border-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
            <TouchableOpacity onPress={() => setShowDietaryModal(false)} className="p-1">
              <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={24} color={isDark ? '#E5EAE5' : '#1A1E1C'} />
            </TouchableOpacity>
            <Text className="text-base font-outfit-bold text-text-primary">
              {isRtl ? 'التفضيلات الغذائية' : 'Dietary Preferences'}
            </Text>
            <View className="w-10" />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {/* Diet Type */}
            <View className="bg-bg-card rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
              <Text className={`text-xs font-outfit-semibold text-text-primary mb-3.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                {isRtl ? 'نوع الدايت' : 'Diet Type'}
              </Text>
              <View className="gap-2">
                {[
                  { id: 'classic', label_en: 'Classic / Anything', label_ar: 'تقليدي / كل شيء' },
                  { id: 'vegetarian', label_en: 'Vegetarian', label_ar: 'نباتي (ألبان وخضار)' },
                  { id: 'vegan', label_en: 'Vegan', label_ar: 'نباتي صرف' },
                  { id: 'keto', label_en: 'Keto', label_ar: 'كيتو' },
                  { id: 'low_carb', label_en: 'Low Carb', label_ar: 'قليل الكربوهيدرات' },
                ].map((diet) => (
                  <TouchableOpacity
                    key={diet.id}
                    onPress={() => handleStatChange('diet_type', diet.id)}
                    className={`flex-row justify-between items-center p-3 border border-border-muted rounded-xl bg-bg-card ${
                      profile?.diet_type === diet.id ? 'border-accent-sage bg-[#F3F6F3] dark:bg-[#1F2E25]' : ''
                    } ${isRtl ? 'flex-row-reverse' : ''}`}
                  >
                    <Text className={`text-xs font-inter-medium ${profile?.diet_type === diet.id ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
                      {isRtl ? diet.label_ar : diet.label_en}
                    </Text>
                    {profile?.diet_type === diet.id && (
                      <Ionicons name="checkmark" size={16} color={isDark ? '#5C856C' : '#4C6E58'} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Common Exclusions */}
            <View className="bg-bg-card rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
              <Text className={`text-xs font-outfit-semibold text-text-primary mb-3 ${isRtl ? 'text-right' : 'text-left'}`}>
                {isRtl ? 'الحساسية واستبعادات الشائعة' : 'Common Exclusions / Allergies'}
              </Text>
              <View className={`flex-row flex-wrap gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {[
                  { id: 'gluten-free', label_en: 'Gluten-Free', label_ar: 'خالي من الجلوتين' },
                  { id: 'dairy-free', label_en: 'Dairy-Free', label_ar: 'خالي من الألبان' },
                  { id: 'nut-free', label_en: 'Nut-Free', label_ar: 'خالي من المكسرات' },
                  { id: 'seafood-free', label_en: 'Seafood-Free', label_ar: 'خالي من المأكولات البحرية' },
                ].map((excl) => {
                  const currentExclusions = profile?.exclusions || [];
                  const isSelected = currentExclusions.includes(excl.id);
                  return (
                    <TouchableOpacity
                      key={excl.id}
                      onPress={() => {
                        const newList = isSelected
                          ? currentExclusions.filter((e) => e !== excl.id)
                          : [...currentExclusions, excl.id];
                        handleStatChange('exclusions', newList);
                      }}
                      className={`px-3 py-2 border rounded-full bg-bg-card flex-row items-center gap-1 ${
                        isSelected ? 'border-accent-sage bg-[#F3F6F3] dark:bg-[#1F2E25]' : 'border-border-muted'
                      } ${isRtl ? 'flex-row-reverse' : ''}`}
                    >
                      <Ionicons
                        name={isSelected ? "checkmark-circle" : "add-circle-outline"}
                        size={12}
                        color={isSelected ? "#4C6E58" : "#626A66"}
                      />
                      <Text className={`text-xs font-inter-medium ${isSelected ? 'text-text-primary font-inter-semibold' : 'text-text-muted'}`}>
                        {isRtl ? excl.label_ar : excl.label_en}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Custom Excluded Ingredients */}
            <View className="bg-bg-card rounded-3xl border border-border-muted p-5 shadow-sm">
              <Text className={`text-xs font-outfit-semibold text-text-primary mb-3 ${isRtl ? 'text-right' : 'text-left'}`}>
                {isRtl ? 'المكونات والأطعمة المستبعدة' : 'Disliked / Excluded Foods'}
              </Text>
              
              {/* Add Custom Ingredient Input */}
              <View className={`flex-row gap-2 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <TextInput
                  className={`flex-1 bg-bg-card border border-border-muted rounded-xl px-3 py-2 font-inter text-xs text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}
                  placeholder={isRtl ? 'مثال: خبز، أرز، سمك...' : 'e.g. Bread, Rice, Fish...'}
                  placeholderTextColor="#9CA19E"
                  value={newIngredient}
                  onChangeText={setNewIngredient}
                />
                <TouchableOpacity
                  onPress={() => {
                    if (!newIngredient.trim()) return;
                    const item = newIngredient.trim();
                    const currentDislikes = profile?.disliked_ingredients || [];
                    if (!currentDislikes.some(d => d.toLowerCase() === item.toLowerCase())) {
                      handleStatChange('disliked_ingredients', [...currentDislikes, item]);
                    }
                    setNewIngredient('');
                  }}
                  className="bg-accent-sage px-4 rounded-xl justify-center items-center"
                >
                  <Text className="text-white text-xs font-outfit-bold">{isRtl ? 'إضافة' : 'Add'}</Text>
                </TouchableOpacity>
              </View>

              {/* Tags list */}
              <View className={`flex-row flex-wrap gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {(profile?.disliked_ingredients || []).map((item) => (
                  <View
                    key={item}
                    className="flex-row items-center bg-[#9CA19E]/10 border border-[#9CA19E]/20 rounded-full px-3 py-1.5 gap-1.5"
                  >
                    <Text className="text-xs font-inter text-text-primary">{item}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const currentDislikes = profile?.disliked_ingredients || [];
                        const newList = currentDislikes.filter((d) => d !== item);
                        handleStatChange('disliked_ingredients', newList);
                      }}
                      className="p-0.5"
                    >
                      <Ionicons name="close-circle" size={14} color={isDark ? '#8A9690' : '#626A66'} />
                    </TouchableOpacity>
                  </View>
                ))}

                {(profile?.disliked_ingredients || []).length === 0 && (
                  <Text className={`text-[10px] text-text-muted italic ${isRtl ? 'text-right w-full' : 'text-left w-full'}`}>
                    {isRtl ? 'لا توجد أطعمة مستبعدة حالياً.' : 'No excluded foods currently.'}
                  </Text>
                )}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Macro Adjuster Modal */}
      <Modal
        visible={showMacroModal}
        animationType="slide"
        onRequestClose={() => setShowMacroModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#101412' : '#F8F9F8' }}>
          {/* Modal Header */}
          <View className={`flex-row justify-between items-center px-5 py-4 bg-bg-card border-b border-border-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
            <TouchableOpacity onPress={() => setShowMacroModal(false)} className="p-1">
              <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={24} color={isDark ? '#E5EAE5' : '#1A1E1C'} />
            </TouchableOpacity>
            <Text className="text-base font-outfit-bold text-text-primary">{t.adjustMacros}</Text>
            <View className="w-10" />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {/* Preset Selection */}
            <View className="mb-5">
              <Text className={`text-xs font-outfit-semibold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                {t.macroPresets}
              </Text>
              <SegmentedControl
                options={[
                  { value: 'balanced', label: t.balanced },
                  { value: 'high_protein', label: t.highProtein },
                  { value: 'keto', label: t.keto },
                  { value: 'custom', label: t.custom }
                ]}
                selectedValue={macroPreset}
                onChange={(val) => {
                  setMacroPreset(val);
                  if (val === 'balanced') {
                    setMacroCarbs(40);
                    setMacroProtein(30);
                    setMacroFat(30);
                  } else if (val === 'high_protein') {
                    setMacroCarbs(30);
                    setMacroProtein(40);
                    setMacroFat(30);
                  } else if (val === 'keto') {
                    setMacroCarbs(10);
                    setMacroProtein(30);
                    setMacroFat(60);
                  }
                }}
                isRtl={isRtl}
              />
            </View>

            {/* Macro Inputs */}
            <View className="gap-y-4 mb-6">
              {/* Carbs */}
              <View className={`flex-row justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Text className="text-xs font-outfit-semibold text-text-muted">{t.carbsPercent}</Text>
                <View className="w-24 flex-row items-center border border-border-muted rounded-xl bg-bg-card px-2">
                  <TextInput
                    className="flex-1 py-2 font-inter text-sm text-text-primary text-center"
                    keyboardType="numeric"
                    value={macroCarbs.toString()}
                    editable={macroPreset === 'custom'}
                    onChangeText={(text) => {
                      const val = parseInt(text) || 0;
                      setMacroCarbs(val);
                    }}
                  />
                  <Text className="text-xs font-inter text-text-muted">%</Text>
                </View>
              </View>

              {/* Protein */}
              <View className={`flex-row justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Text className="text-xs font-outfit-semibold text-text-muted">{t.proteinPercent}</Text>
                <View className="w-24 flex-row items-center border border-border-muted rounded-xl bg-bg-card px-2">
                  <TextInput
                    className="flex-1 py-2 font-inter text-sm text-text-primary text-center"
                    keyboardType="numeric"
                    value={macroProtein.toString()}
                    editable={macroPreset === 'custom'}
                    onChangeText={(text) => {
                      const val = parseInt(text) || 0;
                      setMacroProtein(val);
                    }}
                  />
                  <Text className="text-xs font-inter text-text-muted">%</Text>
                </View>
              </View>

              {/* Fats */}
              <View className={`flex-row justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Text className="text-xs font-outfit-semibold text-text-muted">{t.fatsPercent}</Text>
                <View className="w-24 flex-row items-center border border-border-muted rounded-xl bg-bg-card px-2">
                  <TextInput
                    className="flex-1 py-2 font-inter text-sm text-text-primary text-center"
                    keyboardType="numeric"
                    value={macroFat.toString()}
                    editable={macroPreset === 'custom'}
                    onChangeText={(text) => {
                      const val = parseInt(text) || 0;
                      setMacroFat(val);
                    }}
                  />
                  <Text className="text-xs font-inter text-text-muted">%</Text>
                </View>
              </View>
            </View>

            {/* Validation Info */}
            <View className="mb-6 p-4 rounded-2xl bg-bg-base border border-border-muted">
              <View className={`flex-row justify-between items-center mb-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Text className="text-xs font-outfit-semibold text-text-primary">
                  {isRtl ? 'مجموع النسب اليومي' : 'Total Percentage'}
                </Text>
                <Text className={`text-sm font-inter-bold ${
                  macroCarbs + macroProtein + macroFat === 100 ? 'text-accent-sage' : 'text-nutrient-calories'
                }`}>
                  {macroCarbs + macroProtein + macroFat}% / 100%
                </Text>
              </View>
              {macroCarbs + macroProtein + macroFat !== 100 && (
                <Text className={`text-[10px] text-nutrient-calories font-inter-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.macroValidationErr}
                </Text>
              )}
            </View>

            {/* Modal Actions */}
            <View className="gap-y-2">
              <TouchableOpacity
                onPress={() => {
                  const sum = macroCarbs + macroProtein + macroFat;
                  if (sum !== 100) {
                    Alert.alert(isRtl ? 'خطأ في التحقق' : 'Validation Error', t.macroValidationErr);
                    return;
                  }
                  
                  handleStatChange('macro_preset', macroPreset);
                  handleStatChange('macro_carbs_pct', macroCarbs);
                  handleStatChange('macro_protein_pct', macroProtein);
                  handleStatChange('macro_fat_pct', macroFat);
                  
                  setShowMacroModal(false);
                  Alert.alert(isRtl ? 'تم الحفظ' : 'Saved', isRtl ? 'تم تحديث نسب المغذيات الكبرى بنجاح.' : 'Macronutrient ratios updated successfully.');
                }}
                disabled={macroCarbs + macroProtein + macroFat !== 100}
                className={`rounded-xl py-3 items-center justify-center ${
                  macroCarbs + macroProtein + macroFat === 100 ? 'bg-accent-sage' : 'bg-accent-sage/40'
                }`}
              >
                <Text className="text-white text-xs font-outfit-bold">{t.save}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowMacroModal(false)}
                className="bg-bg-base border border-border-muted rounded-xl py-3 items-center justify-center"
              >
                <Text className="text-text-primary text-xs font-outfit-bold">{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* FAQ Modal */}
      <Modal
        visible={showFaqModal}
        animationType="slide"
        onRequestClose={() => setShowFaqModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#101412' : '#F8F9F8' }}>
          {/* Modal Header */}
          <View className={`flex-row justify-between items-center px-5 py-4 bg-bg-card border-b border-border-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
            <TouchableOpacity onPress={() => setShowFaqModal(false)} className="p-1">
              <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={24} color={isDark ? '#E5EAE5' : '#1A1E1C'} />
            </TouchableOpacity>
            <Text className="text-base font-outfit-bold text-text-primary">{t.helpFAQ}</Text>
            <View className="w-10" />
          </View>

          {/* Search Input Section */}
          <View className="px-5 pt-4 bg-bg-card pb-3 border-b border-border-muted">
            <View className={`flex-row items-center bg-[#F0F2F0] dark:bg-border-muted rounded-2xl px-4 py-2.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Ionicons name="search-outline" size={20} color={isDark ? '#8A9690' : '#626A66'} />
              <TextInput
                value={faqSearchQuery}
                onChangeText={setFaqSearchQuery}
                placeholder={isRtl ? 'ابحث في الأسئلة الشائعة...' : 'Search FAQs...'}
                placeholderTextColor="#9CA19E"
                className={`flex-1 text-xs font-inter-regular text-text-primary px-2.5 py-1 ${
                  isRtl ? 'text-right' : 'text-left'
                }`}
              />
              {faqSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setFaqSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={isDark ? '#8A9690' : '#9CA19E'} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
            {/* If user is searching */}
            {faqSearchQuery.trim().length > 0 ? (
              <View className="gap-y-4">
                {filteredFaqs && filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq) => {
                    const isExpanded = expandedFaqQuestion === faq.id;
                    return (
                      <View key={faq.id} className="bg-bg-card rounded-3xl border border-border-muted overflow-hidden shadow-sm">
                        <TouchableOpacity
                          onPress={() => setExpandedFaqQuestion(isExpanded ? null : faq.id)}
                          className={`flex-row justify-between items-center p-5 ${isRtl ? 'flex-row-reverse' : ''}`}
                          activeOpacity={0.7}
                        >
                          <View className={`flex-1 ${isRtl ? 'items-end' : 'items-start'} px-1`}>
                            <Text className="text-[10px] font-outfit-bold text-accent-sage mb-1 uppercase tracking-wider">
                              {faq.categoryName}
                            </Text>
                            <Text className={`text-xs font-outfit-bold text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}>
                              {isRtl ? faq.item.q_ar : faq.item.q_en}
                            </Text>
                          </View>
                          <Ionicons 
                            name={isExpanded ? "chevron-up" : "chevron-down"} 
                            size={18} 
                            color={isDark ? '#8A9690' : '#626A66'} 
                          />
                        </TouchableOpacity>
                        
                        {isExpanded && (
                          <View className="bg-[#F8F9F8] px-5 py-4 border-t border-border-muted">
                            <Text className={`text-xs font-inter-regular text-text-muted leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
                              {isRtl ? faq.item.a_ar : faq.item.a_en}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                ) : (
                  <View className="items-center justify-center py-10">
                    <Ionicons name="search-outline" size={48} color="#D3B177" className="mb-3 opacity-60" />
                    <Text className="text-sm font-outfit-bold text-text-primary text-center">
                      {isRtl ? 'لا توجد نتائج مطابقة' : 'No results found'}
                    </Text>
                    <Text className="text-xs font-inter-regular text-text-muted text-center mt-1">
                      {isRtl ? `لم نجد أي نتائج لـ "${faqSearchQuery}"` : `We couldn't find any results for "${faqSearchQuery}"`}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              /* If query is empty, show categories */
              <View className="gap-y-4">
                {faqCategories.map((category, catIdx) => {
                  const isCategoryExpanded = expandedFaqCategory === catIdx;
                  return (
                    <View key={catIdx} className="bg-bg-card rounded-3xl border border-border-muted overflow-hidden shadow-sm">
                      <TouchableOpacity
                        onPress={() => setExpandedFaqCategory(isCategoryExpanded ? null : catIdx)}
                        className={`flex-row justify-between items-center p-5 ${isRtl ? 'flex-row-reverse' : ''}`}
                        activeOpacity={0.7}
                      >
                        <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                          <Ionicons 
                            name={category.icon as any} 
                            size={20} 
                            color={isDark ? '#5C856C' : '#4C6E58'} 
                            style={isRtl ? { marginLeft: 12 } : { marginRight: 12 }} 
                          />
                          <Text className="text-sm font-outfit-bold text-text-primary">
                            {isRtl ? category.category_ar : category.category_en}
                          </Text>
                        </View>
                        <Ionicons 
                          name={isCategoryExpanded ? "chevron-up" : "chevron-down"} 
                          size={18} 
                          color={isDark ? '#8A9690' : '#626A66'} 
                        />
                      </TouchableOpacity>

                      {isCategoryExpanded && (
                        <View className="px-5 pb-5 border-t border-[#F0F2F0] dark:border-border-muted pt-2">
                          {category.items.map((item, itemIdx) => {
                            const questionId = `${catIdx}-${itemIdx}`;
                            const isQuestionExpanded = expandedFaqQuestion === questionId;
                            return (
                              <View key={itemIdx} className="border-b border-[#F0F2F0] dark:border-border-muted last:border-b-0 py-3">
                                <TouchableOpacity
                                  onPress={() => setExpandedFaqQuestion(isQuestionExpanded ? null : questionId)}
                                  className={`flex-row justify-between items-center py-2 ${isRtl ? 'flex-row-reverse' : ''}`}
                                  activeOpacity={0.6}
                                >
                                  <Text className={`flex-1 text-xs font-outfit-semibold text-text-primary pr-3 ${isRtl ? 'text-right pl-3 pr-0' : 'text-left'}`}>
                                    {isRtl ? item.q_ar : item.q_en}
                                  </Text>
                                  <Ionicons 
                                    name={isQuestionExpanded ? "chevron-up" : "chevron-down"} 
                                    size={16} 
                                    color={isDark ? '#8A9690' : '#9CA19E'} 
                                  />
                                </TouchableOpacity>

                                {isQuestionExpanded && (
                                  <View className="bg-[#F8F9F8] p-3.5 rounded-2xl mt-2 border border-border-muted">
                                    <Text className={`text-xs font-inter-regular text-text-muted leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
                                      {isRtl ? item.a_ar : item.a_en}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-bg-card rounded-3xl p-6 w-full max-w-sm border border-border-muted shadow-xl">
            <View className="items-center mb-4">
              <View className="w-12 h-12 bg-red-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="alert-circle" size={28} color="#DC2626" />
              </View>
              <Text className="text-base font-outfit-bold text-text-primary text-center">
                {t.confirmDeleteAccountTitle}
              </Text>
            </View>
            <Text className="text-xs font-inter-regular text-text-muted leading-relaxed text-center mb-6">
              {t.confirmDeleteAccountMsg}
            </Text>
            <View className="gap-y-2">
              <TouchableOpacity
                onPress={async () => {
                  setShowDeleteModal(false);
                  try {
                    if (isSignedIn) {
                      await deleteAccount();
                    } else {
                      useDiaryStore.getState().resetAll();
                    }
                    Alert.alert(
                      isRtl ? 'تم حذف الحساب' : 'Account Deleted', 
                      isRtl ? 'تم حذف حسابك وبياناتك بنجاح.' : 'Your account and history have been deleted successfully.'
                    );
                  } catch (err) {
                    console.error('Error deleting account:', err);
                    Alert.alert(
                      isRtl ? 'خطأ' : 'Error',
                      isRtl ? 'حدث خطأ أثناء حذف الحساب.' : 'An error occurred while deleting the account.'
                    );
                  }
                }}
                className="bg-red-600 rounded-xl py-3 items-center justify-center"
              >
                <Text className="text-white text-xs font-outfit-bold">{t.deleteBtn}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                className="bg-bg-base border border-border-muted rounded-xl py-3 items-center justify-center"
              >
                <Text className="text-text-primary text-xs font-outfit-bold">{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#101412' : '#F8F9F8' }}>
          {/* Modal Header */}
          <View className={`flex-row justify-between items-center px-5 py-4 bg-bg-card border-b border-border-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
            <TouchableOpacity onPress={() => setShowPrivacyModal(false)} className="p-1">
              <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={24} color={isDark ? '#E5EAE5' : '#1A1E1C'} />
            </TouchableOpacity>
            <Text className="text-base font-outfit-bold text-text-primary">{t.privacyPolicy}</Text>
            <View className="w-10" />
          </View>

          {/* Privacy Policy Content */}
          <ScrollView 
            contentContainerStyle={{ padding: 20, paddingBottom: 60 }} 
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-y-4">
              {privacySections.map((section) => (
                <View 
                  key={section.id} 
                  className="bg-bg-card rounded-3xl border border-border-muted p-5 shadow-sm"
                >
                  {/* Section Title with Icon */}
                  <View className={`flex-row items-center mb-3.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <Ionicons 
                      name={section.icon as any} 
                      size={20} 
                      color="#4A5E53" 
                      style={isRtl ? { marginLeft: 10 } : { marginRight: 10 }} 
                    />
                    <Text className={`text-sm font-outfit-bold text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}>
                      {isRtl ? section.title_ar : section.title_en}
                    </Text>
                  </View>

                  {/* Section Paragraphs */}
                  <View className="gap-y-3">
                    {(isRtl ? section.paragraphs_ar : section.paragraphs_en).map((para, index) => (
                      <Text 
                        key={index} 
                        className={`text-xs font-inter-regular text-text-muted leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}
                      >
                        {para}
                      </Text>
                    ))}
                  </View>

                  {/* Optional Bullet Points */}
                  {((isRtl ? section.bullets_ar : section.bullets_en) && (isRtl ? section.bullets_ar : section.bullets_en)!.length > 0) && (
                    <View className="mt-3.5 gap-y-2 border-t border-[#F0F2F0] dark:border-border-muted pt-3.5">
                      {(isRtl ? section.bullets_ar : section.bullets_en)!.map((bullet, index) => (
                        <View 
                          key={index} 
                          className={`flex-row items-start ${isRtl ? 'flex-row-reverse' : ''}`}
                        >
                          <Text className="text-[#4A5E53] px-2">•</Text>
                          <Text 
                            className={`flex-1 text-xs font-inter-regular text-text-muted leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}
                          >
                            {bullet}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Terms of Service Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#101412' : '#F8F9F8' }}>
          {/* Modal Header */}
          <View className={`flex-row justify-between items-center px-5 py-4 bg-bg-card border-b border-border-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
            <TouchableOpacity onPress={() => setShowTermsModal(false)} className="p-1">
              <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={24} color={isDark ? '#E5EAE5' : '#1A1E1C'} />
            </TouchableOpacity>
            <Text className="text-base font-outfit-bold text-text-primary">{t.termsOfService}</Text>
            <View className="w-10" />
          </View>

          {/* Terms of Service Content */}
          <ScrollView 
            contentContainerStyle={{ padding: 20, paddingBottom: 60 }} 
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-y-4">
              {termsSections.map((section) => (
                <View 
                  key={section.id} 
                  className="bg-bg-card rounded-3xl border border-border-muted p-5 shadow-sm"
                >
                  {/* Section Title with Icon */}
                  <View className={`flex-row items-center mb-3.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <Ionicons 
                      name={section.icon as any} 
                      size={20} 
                      color="#4A5E53" 
                      style={isRtl ? { marginLeft: 10 } : { marginRight: 10 }} 
                    />
                    <Text className={`text-sm font-outfit-bold text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}>
                      {isRtl ? section.title_ar : section.title_en}
                    </Text>
                  </View>

                  {/* Section Paragraphs */}
                  <View className="gap-y-3">
                    {(isRtl ? section.paragraphs_ar : section.paragraphs_en).map((para, index) => (
                      <Text 
                        key={index} 
                        className={`text-xs font-inter-regular text-text-muted leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}
                      >
                        {para}
                      </Text>
                    ))}
                  </View>

                  {/* Optional Bullet Points */}
                  {((isRtl ? section.bullets_ar : section.bullets_en) && (isRtl ? section.bullets_ar : section.bullets_en)!.length > 0) && (
                    <View className="mt-3.5 gap-y-2 border-t border-[#F0F2F0] dark:border-border-muted pt-3.5">
                      {(isRtl ? section.bullets_ar : section.bullets_en)!.map((bullet, index) => (
                        <View 
                          key={index} 
                          className={`flex-row items-start ${isRtl ? 'flex-row-reverse' : ''}`}
                        >
                          <Text className="text-[#4A5E53] px-2">•</Text>
                          <Text 
                            className={`flex-1 text-xs font-inter-regular text-text-muted leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}
                          >
                            {bullet}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>

  );
}
