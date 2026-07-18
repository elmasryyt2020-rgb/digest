export interface TermsSection {
  id: string;
  icon: string; // Ionicons name
  title_en: string;
  title_ar: string;
  paragraphs_en: string[];
  paragraphs_ar: string[];
  bullets_en?: string[];
  bullets_ar?: string[];
}

export const termsSections: TermsSection[] = [
  {
    id: "agreement",
    icon: "document-text-outline",
    title_en: "1. Agreement to Terms",
    title_ar: "١. الموافقة على الشروط",
    paragraphs_en: [
      "By downloading, installing, or using the digest mobile application, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the application.",
      "These terms govern your access to and use of digest, including any content, functionality, and services offered on or through the app."
    ],
    paragraphs_ar: [
      "بتحميلك أو تثبيتك أو استخدامك لتطبيق digest، فإنك توافق على الالتزام بشروط الخدمة هذه. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام التطبيق.",
      "تحكم هذه الشروط وصولك إلى تطبيق digest واستخدامه، بما في ذلك أي محتوى أو وظائف أو خدمات مقدمة في التطبيق أو من خلاله."
    ]
  },
  {
    id: "eligibility",
    icon: "person-outline",
    title_en: "2. Eligibility & Accounts",
    title_ar: "٢. الأهلية وإنشاء الحسابات",
    paragraphs_en: [
      "You must be at least 13 years of age to use this application. By using digest, you represent and warrant that you meet this age requirement.",
      "To log meals and track health stats, you must register an account using a valid email address. Account activation requires verification via a secure One-Time Password (OTP). You are responsible for safeguarding your password and account details."
    ],
    paragraphs_ar: [
      "يجب أن تكون في سن ١٣ عاماً على الأقل لاستخدام هذا التطبيق. باستخدامك لتطبيق digest، فإنك تقر وتضمن استيفاءك لشرط السن هذا.",
      "لتسجيل الوجبات وتتبع حالتك الصحية، يجب عليك تسجيل حساب باستخدام بريد إلكتروني صالح. يتطلب تفعيل الحساب التحقق عبر رمز تفعيل آمن لمرة واحدة (OTP). تتحمل المسؤولية الكاملة عن حماية كلمة المرور وتفاصيل حسابك."
    ]
  },
  {
    id: "medical-disclaimer",
    icon: "heart-outline",
    title_en: "3. Health & Medical Disclaimer",
    title_ar: "٣. إخلاء المسؤولية الصحية والطبية",
    paragraphs_en: [
      "digest is a self-tracking tool designed for educational, general dietary, and workout logging purposes. It is NOT a medical device, nor does it provide medical advice, diagnosis, or treatment.",
      "Calculations (such as daily calorie targets using the Mifflin-St Jeor formula or activity intensity via MET scores) are general estimations and should not replace professional medical advice.",
      "Always consult a qualified physician or healthcare provider before starting any new diet, nutrition plan, or exercise routine."
    ],
    paragraphs_ar: [
      "تطبيق digest هو أداة تتبع ذاتي مصممة لأغراض تعليمية، وتتبع النظام الغذائي العام والتمارين البدنية. هذا التطبيق ليس جهازاً طبياً، ولا يقدم استشارات طبية أو تشخيصاً أو علاجاً.",
      "تعتبر الحسابات التقديرية (مثل أهداف السعرات الحرارية اليومية باستخدام معادلة Mifflin-St Jeor أو شدة النشاط عبر نقاط MET) تقديرات عامة ولا ينبغي أن تحل محل الاستشارة الطبية المتخصصة.",
      "احرص دائماً على استشارة طبيب مؤهل أو مقدم رعاية صحية قبل البدء في أي نظام غذائي أو خطة تغذية أو برنامج تمارين رياضية جديد."
    ]
  },
  {
    id: "ai-disclaimer",
    icon: "sparkles-outline",
    title_en: "4. AI Features & Food Database",
    title_ar: "٤. ميزات الذكاء الاصطناعي وقاعدة بيانات الأغذية",
    paragraphs_en: [
      "Our AI Vision food recognition and dynamic Recipe Generator features are powered by Gemini. Bounding boxes and ingredient suggestions are for convenience and informational purposes only.",
      "Nutrient calculations are verified against offline/cached nutrition databases (like USDA or Open Food Facts). However, you must inspect all food items and generated recipes to verify ingredients, portion sizes, and potential allergens before consumption."
    ],
    paragraphs_ar: [
      "ميزات التعرف على الأطعمة بالذكاء الاصطناعي ومولد الوصفات الديناميكي تعمل بواسطة Gemini. تعد مربعات التحديد واقتراحات المكونات للتسهيل ولأغراض معلوماتية فقط.",
      "يتم التحقق من حسابات العناصر الغذائية بمقارنتها مع قواعد بيانات الأغذية الموثقة محلياً وسحابياً (مثل USDA أو Open Food Facts). ومع ذلك، يجب عليك فحص جميع الأطعمة والوصفات المقترحة للتأكد من المكونات وحجم الحصص ومسببات الحساسية المحتملة قبل تناولها."
    ]
  },
  {
    id: "free-model",
    icon: "gift-outline",
    title_en: "5. Pricing & Free Access",
    title_ar: "٥. الأسعار والوصول المجاني",
    paragraphs_en: [
      "digest is currently provided as a free application. No subscription fees or premium paywalls are active.",
      "We reserve the right to modify, suspend, or discontinue any part of the service, or introduce premium options in the future, with reasonable prior notice to users."
    ],
    paragraphs_ar: [
      "يتم تقديم تطبيق digest حالياً كتطبيق مجاني تماماً. لا توجد رسوم اشتراك أو بوابات دفع مفروضة.",
      "نحتفظ بالحق في تعديل أو تعليق أو إيقاف أي جزء من الخدمة، أو تقديم خيارات مدفوعة في المستقبل، مع إخطار المستخدمين بشكل مناسب قبل تفعيل ذلك."
    ]
  },
  {
    id: "liability",
    icon: "shield-outline",
    title_en: "6. Limitation of Liability",
    title_ar: "٦. حدود المسؤولية",
    paragraphs_en: [
      "To the maximum extent permitted by applicable law, digest and its developers shall not be liable for any health issues, injuries, allergic reactions, or data loss arising from your use of the application.",
      "You use the application and rely on its nutritional suggestions, recipes, and workout trackings entirely at your own risk."
    ],
    paragraphs_ar: [
      "إلى أقصى حد يسمح به القانون المعمول به، لا يتحمل تطبيق digest أو مطوروه المسؤولية عن أي مشاكل صحية أو إصابات أو تفاعلات حساسية أو فقدان للبيانات ينتج عن استخدامك للتطبيق.",
      "إنك تستخدم التطبيق وتعتمد على اقتراحاته الغذائية ووصفاته وتتبع التمارين على مسؤوليتك الخاصة بالكامل."
    ]
  },
  {
    id: "governing-law",
    icon: "briefcase-outline",
    title_en: "7. Governing Law",
    title_ar: "٧. القانون الواجب التطبيق",
    paragraphs_en: [
      "These Terms of Service and any disputes arising out of or related to your use of digest shall be governed by, construed, and enforced in accordance with the laws of Egypt, without regard to conflict of law principles."
    ],
    paragraphs_ar: [
      "تخضع شروط الخدمة هذه وأي نزاعات تنشأ عنها أو تتعلق باستخدامك لتطبيق digest وتُفسر وتُنفذ وفقاً لقوانين جمهورية مصر العربية، دون النظر إلى مبادئ تنازع القوانين."
    ]
  }
];
