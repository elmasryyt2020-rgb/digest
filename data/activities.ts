export interface ActivityType {
  id: string;
  name_en: string;
  name_ar: string;
  met: number; // Metabolic Equivalent of Task
  category: 'cardio' | 'strength' | 'flexibility' | 'recreational';
}

export const activities: ActivityType[] = [
  {
    id: 'running_moderate',
    name_en: 'Running (Moderate Pace - 8 km/h)',
    name_ar: 'الجري (سرعة معتدلة - 8 كم/ساعة)',
    met: 8.3,
    category: 'cardio',
  },
  {
    id: 'running_fast',
    name_en: 'Running (Fast Pace - 12 km/h)',
    name_ar: 'الجري (سرعة عالية - 12 كم/ساعة)',
    met: 11.5,
    category: 'cardio',
  },
  {
    id: 'walking_brisk',
    name_en: 'Walking (Brisk Pace - 5 km/h)',
    name_ar: 'المشي (سرعة نشطة - 5 كم/ساعة)',
    met: 3.5,
    category: 'cardio',
  },
  {
    id: 'walking_stroll',
    name_en: 'Walking (Casual Stroll)',
    name_ar: 'المشي (نزهة خفيفة)',
    met: 2.5,
    category: 'cardio',
  },
  {
    id: 'cycling_moderate',
    name_en: 'Cycling (Moderate - 16-19 km/h)',
    name_ar: 'ركوب الدراجة (معتدل - 16-19 كم/ساعة)',
    met: 6.8,
    category: 'cardio',
  },
  {
    id: 'swimming_light',
    name_en: 'Swimming (Light / Leisure)',
    name_ar: 'السباحة (خفيفة / ترفيهية)',
    met: 6.0,
    category: 'cardio',
  },
  {
    id: 'swimming_vigorous',
    name_en: 'Swimming (Vigorous Laps)',
    name_ar: 'السباحة (تدريب قوي)',
    met: 9.8,
    category: 'cardio',
  },
  {
    id: 'strength_general',
    name_en: 'Weight Lifting / General Strength Training',
    name_ar: 'رفع الأثقال / تمارين القوة العامة',
    met: 3.5,
    category: 'strength',
  },
  {
    id: 'strength_vigorous',
    name_en: 'Vigorous Weight / Crossfit Training',
    name_ar: 'تمارين القوة الشديدة / الكروس فت',
    met: 6.0,
    category: 'strength',
  },
  {
    id: 'yoga',
    name_en: 'Yoga / Stretching',
    name_ar: 'اليوغا / تمارين الإطالة',
    met: 2.5,
    category: 'flexibility',
  },
  {
    id: 'football',
    name_en: 'Football / Soccer (Match Play)',
    name_ar: 'كرة القدم (مباراة)',
    met: 7.0,
    category: 'recreational',
  },
  {
    id: 'basketball',
    name_en: 'Basketball (Game Play)',
    name_ar: 'كرة السلة (مباراة)',
    met: 8.0,
    category: 'recreational',
  },
];
