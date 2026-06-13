import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDiaryStore } from '@/store/useDiaryStore';
import { useAuthStore } from '@/store/useAuthStore';
import { PresstoButton } from '@/components/PresstoButton';

export default function ProfileScreen() {
  // Zustand State
  const profile = useDiaryStore((state) => state.profile);
  const setProfile = useDiaryStore((state) => state.setProfile);
  const isTrial = useDiaryStore((state) => state.isTrial);
  const triggerClerkSignUp = useDiaryStore((state) => state.triggerClerkSignUp);

  const user = useAuthStore((state) => state.user);
  const isSignedIn = useAuthStore((state) => state.isSignedIn);
  const signOut = useAuthStore((state) => state.signOut);

  // Local UI states
  const [exporting, setExporting] = useState(false);
  const [exportSuccessUrl, setExportSuccessUrl] = useState<string | null>(null);
  const [showBiometrics, setShowBiometrics] = useState(true);
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const [newIngredient, setNewIngredient] = useState('');

  const language = profile?.language || 'ar';
  const isRtl = language === 'ar';

  const t = {
    title: isRtl ? 'الملف الشخصي' : 'Profile Settings',
    personalStats: isRtl ? 'المقاييس الحيوية' : 'Biometrics',
    gender: isRtl ? 'الجنس' : 'Gender',
    male: isRtl ? 'ذكر' : 'Male',
    female: isRtl ? 'أنثى' : 'Female',
    age: isRtl ? 'العمر (بالسنوات)' : 'Age (years)',
    weight: isRtl ? 'الوزن (كجم)' : 'Weight (kg)',
    height: isRtl ? 'الطول (سم)' : 'Height (cm)',
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
    trialMode: isRtl ? 'نسخة تجريبية (محلية)' : 'Trial Account (Local Cache)',
    trialMsg: isRtl ? 'سجل حسابك لحفظ بياناتك سحابياً وتصدير التقارير.' : 'Register to backup your logs and download PDF exports.',
    registerBtn: isRtl ? 'إنشاء حساب / تسجيل الدخول' : 'Sign Up / Sign In',
    signOutBtn: isRtl ? 'تسجيل الخروج' : 'Sign Out',
    activeUser: isRtl ? 'حساب نشط' : 'Premium Account',
  };

  const handleStatChange = (field: string, value: any) => {
    setProfile({ [field]: value });
  };

  const handleExportPDF = async () => {
    if (isTrial) {
      // PDF export is a premium trigger, open Clerk signup bottom sheet
      triggerClerkSignUp();
      return;
    }

    setExporting(true);
    setExportSuccessUrl(null);

    // Simulate Deno PDF compilation lag
    setTimeout(() => {
      setExporting(false);
      setExportSuccessUrl('https://supabase.co/storage/v1/object/public/reports/digest_summary.pdf');
    }, 2000);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9F8' }}>
      {/* Header */}
      <View className={`flex-row justify-between items-center px-5 py-4 bg-white border-b border-border-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
        <View className="w-10" />
        <Text className="text-base font-outfit-bold text-text-primary">{t.title}</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Section 1: Account Status Card */}
        <View className="bg-white rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
          <Text className={`text-sm font-outfit-bold text-text-primary mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t.account}</Text>
          {isSignedIn && user ? (
            <View className="items-center py-2">
              <View className="flex-row items-center bg-accent-mint px-3 py-1.5 rounded-xl mb-3">
                <Ionicons name="shield-checkmark" size={16} color="#4C6E58" style={{ marginRight: 4 }} />
                <Text className="text-[10px] font-outfit-bold text-accent-sage">{t.activeUser}</Text>
              </View>
              <Text className="text-lg font-outfit-bold text-text-primary">{user.name}</Text>
              <Text className="text-xs font-inter-medium text-text-muted mt-1">{user.email}</Text>
              <TouchableOpacity onPress={signOut} className="mt-4 py-2 px-4 border border-nutrient-calories rounded-xl">
                <Text className="color-nutrient-calories text-xs font-outfit-bold">{t.signOutBtn}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className={isRtl ? 'items-end' : 'items-start'}>
              <Text className="text-sm font-outfit-bold text-nutrient-calories mb-1.5">{t.trialMode}</Text>
              <Text className={`text-xs font-inter-regular text-text-muted leading-relaxed mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t.trialMsg}</Text>
              <PresstoButton
                onPress={triggerClerkSignUp}
                className="bg-accent-sage rounded-xl py-3 w-full items-center"
              >
                <Text className="text-white text-xs font-outfit-bold">{t.registerBtn}</Text>
              </PresstoButton>
            </View>
          )}
        </View>

        {/* PDF Export Panel - Styled in Mint/Sage Green System */}
        <View className="bg-accent-mint rounded-3xl border border-[#C3D9B6] p-5 mb-5 shadow-sm">
          <Text className={`text-sm font-outfit-bold text-accent-sage mb-2.5 ${isRtl ? 'text-right' : 'text-left'}`}>
            {t.pdfTitle}
          </Text>
          <Text className={`text-xs font-inter-regular text-text-muted leading-relaxed mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
            {t.pdfDesc}
          </Text>
          
          {exporting ? (
            <View className="flex-row justify-center items-center py-2">
              <ActivityIndicator size="small" color="#4C6E58" style={{ marginRight: 8 }} />
              <Text className="color-accent-sage text-xs font-outfit-bold">{t.pdfGenerating}</Text>
            </View>
          ) : exportSuccessUrl ? (
            <View className="mt-2">
              <Text className={`color-accent-sage text-xs font-outfit-bold mb-3 ${isRtl ? 'text-right' : 'text-left'}`}>✓ {t.pdfSuccess}</Text>
              <TouchableOpacity 
                onPress={() => Alert.alert('PDF Downloaded', 'Health summary PDF downloaded successfully.')}
                className="bg-accent-sage rounded-xl py-3 flex-row items-center justify-center"
              >
                <Ionicons name="cloud-download-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text className="text-white text-xs font-outfit-bold">{t.pdfDownload}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <PresstoButton 
              onPress={handleExportPDF} 
              className="bg-accent-sage rounded-xl py-3 flex-row items-center justify-center"
            >
              <Ionicons name="document-text-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text className="text-white text-xs font-outfit-bold">{t.pdfBtn}</Text>
            </PresstoButton>
          )}
        </View>

        {/* Section 2: Dynamic Targets Summary Table */}
        <View className="bg-white rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
          <Text className={`text-sm font-outfit-bold text-text-primary mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t.targetSummary}</Text>
          <View className="space-y-3">
            <View className={`flex-row justify-between py-2 border-b border-[#F0F2F0] ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Text className="text-xs font-outfit-semibold text-text-muted">{t.calories}</Text>
              <Text className="text-xs font-inter-bold text-text-primary">{profile?.target_calories || 2000} kcal</Text>
            </View>
            <View className={`flex-row justify-between py-2 border-b border-[#F0F2F0] ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Text className="text-xs font-outfit-semibold text-text-muted">{t.protein}</Text>
              <Text className="text-xs font-inter-bold text-text-primary">{profile?.target_protein_g || 120} g</Text>
            </View>
            <View className={`flex-row justify-between py-2 border-b border-[#F0F2F0] ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Text className="text-xs font-outfit-semibold text-text-muted">{t.carbs}</Text>
              <Text className="text-xs font-inter-bold text-text-primary">{profile?.target_carbs_g || 200} g</Text>
            </View>
            <View className={`flex-row justify-between py-2 border-b border-[#F0F2F0] ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Text className="text-xs font-outfit-semibold text-text-muted">{t.fats}</Text>
              <Text className="text-xs font-inter-bold text-text-primary">{profile?.target_fat_g || 65} g</Text>
            </View>
            <View className={`flex-row justify-between py-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Text className="text-xs font-outfit-semibold text-text-muted">{t.water}</Text>
              <Text className="text-xs font-inter-bold text-text-primary">{profile?.target_water_ml || 2500} ml</Text>
            </View>
          </View>
        </View>

        {/* Section 3: Biometrics Settings (Collapsible) */}
        <View className="bg-white rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
          <TouchableOpacity
            onPress={() => setShowBiometrics(!showBiometrics)}
            className={`flex-row justify-between items-center mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            <Text className="text-sm font-outfit-bold text-text-primary">{t.personalStats}</Text>
            <Ionicons name={showBiometrics ? "chevron-up" : "chevron-down"} size={20} color="#1A1E1C" />
          </TouchableOpacity>

          {showBiometrics && (
            <View className="space-y-4">
              {/* Gender */}
              <View>
                <Text className={`text-xs font-outfit-semibold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t.gender}</Text>
                <View className={`flex-row bg-[#F0F2F0] p-1 rounded-xl ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <TouchableOpacity
                    onPress={() => handleStatChange('gender', 'male')}
                    className="flex-1 py-2.5 items-center rounded-lg"
                    style={profile?.gender === 'male' ? styles.activeTab : null}
                  >
                    <Text className={`text-xs font-outfit-medium ${profile?.gender === 'male' ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
                      {t.male}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleStatChange('gender', 'female')}
                    className="flex-1 py-2.5 items-center rounded-lg"
                    style={profile?.gender === 'female' ? styles.activeTab : null}
                  >
                    <Text className={`text-xs font-outfit-medium ${profile?.gender === 'female' ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
                      {t.female}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Age */}
              <View>
                <Text className={`text-xs font-outfit-semibold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t.age}</Text>
                <TextInput
                  className={`bg-white border border-border-muted rounded-xl px-3 py-2.5 font-inter-regular text-sm text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}
                  keyboardType="numeric"
                  value={profile?.age?.toString() || '25'}
                  onChangeText={(text) => handleStatChange('age', parseInt(text) || 0)}
                />
              </View>

              {/* Weight */}
              <View>
                <Text className={`text-xs font-outfit-semibold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t.weight}</Text>
                <TextInput
                  className={`bg-white border border-border-muted rounded-xl px-3 py-2.5 font-inter-regular text-sm text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}
                  keyboardType="numeric"
                  value={profile?.weight_kg?.toString() || '80'}
                  onChangeText={(text) => handleStatChange('weight_kg', parseFloat(text) || 0)}
                />
              </View>

              {/* Height */}
              <View>
                <Text className={`text-xs font-outfit-semibold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t.height}</Text>
                <TextInput
                  className={`bg-white border border-border-muted rounded-xl px-3 py-2.5 font-inter-regular text-sm text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}
                  keyboardType="numeric"
                  value={profile?.height_cm?.toString() || '178'}
                  onChangeText={(text) => handleStatChange('height_cm', parseFloat(text) || 0)}
                />
              </View>

              {/* Activity Level */}
              <View>
                <Text className={`text-xs font-outfit-semibold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t.activity}</Text>
                <View className="space-y-2">
                  {(['sedentary', 'lightly_active', 'moderately_active', 'very_active'] as const).map((level) => (
                    <TouchableOpacity
                      key={level}
                      onPress={() => handleStatChange('activity_level', level)}
                      className={`flex-row justify-between items-center p-3 border border-border-muted rounded-xl bg-white ${
                        profile?.activity_level === level ? 'border-accent-sage bg-[#F3F6F3]' : ''
                      } ${isRtl ? 'flex-row-reverse' : ''}`}
                    >
                      <Text className={`text-xs font-inter-medium ${profile?.activity_level === level ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
                        {level === 'sedentary' && (isRtl ? 'قليل النشاط (مكتبي)' : 'Sedentary (desk job)')}
                        {level === 'lightly_active' && (isRtl ? 'نشاط خفيف (تمارين خفيفة)' : 'Lightly active')}
                        {level === 'moderately_active' && (isRtl ? 'نشط باعتدال (تمارين ٣-٥ أيام)' : 'Moderately active')}
                        {level === 'very_active' && (isRtl ? 'نشط جداً (تمارين يومية مكثفة)' : 'Very active')}
                      </Text>
                      {profile?.activity_level === level && (
                        <Ionicons name="checkmark" size={16} color="#4C6E58" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Health Goal */}
              <View>
                <Text className={`text-xs font-outfit-semibold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t.goal}</Text>
                <View className="space-y-2">
                  {(['lose_weight', 'maintain_weight', 'gain_weight'] as const).map((goal) => (
                    <TouchableOpacity
                      key={goal}
                      onPress={() => handleStatChange('health_goal', goal)}
                      className={`flex-row justify-between items-center p-3 border border-border-muted rounded-xl bg-white ${
                        profile?.health_goal === goal ? 'border-accent-sage bg-[#F3F6F3]' : ''
                      } ${isRtl ? 'flex-row-reverse' : ''}`}
                    >
                      <Text className={`text-xs font-inter-medium ${profile?.health_goal === goal ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
                        {goal === 'lose_weight' && (isRtl ? 'إنقاص الوزن' : 'Lose Weight')}
                        {goal === 'maintain_weight' && (isRtl ? 'المحافظة على الوزن' : 'Maintain Weight')}
                        {goal === 'gain_weight' && (isRtl ? 'زيادة الوزن' : 'Gain Weight')}
                      </Text>
                      {profile?.health_goal === goal && (
                        <Ionicons name="checkmark" size={16} color="#4C6E58" />
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
          className={`flex-row justify-between items-center p-4 border border-border-muted rounded-3xl bg-white mb-5 shadow-sm ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          <View className={`flex-row items-center flex-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Ionicons name="nutrition-outline" size={20} color="#4C6E58" style={isRtl ? { marginLeft: 10 } : { marginRight: 10 }} />
            <View className="flex-1">
              <Text className={`font-outfit-bold text-sm text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}>
                {isRtl ? 'التفضيلات الغذائية' : 'Dietary Preferences'}
              </Text>
              <Text className={`font-inter text-[10px] text-text-muted mt-0.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                {isRtl ? 'تعديل نوع الدايت، الأطعمة المستبعدة والمكونات المكروهة' : 'Edit diet type, exclusions, and disliked ingredients'}
              </Text>
            </View>
          </View>
          <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={20} color="#626A66" />
        </TouchableOpacity>

        {/* Section 4: Application Configurations (Language, Country priority) */}
        <View className="bg-white rounded-3xl border border-border-muted p-5 shadow-sm">
          <Text className={`text-sm font-outfit-bold text-text-primary mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t.appSettings}</Text>

          {/* Language Selection */}
          <View className="mb-4">
            <Text className={`text-xs font-outfit-semibold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t.langOpt}</Text>
            <View className={`flex-row bg-[#F0F2F0] p-1 rounded-xl ${isRtl ? 'flex-row-reverse' : ''}`}>
              <TouchableOpacity
                onPress={() => handleStatChange('language', 'ar')}
                className="flex-1 py-2.5 items-center rounded-lg"
                style={profile?.language === 'ar' ? styles.activeTab : null}
              >
                <Text className={`text-xs font-outfit-medium ${profile?.language === 'ar' ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
                  العربية
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleStatChange('language', 'en')}
                className="flex-1 py-2.5 items-center rounded-lg"
                style={profile?.language === 'en' ? styles.activeTab : null}
              >
                <Text className={`text-xs font-outfit-medium ${profile?.language === 'en' ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
                  English
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Country Selection */}
          <View>
            <Text className={`text-xs font-outfit-semibold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t.countryOpt}</Text>
            <View className={`flex-row bg-[#F0F2F0] p-1 rounded-xl ${isRtl ? 'flex-row-reverse' : ''}`}>
              <TouchableOpacity
                onPress={() => handleStatChange('country', 'EG')}
                className="flex-1 py-2.5 items-center rounded-lg"
                style={profile?.country === 'EG' ? styles.activeTab : null}
              >
                <Text className={`text-xs font-outfit-medium ${profile?.country === 'EG' ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
                  Egypt (مصر)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleStatChange('country', 'GB')}
                className="flex-1 py-2.5 items-center rounded-lg"
                style={profile?.country === 'GB' ? styles.activeTab : null}
              >
                <Text className={`text-xs font-outfit-medium ${profile?.country === 'GB' ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
                  UK (الملكة المتحدة)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Dietary Preferences Modal */}
      <Modal
        visible={showDietaryModal}
        animationType="slide"
        onRequestClose={() => setShowDietaryModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9F8' }}>
          {/* Modal Header */}
          <View className={`flex-row justify-between items-center px-5 py-4 bg-white border-b border-border-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
            <TouchableOpacity onPress={() => setShowDietaryModal(false)} className="p-1">
              <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={24} color="#1A1E1C" />
            </TouchableOpacity>
            <Text className="text-base font-outfit-bold text-text-primary">
              {isRtl ? 'التفضيلات الغذائية' : 'Dietary Preferences'}
            </Text>
            <View className="w-10" />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {/* Edit Name */}
            <View className="bg-white rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
              <Text className={`text-xs font-outfit-semibold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                {isRtl ? 'الاسم الشخصي' : 'Profile Name'}
              </Text>
              <TextInput
                className={`bg-white border border-border-muted rounded-xl px-3 py-2.5 font-inter text-sm text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}
                value={profile?.name || ''}
                placeholder={isRtl ? 'أدخل اسمك...' : 'Enter your name...'}
                onChangeText={(text) => handleStatChange('name', text)}
              />
            </View>

            {/* Edit Country */}
            <View className="bg-white rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
              <Text className={`text-xs font-outfit-semibold text-text-primary mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                {isRtl ? 'الدولة ذات الأولوية' : 'Country Priority'}
              </Text>
              <View className={`flex-row bg-[#F0F2F0] p-1 rounded-xl ${isRtl ? 'flex-row-reverse' : ''}`}>
                <TouchableOpacity
                  onPress={() => handleStatChange('country', 'EG')}
                  className="flex-1 py-2.5 items-center rounded-lg"
                  style={profile?.country === 'EG' ? styles.activeTab : null}
                >
                  <Text className={`text-xs font-outfit-medium ${profile?.country === 'EG' ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
                    {isRtl ? 'مصر (EG)' : 'Egypt (EG)'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleStatChange('country', 'GB')}
                  className="flex-1 py-2.5 items-center rounded-lg"
                  style={profile?.country === 'GB' ? styles.activeTab : null}
                >
                  <Text className={`text-xs font-outfit-medium ${profile?.country === 'GB' ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
                    {isRtl ? 'المملكة المتحدة (GB)' : 'United Kingdom (GB)'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Diet Type */}
            <View className="bg-white rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
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
                    className={`flex-row justify-between items-center p-3 border border-border-muted rounded-xl bg-white ${
                      profile?.diet_type === diet.id ? 'border-accent-sage bg-[#F3F6F3]' : ''
                    } ${isRtl ? 'flex-row-reverse' : ''}`}
                  >
                    <Text className={`text-xs font-inter-medium ${profile?.diet_type === diet.id ? 'text-text-primary font-outfit-bold' : 'text-text-muted'}`}>
                      {isRtl ? diet.label_ar : diet.label_en}
                    </Text>
                    {profile?.diet_type === diet.id && (
                      <Ionicons name="checkmark" size={16} color="#4C6E58" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Common Exclusions */}
            <View className="bg-white rounded-3xl border border-border-muted p-5 mb-5 shadow-sm">
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
                      className={`px-3 py-2 border rounded-full bg-white flex-row items-center gap-1 ${
                        isSelected ? 'border-accent-sage bg-[#F3F6F3]' : 'border-border-muted'
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
            <View className="bg-white rounded-3xl border border-border-muted p-5 shadow-sm">
              <Text className={`text-xs font-outfit-semibold text-text-primary mb-3 ${isRtl ? 'text-right' : 'text-left'}`}>
                {isRtl ? 'المكونات والأطعمة المستبعدة' : 'Disliked / Excluded Foods'}
              </Text>
              
              {/* Add Custom Ingredient Input */}
              <View className={`flex-row gap-2 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <TextInput
                  className={`flex-1 bg-white border border-border-muted rounded-xl px-3 py-2 font-inter text-xs text-text-primary ${isRtl ? 'text-right' : 'text-left'}`}
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
                      <Ionicons name="close-circle" size={14} color="#626A66" />
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
