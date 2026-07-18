# Privacy Policy Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a beautifully formatted, dynamically-translated Privacy Policy modal in the profile screen, drawing from Cronometer and Eat This Much legal frameworks adapted specifically for the digest app features (biometrics, nutrition logging, AI camera scanning, and Supabase data storage).

**Architecture:** We isolate the privacy policy text data inside a dedicated data file `data/privacyData.ts` to keep the profile component clean. In `app/(tabs)/profile.tsx`, we add a local modal state and render a clean, scrollable legal viewport displaying headers, icons, and paragraphs that dynamically adapt to the user's active language.

**Tech Stack:** React Native, Expo, TypeScript, Tailwind CSS (NativeWind), Ionicons.

---

### Task 1: Create the Privacy Policy Data File

**Files:**
- Create: `data/privacyData.ts`

- [ ] **Step 1: Create `data/privacyData.ts` and write the complete translated privacy policy text**

Create a new file [privacyData.ts](file:///d:/digest/data/privacyData.ts) containing the full content shown below:

```typescript
export interface PrivacySection {
  id: string;
  icon: string; // Ionicons name
  title_en: string;
  title_ar: string;
  paragraphs_en: string[];
  paragraphs_ar: string[];
  bullets_en?: string[];
  bullets_ar?: string[];
}

export const privacySections: PrivacySection[] = [
  {
    id: "introduction",
    icon: "shield-checkmark-outline",
    title_en: "1. Introduction & Scope",
    title_ar: "١. مقدمة ونطاق السياسة",
    paragraphs_en: [
      "Welcome to digest. We are committed to protecting your personal privacy and health data. This Privacy Policy explains how we collect, use, and process your information when you use our mobile application.",
      "By using digest, you agree to the collection and use of information in accordance with this policy. We do not sell or trade your personal health data to third parties."
    ],
    paragraphs_ar: [
      "مرحباً بك في تطبيق digest. نحن ملتزمون بحماية خصوصيتك الشخصية وبياناتك الصحية. توضح سياسة الخصوصية هذه كيفية جمع معلوماتك واستخدامها ومعالجتها عند استخدام تطبيقنا المحمول.",
      "باستخدامك لتطبيق digest، فإنك توافق على جمع المعلومات واستخدامها وفقاً لهذه السياسة. نحن لا نبيع أو نتاجر ببياناتك الصحية الشخصية مع أي أطراف ثالثة."
    ]
  },
  {
    id: "data-collection",
    icon: "person-add-outline",
    title_en: "2. Information We Collect",
    title_ar: "٢. المعلومات التي نجمعها",
    paragraphs_en: [
      "To provide accurate dietary recommendations and metabolic calculations, we collect and process the following information:"
    ],
    paragraphs_ar: [
      "لتقديم توصيات غذائية وحسابات تمثيل غذائي دقيقة، نقوم بجمع ومعالجة المعلومات التالية:"
    ],
    bullets_en: [
      "Account Information: First name, last name, and email address (capitalized and verified via secure email activation).",
      "Biometrics & Physical Stats: Height, weight, age, gender, and physical activity levels (used strictly to estimate metabolic rates using the Mifflin-St Jeor formula).",
      "Health Logs: Food logs, daily water intake logs, and workout/activity logs (using metabolic equivalent MET scores)."
    ],
    bullets_ar: [
      "معلومات الحساب: الاسم الأول، واسم العائلة، والبريد الإلكتروني (يتم التحقق منها وتفعيلها بأمان عبر رمز تفعيل).",
      "المقاييس الحيوية والبدنية: الطول، الوزن، العمر، الجنس، ومستويات النشاط البدني (تُستخدم حصرياً لتقدير معدلات الأيض باستخدام معادلة Mifflin-St Jeor).",
      "سجلات الصحة والنشاط: سجلات الأغذية والوجبات، سجلات شرب الماء اليومية، وسجلات التمارين البدنية (باستخدام درجات المكافئ الأيضي MET)."
    ]
  },
  {
    id: "ai-processing",
    icon: "eye-outline",
    title_en: "3. AI Scanning & Photo Processing",
    title_ar: "٣. الفحص الذكي ومعالجة الصور",
    paragraphs_en: [
      "Our app features an AI-based vision food recognition tool. If you grant camera and gallery permissions, the app will process images of your food items.",
      "Image processing is performed securely via private cloud AI services to detect bounding boxes and food names. Your raw photos are processed in memory and are not stored permanently. Once a food item is identified, nutrition information is queried from our verified, cached databases (such as the USDA database and Open Food Facts) instead of using arbitrary AI guesses."
    ],
    paragraphs_ar: [
      "يتميز تطبيقنا بأداة ذكاء اصطناعي للتعرف على الأطعمة من خلال الكاميرا. إذا منحت إذناً للوصول إلى الكاميرا ومعرض الصور، سيقوم التطبيق بمعالجة صور أطعمتك.",
      "تتم معالجة الصور بشكل آمن عبر خدمات الذكاء الاصطناعي السحابية الخاصة لتحديد الأطعمة ومربعات الإحاطة حولها. تتم معالجة صورك الخام في الذاكرة المؤقتة ولا يتم تخزينها بشكل دائم. بمجرد التعرف على الطعام، يتم استعلام البيانات الغذائية من قواعد بياناتنا الموثقة (مثل USDA وOpen Food Facts) بدلاً من الاعتماد على تخمينات عشوائية."
    ]
  },
  {
    id: "storage-security",
    icon: "cloud-upload-outline",
    title_en: "4. Storage, Retention & Third Parties",
    title_ar: "٤. التخزين، الاحتفاظ بالبيانات والأطراف الثالثة",
    paragraphs_en: [
      "Your authenticated account data, profile details, and health logs are stored securely using Supabase cloud infrastructure (Auth, Database, Storage, and Edge Functions).",
      "We cache your local trial state and offline logs locally on your device using AsyncStorage for performance. When you are online, these logs synchronize securely with your private account database on Supabase."
    ],
    paragraphs_ar: [
      "يتم تخزين بيانات حسابك الموثق، تفاصيل ملفك الشخصي، وسجلاتك الصحية بأمان باستخدام البنية التحتية السحابية لـ Supabase (المصادقة، قواعد البيانات، التخزين، والوظائف الطرفية).",
      "نقوم بحفظ حالة التطبيق التجريبية وسجلاتك المحلية مؤقتاً على جهازك باستخدام AsyncStorage لتحسين الأداء. عندما تكون متصلاً بالإنترنت، تتزامن هذه السجلات بأمان مع قاعدة بيانات حسابك الخاصة على Supabase."
    ]
  },
  {
    id: "user-rights",
    icon: "key-outline",
    title_en: "5. Your Rights & Data Deletion",
    title_ar: "٥. حقوقك وحذف البيانات",
    paragraphs_en: [
      "You retain complete ownership over your health and biometric data. You have the right to access, download, correct, or request permanent deletion of your account and all associated health logs at any time.",
      "For questions or to request complete data deletion, please visit our Help & FAQ section or contact support."
    ],
    paragraphs_ar: [
      "أنت تحتفظ بالملكية الكاملة لبياناتك الصحية والحيوية. لديك الحق في الوصول إلى بياناتك، تحميلها، تصحيحها، أو طلب الحذف الكامل والدائم لحسابك وجميع السجلات الصحية المرتبطة به في أي وقت.",
      "للاستفسارات أو لطلب حذف البيانات بالكامل، يرجى زيارة قسم المساعدة والأسئلة الشائعة أو التواصل مع الدعم الفني."
    ]
  }
];
```

- [ ] **Step 2: Verify compilation and type correctness**

Run the TypeScript typechecker to ensure the newly created file compiles without issues.
Run command: `npx tsc --noEmit`
Expected Output: Command exits successfully with no errors in the newly created file.

- [ ] **Step 3: Commit the new data file**

Run commands:
```bash
git add data/privacyData.ts
git commit -m "feat: add structured privacy policy data with bilingual translations"
```

---

### Task 2: Implement Privacy Policy Modal in Profile Tab

**Files:**
- Modify: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Import data and set up modal state**

Modify [profile.tsx](file:///d:/digest/app/(tabs)/profile.tsx).
Near the top of the file, import `privacySections`:
```typescript
import { privacySections } from '@/data/privacyData';
```

Inside the `ProfileScreen` component, add a new state hook for the privacy modal near `showFaqModal` (around line 198):
```typescript
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
```

- [ ] **Step 2: Update Privacy Policy trigger**

In the "Support & Legal Card" section of the UI (around line 937), replace the existing `TouchableOpacity` for the Privacy Policy row:
```typescript
            {/* Privacy Policy */}
            <TouchableOpacity 
              onPress={() => setShowPrivacyModal(true)} 
              className={`flex-row justify-between items-center py-3.5 ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Ionicons name="lock-closed-outline" size={18} color="#626A66" style={isRtl ? { marginLeft: 8 } : { marginRight: 8 }} />
                <Text className="text-xs font-outfit-semibold text-text-primary">{t.privacyPolicy}</Text>
              </View>
              <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={16} color="#9CA19E" />
            </TouchableOpacity>
```

- [ ] **Step 3: Implement the Privacy Policy Modal JSX**

Add the Modal JSX at the bottom of the component (right next to the FAQ modal implementation, around line 1350-1360):

```tsx
      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9F8' }}>
          {/* Modal Header */}
          <View className={`flex-row justify-between items-center px-5 py-4 bg-white border-b border-border-muted ${isRtl ? 'flex-row-reverse' : ''}`}>
            <TouchableOpacity onPress={() => setShowPrivacyModal(false)} className="p-1">
              <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={24} color="#1A1E1C" />
            </TouchableOpacity>
            <Text className="text-base font-outfit-bold text-text-primary">{t.privacyPolicy}</Text>
            <View className="w-10" />
          </View>

          {/* Privacy Policy Content */}
          <ScrollView 
            contentContainerStyle={{ padding: 20, paddingBottom: 60 }} 
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-y-6">
              {privacySections.map((section) => (
                <View 
                  key={section.id} 
                  className="bg-white rounded-3xl border border-border-muted p-5 shadow-sm"
                >
                  {/* Section Title with Icon */}
                  <View className={`flex-row items-center mb-3.5 gap-x-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <Ionicons name={section.icon as any} size={20} color="#4A5E53" />
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
                    <View className="mt-3.5 gap-y-2 border-t border-[#F0F2F0] pt-3.5">
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
```

- [ ] **Step 4: Verify typecheck and check for lint issues**

Run: `npm run typecheck`
Expected Output: Compiles successfully without type errors.
Run: `npm run lint` (if configured in `package.json`) to confirm no linting alerts are triggered.

- [ ] **Step 5: Commit changes**

Run commands:
```bash
git add app/\(tabs\)/profile.tsx
git commit -m "feat: integrate privacy policy modal with full translation support"
```
