export interface FAQItem {
  q_en: string;
  q_ar: string;
  a_en: string;
  a_ar: string;
}

export interface FAQCategory {
  category_en: string;
  category_ar: string;
  icon: string; // Ionicons name
  items: FAQItem[];
}

export const faqCategories: FAQCategory[] = [
  {
    category_en: "AI Features & Camera",
    category_ar: "الذكاء الاصطناعي والمسح",
    icon: "hardware-chip-outline",
    items: [
      {
        q_en: "How does the AI Vision Camera identify food?",
        q_ar: "كيف تحدد كاميرا الذكاء الاصطناعي نوع الطعام؟",
        a_en: "Our AI Vision scanner uses Gemini 3.5 Flash to detect the food items in your photo and identify their bounding box coordinates. Once identified, digest queries our verified food cache database (such as USDA and Open Food Facts) to fetch precise, verified nutritional data instead of relying on AI guesses.",
        a_ar: "يستخدم ماسح الكاميرا الذكي نموذج Gemini 3.5 Flash لتحديد الأطعمة في صورتك ورسم مربعات الإحاطة حولها. بمجرد تحديدها، يقوم تطبيقنا بالاستعلام من قاعدة بيانات الأغذية الموثقة لدينا (مثل USDA وOpen Food Facts) لجلب معلومات غذائية دقيقة وموثقة بدلاً من الاعتماد على تخمينات الذكاء الاصطناعي."
      },
      {
        q_en: "How does the Natural Language meal logging work?",
        q_ar: "كيف يعمل تسجيل الوجبات باللغة الطبيعية؟",
        a_en: "You can type or speak what you ate in plain English or Arabic (e.g., 'I had two fried eggs and local Egyptian bread for breakfast' or 'تناولت بيضتين مسلوقتين ونصف رغيف بلدي'). Our AI understands multi-lingual natural language, breaks down the ingredients, estimates their weights, and logs them instantly.",
        a_ar: "يمكنك كتابة أو التحدث عما أكلته باللغة العربية أو الإنجليزية بعبارات بسيطة (مثل 'تناولت بيضتين مسلوقتين ونصف رغيف بلدي'). يفهم الذكاء الاصطناعي لدينا اللغة الطبيعية متعددة اللغات، ويقوم بتحليل المكونات وتقدير أوزانها وتسجيلها فوراً."
      },
      {
        q_en: "How does the AI Refrigerator recipe generator work?",
        q_ar: "كيف يعمل مولد الوصفات الذكي من الثلاجة؟",
        a_en: "Go to the AI Recipes tab, enter the ingredients currently in your refrigerator, and click generate. The AI will design a custom healthy recipe using only what you have, calculate its total macros, and provide step-by-step instructions in your selected app language (Arabic or English).",
        a_ar: "انتقل إلى علامة تبويب 'الوصفات الذكية'، وأدخل المكونات المتوفرة حالياً في ثلاجتك، واضغط على توليد. سيقوم الذكاء الاصطناعي بابتكار وصفة صحية مخصصة باستخدام ما لديك فقط، وحساب السعرات والمغذيات الكبرى وتوفير خطوات التحضير باللغة التي تختارها."
      }
    ]
  },
  {
    category_en: "Nutrition & Goals",
    category_ar: "التغذية والأهداف الصحّية",
    icon: "nutrition-outline",
    items: [
      {
        q_en: "How is my daily calorie target calculated?",
        q_ar: "كيف يتم حساب السعرات الحرارية اليومية المستهدفة؟",
        a_en: "We use the Mifflin-St Jeor equation to estimate your Resting Metabolic Rate (BMR) based on your gender, age, weight, and height. We then multiply it by your activity level factor and add/subtract calories based on your health goal (e.g., losing weight subtracts a moderate calorie deficit).",
        a_ar: "نستخدم معادلة Mifflin-St Jeor لتقدير معدل الأيض الأساسي (BMR) بناءً على جنسك وعمرك ووزنك وطولك. ثم نضربه في معامل مستوى نشاطك ونضيف أو نطرح سعرات حرارية بناءً على هدفك الصحي (على سبيل المثال، إنقاص الوزن يطرح عجزاً معتدلاً في السعرات)."
      },
      {
        q_en: "How can I customize my macronutrient (macro) split?",
        q_ar: "كيف يمكنني تخصيص نسب المغذيات الكبرى الخاصة بي؟",
        a_en: "In your Profile Settings, open the 'Adjust Macro Ratios' modal. You can choose from presets like Balanced (40% Carbs, 30% Protein, 30% Fats), High Protein, Low Carb/Keto, or set custom percentages that sum up to exactly 100%.",
        a_ar: "في إعدادات الملف الشخصي، افتح نافذة 'تعديل نسب المغذيات الكبرى'. يمكنك الاختيار من بين الإعدادات المسبقة مثل المتوازن (٤٠٪ كربوهيدرات، ٣٠٪ بروتين، ٣٠٪ دهون)، أو عالي البروتين، أو منخفض الكربوهيدرات/كيتو، أو تحديد نسب مخصصة يجب أن يكون مجموعها ١٠٠٪ تماماً."
      }
    ]
  },
  {
    category_en: "Meal Planning",
    category_ar: "تخطيط الوجبات",
    icon: "calendar-outline",
    items: [
      {
        q_en: "Can I customize my country recipe recommendations?",
        q_ar: "هل يمكنني تخصيص توصيات الوصفات حسب البلد؟",
        a_en: "Yes! Under 'App Settings' in your Profile, you can toggle the Country Priority between Egypt (EG) and the United Kingdom (GB). This customizes your recipes feed to prioritize localized ingredients, traditional dishes (like Egyptian Ful or UK porridge), and local food databases.",
        a_ar: "نعم! ضمن 'إعدادات التطبيق' في ملفك الشخصي، يمكنك تبديل أولوية الدولة بين مصر (EG) والمملكة المتحدة (GB). سيقوم هذا بتخصيص خلاصة الوصفات لتفضيل المكونات المحلية والأطباق التقليدية (مثل الفول المدمس المصري أو العصيدة البريطانية) وقواعد البيانات المحلية."
      },
      {
        q_en: "How does the interactive 'Swap Meal' feature work?",
        q_ar: "كيف تعمل ميزة 'تبديل الوجبة' التفاعلية؟",
        a_en: "In your meal plan or onboarding suggestions page, if you don't like a recommended meal, simply click the 'Swap' icon. The app will suggest alternative options that match your current calorie and macronutrient targets so you stay on track.",
        a_ar: "في خطة الوجبات أو صفحة مقترحات الوجبات بعد التهيئة، إذا لم تعجبك وجبة موصى بها، ما عليك سوى النقر على أيقونة 'تبديل'. سيقترح التطبيق خيارات بديلة تطابق سعراتك الحرارية ونسب المغذيات المستهدفة تماماً لتبقيك على المسار الصحيح."
      }
    ]
  },
  {
    category_en: "Workouts & Water",
    category_ar: "التمارين الرياضية والماء",
    icon: "fitness-outline",
    items: [
      {
        q_en: "How does the MET activity tracker calculate calorie burn?",
        q_ar: "كيف يحسب متتبع الأنشطة MET حرق السعرات؟",
        a_en: "We use MET (Metabolic Equivalent of Task) values for standard physical activities. The formula is: Calories Burned = MET value × Weight (in kg) × Duration (in hours). This provides an accurate estimate adjusted for your personal body weight.",
        a_ar: "نستخدم قيم MET (المكافئ الأيضي للمهمة) للأنشطة البدنية القياسية. الصيغة هي: السعرات المحروقة = قيمة MET × الوزن (بالكجم) × المدة (بالساعات). هذا يوفر تقديراً دقيقاً مناسباً لوزن جسمك الشخصي."
      },
      {
        q_en: "How is my water intake target calculated?",
        q_ar: "كيف يتم حساب الهدف اليومي لشرب الماء؟",
        a_en: "Your daily hydration target is calculated based on 35 milliliters of water per kilogram of body weight. You can toggle your preferred measurement unit between milliliters (ml) and fluid ounces (fl oz) in your profile.",
        a_ar: "يتم حساب هدف شرب الماء اليومي بناءً على ٣٥ ملليلتر من الماء لكل كيلوغرام من وزن الجسم. يمكنك تبديل وحدة القياس المفضلة لديك بين الملليلتر (ml) والأونصة السائلة (fl oz) في ملفك الشخصي."
      }
    ]
  },
  {
    category_en: "Account & Security",
    category_ar: "الحساب والأمان",
    icon: "shield-checkmark-outline",
    items: [
      {
        q_en: "How can I export my weekly health summary?",
        q_ar: "كيف يمكنني تصدير التقرير الصحي الأسبوعي؟",
        a_en: "Click the 'Export PDF Report' button inside your Profile screen. The app uses serverless edge functions to compile your daily macro/micro nutrients charts, workout summary, and a consolidated shopping grocery list into a premium downloadable PDF document.",
        a_ar: "اضغط على زر 'تصدير تقرير PDF' داخل شاشة الملف الشخصي. يقوم التطبيق باستخدام وظائف السيرفر الفرعية لتجميع مخططات المغذيات الكبرى والدقيقة اليومية، وملخص التمارين، وقائمة تسوق البقالة الموحدة في ملف PDF فاخر قابل للتحميل."
      },
      {
        q_en: "Why do I need to verify my email with a One-Time Password (OTP)?",
        q_ar: "لماذا أحتاج إلى تفعيل بريدي الإلكتروني برمز OTP؟",
        a_en: "To protect your private health data and sync your logs securely to the cloud, digest uses Supabase Authentication. When you register, we require a verification OTP code sent to your email to activate your account before diary entries can be added.",
        a_ar: "لحماية بياناتك الصحية الخاصة ومزامنة سجلاتك بأمان مع السحابة، يستخدم تطبيق digest نظام مصادقة Supabase. عند التسجيل، نطلب منك إدخال رمز التحقق (OTP) المرسل إلى بريدك الإلكتروني لتنشيط حسابك قبل البدء في إضافة السجلات."
      },
      {
        q_en: "What happens if I clear my local cache or delete my account?",
        q_ar: "ماذا يحدث إذا قمت بمسح الذاكرة المؤقتة أو حذف الحساب؟",
        a_en: "Clearing your cache deletes all offline trial cache logs from your device storage. Deleting your account permanently deletes all user profile settings, databases, and logged history on the Supabase database. This action is destructive and cannot be undone.",
        a_ar: "يؤدي مسح الذاكرة المؤقتة إلى حذف جميع السجلات والبيانات المحفوظة محلياً على جهازك. أما حذف الحساب نهائياً فيقوم بمسح كافة إعدادات ملفك الشخصي وسجلاتك وتاريخك بالكامل من قواعد بيانات Supabase بشكل دائم. هذا الإجراء نهائي ولا يمكن التراجع عنه."
      }
    ]
  }
];
