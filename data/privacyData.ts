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
