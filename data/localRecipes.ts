export interface IngredientItem {
  name_en: string;
  name_ar: string;
  weight_g: number;
}

export interface RecipeType {
  id: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  ingredients: IngredientItem[];
  steps_en: string[];
  steps_ar: string[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  image_url: string;
  country_origin: 'EG' | 'GB' | 'GLOBAL';
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  tags: string[];
}

export const localRecipes: RecipeType[] = [
  // EGYPT RECIPES
  {
    id: 'eg_ful_medames',
    title_en: 'Traditional Egyptian Ful Medames',
    title_ar: 'فول مدمس مصري تقليدي',
    description_en: 'A classic Egyptian breakfast staple of slow-cooked fava beans, olive oil, lemon, garlic, and cumin. High fiber, low fat, and fully plant-based.',
    description_ar: 'وجبة الفطور المصرية التقليدية المكونة من الفول المطهو ببطء مع زيت الزيتون، الليمون، الثوم والكمون. غني بالألياف وقليل الدهون ونباتي بالكامل.',
    ingredients: [
      { name_en: 'Cooked fava beans', name_ar: 'فول مدمس مطبوخ', weight_g: 200 },
      { name_en: 'Olive oil', name_ar: 'زيت زيتون', weight_g: 10 },
      { name_en: 'Lemon juice', name_ar: 'عصير ليمون', weight_g: 15 },
      { name_en: 'Garlic cloves', name_ar: 'فصوص ثوم', weight_g: 5 },
      { name_en: 'Cumin and spices', name_ar: 'كمون وتوابل', weight_g: 3 },
      { name_en: 'Tomatoes', name_ar: 'طماطم', weight_g: 50 },
    ],
    steps_en: [
      'Warm the pre-cooked fava beans in a small pot with a splash of water.',
      'Mash some of the beans using a fork or jar base to get a creamy texture.',
      'Mix in crushed garlic, lemon juice, cumin, and salt.',
      'Pour into a serving dish, drizzle with high-quality olive oil, and garnish with chopped fresh tomatoes and parsley.',
      'Serve warm alongside whole wheat pita bread.'
    ],
    steps_ar: [
      'سخن الفول المدمس في قدر صغير مع القليل من الماء.',
      'اهرس جزءاً من الفول باستخدام شوكة للحصول على قوام كريمي.',
      'أضف الثوم المهروس، عصير الليمون، الكمون والملح واخلط جيداً.',
      'اصكب الفول في طبق التقديم، ورش عليه زيت زيتون نقي، وزينه بالطماطم المفرومة والبقدونس.',
      'يقدم دافئاً بجانب الخبز البلدي.'
    ],
    total_calories: 340,
    total_protein_g: 14,
    total_carbs_g: 38,
    total_fat_g: 13,
    image_url: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=600&q=80',
    country_origin: 'EG',
    category: 'breakfast',
    tags: ['High Fiber', 'Vegan', 'Low Fat', 'Traditional'],
  },
  {
    id: 'eg_shakshuka',
    title_en: 'Spicy Egyptian Shakshuka',
    title_ar: 'شكشوكة مصرية حارة',
    description_en: 'Poached eggs nestled in a savory, spiced tomato and pepper stew. Packed with fresh herbs, onions, and cumin. High protein and low carb.',
    description_ar: 'بيض عيون مطهو داخل صلصة طماطم مسبكة ومتبلة بالفلفل الحلو والحار، البصل والكمون. طبق غني بالبروتين وقليل الكربوهيدرات.',
    ingredients: [
      { name_en: 'Eggs', name_ar: 'بيض طازج', weight_g: 100 }, // 2 large eggs
      { name_en: 'Tomatoes', name_ar: 'طماطم مفرومة', weight_g: 150 },
      { name_en: 'Bell pepper', name_ar: 'فلفل رومي', weight_g: 50 },
      { name_en: 'Onion', name_ar: 'بصل مفروم', weight_g: 40 },
      { name_en: 'Olive oil', name_ar: 'زيت زيتون', weight_g: 8 },
      { name_en: 'Coriander & Cumin', name_ar: 'كزبرة وكمون', weight_g: 3 },
    ],
    steps_en: [
      'Heat olive oil in a skillet and sauté chopped onions and peppers until soft.',
      'Add minced garlic and tomatoes, cooking down until a thick sauce forms (about 8 minutes).',
      'Stir in cumin, paprika, salt, and pepper.',
      'Create small wells in the sauce and crack the eggs directly into them.',
      'Cover the pan and cook on low heat until egg whites are set but yolks remain runny.',
      'Garnish with fresh coriander and serve immediately.'
    ],
    steps_ar: [
      'سخن زيت الزيتون في مقلاة وشوح البصل والفلفل المفروم حتى يذبل.',
      'أضف الثوم المفروم والطماطم، واتركها تتسبك حتى تتكون صلصة سميكة (حوالي 8 دقائق).',
      'أضف الكمون، البابريكا، الملح والفلفل الأسود.',
      'اصنع فجوات صغيرة في الصلصة واكسر البيض مباشرة داخلها.',
      'غطّ المقلاة واتركها على نار هادئة حتى ينضج بياض البيض مع بقاء الصفار سائلاً.',
      'زين الطبق بالكزبرة الطازجة وقدمه فوراً.'
    ],
    total_calories: 290,
    total_protein_g: 16,
    total_carbs_g: 12,
    total_fat_g: 18,
    image_url: 'https://images.unsplash.com/photo-1590412200988-a436bb705300?auto=format&fit=crop&w=600&q=80',
    country_origin: 'EG',
    category: 'breakfast',
    tags: ['High Protein', 'Low Carb', 'Keto-Friendly'],
  },
  {
    id: 'eg_koshary',
    title_en: 'Egyptian Koshary Balance Bowl',
    title_ar: 'كشري مصري متوازن',
    description_en: 'Egypt’s national street food. A robust carb-loading fuel mix of lentils, rice, macaroni, spicy tomato sauce, chickpeas, and crispy onions. Perfect for post-workout energy.',
    description_ar: 'طبق الشعب المصري الأول. وجبة متكاملة لشحن الطاقة مكونة من العدس بجبة، الأرز، المعكرونة، صلصة الطماطم الحارة، الحمص والبصل المقرمش. مثالي بعد التمارين الشاقة.',
    ingredients: [
      { name_en: 'Brown lentils', name_ar: 'عدس بني (بجبة)', weight_g: 80 },
      { name_en: 'White rice', name_ar: 'أرز أبيض مطبوخ', weight_g: 80 },
      { name_en: 'Macaroni', name_ar: 'معكرونة مسلوقة', weight_g: 60 },
      { name_en: 'Tomato sauce', name_ar: 'صلصة طماطم بالخل', weight_g: 50 },
      { name_en: 'Chickpeas', name_ar: 'حمص مسلوق', weight_g: 30 },
      { name_en: 'Crispy fried onions', name_ar: 'بصل محمر (ورد)', weight_g: 15 },
    ],
    steps_en: [
      'Boil macaroni and set aside. Cook lentils and rice separately.',
      'Prepare the tomato sauce by simmering tomato paste, garlic, vinegar, and cumin.',
      'Layer the bowl: start with macaroni, add white rice, then top with boiled brown lentils.',
      'Pour the garlic-vinegar tomato sauce over the layers.',
      'Garnish with boiled chickpeas and crispy golden fried onions.',
      'Add lemon garlic "Dakka" sauce and chili oil to taste.'
    ],
    steps_ar: [
      'اسلق المعكرونة وصفيها. اطبخ الأرز والعدس البني بشكل منفصل.',
      'حضّر صلصة الطماطم عن طريق تشويح الثوم مع الخل وعصير الطماطم والكمون.',
      'رتب الطبق: ابدأ بطبقة المعكرونة، ثم الأرز، ثم ضع فوقهما العدس البني المسلوق.',
      'وزّع صلصة الطماطم المسبكة بالخل والثوم على السطح.',
      'زيّن الطبق بالحمص المسلوق والبصل الذهبي المقرمش.',
      'أضف الدقة والشطة حسب الرغبة.'
    ],
    total_calories: 580,
    total_protein_g: 19,
    total_carbs_g: 98,
    total_fat_g: 9,
    image_url: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=600&q=80',
    country_origin: 'EG',
    category: 'lunch',
    tags: ['High Carb', 'Vegan', 'Post-Workout', 'Energy Boost'],
  },
  {
    id: 'eg_molokhia',
    title_en: 'Molokhia Soup with Grilled Chicken',
    title_ar: 'ملوخية مصرية مع دجاج مشوي',
    description_en: 'Finely minced jute leaf soup simmered in rich chicken broth, garlic, and coriander "Ta\'leya", served with a lean grilled chicken breast. Pure clean eating.',
    description_ar: 'حساء الملوخية المخروطة المطهوة في مرقة الدجاج الغنية بطشة الثوم والكزبرة الجافة، تقدم مع صدر دجاج مشوي قليل الدهون. خيار مثالي للأكل الصحي.',
    ingredients: [
      { name_en: 'Minced Molokhia leaves', name_ar: 'أوراق ملوخية مخروطة', weight_g: 150 },
      { name_en: 'Grilled chicken breast', name_ar: 'صدر دجاج مشوي', weight_g: 150 },
      { name_en: 'Chicken broth (low sodium)', name_ar: 'شوربة دجاج خفيفة', weight_g: 200 },
      { name_en: 'Garlic cloves', name_ar: 'ثوم مفروم', weight_g: 10 },
      { name_en: 'Ghee or butter', name_ar: 'سمن بلدي أو زبدة', weight_g: 5 },
      { name_en: 'Dry coriander', name_ar: 'كزبرة جافة', weight_g: 5 },
    ],
    steps_en: [
      'Bring low-sodium chicken broth to a gentle simmer in a pot.',
      'Stir in the minced fresh Molokhia leaves and whisk to remove any lumps. Do not cover the pot.',
      'In a separate small pan, heat ghee and fry minced garlic and dry coriander until golden brown (the "Ta\'leya").',
      'Pour the hot garlic mixture into the Molokhia soup (and perform the traditional Egyptian "gasp"!).',
      'Grill the seasoned chicken breast in a skillet until fully cooked.',
      'Serve the hot Molokhia soup in a bowl next to the grilled chicken breast.'
    ],
    steps_ar: [
      'سخن مرقة الدجاج في قدر على نار متوسطة حتى تبدأ في الغليان.',
      'أضف الملوخية المخروطة وحرك جيداً بمضرب سلك لتفادي التكتلات. لا تغطّ القدر.',
      'في مقلاة صغيرة، سخن السمن وحمر الثوم والكزبرة الجافة حتى يصبح اللون ذهبياً (الطشة).',
      'اصكب الطشة الساخنة فوق قدر الملوخية مباشرة (مع الشهقة المصرية التقليدية!).',
      'اشوِ صدر الدجاج المتبل في مقلاة غير لاصقة حتى تمام النضج.',
      'قدم حساء الملوخية الساخن في زبدية بجانب صدر الدجاج المشوي.'
    ],
    total_calories: 380,
    total_protein_g: 39,
    total_carbs_g: 10,
    total_fat_g: 18,
    image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80',
    country_origin: 'EG',
    category: 'dinner',
    tags: ['High Protein', 'Clean Eating', 'Low Carb', 'Traditional'],
  },

  // UK RECIPES
  {
    id: 'gb_beans_toast',
    title_en: 'British Baked Beans on Toast',
    title_ar: 'فاصوليا مطبوخة على التوست الإنجليزي',
    description_en: 'Comforting, protein-rich haricot beans in a rich tomato sauce, served over thick slices of toasted whole wheat bread. A true British staple.',
    description_ar: 'وجبة مريحة وغنية بالبروتين مكونة من الفاصوليا المطبوخة في صلصة الطماطم، تقدم فوق شرائح التوست الأسمر المحمص. فطور بريطاني كلاسيكي.',
    ingredients: [
      { name_en: 'Canned baked beans', name_ar: 'فاصوليا مطبوخة معلبة', weight_g: 200 },
      { name_en: 'Whole wheat bread', name_ar: 'توست أسمر كامل الحبة', weight_g: 60 }, // 2 slices
      { name_en: 'Butter (low fat)', name_ar: 'زبدة قليلة الدسم', weight_g: 5 },
      { name_en: 'Cheddar cheese (grated)', name_ar: 'جبن شيدر مبشور', weight_g: 10 },
    ],
    steps_en: [
      'Heat the baked beans in a small saucepan over medium heat until hot, stirring occasionally.',
      'Toast the slices of whole wheat bread in a toaster until golden-brown.',
      'Lightly butter the warm toast.',
      'Pour the hot baked beans generously over the toast.',
      'Sprinkle with a small amount of grated cheddar cheese and a pinch of black pepper, then serve warm.'
    ],
    steps_ar: [
      'سخن الفاصوليا المطبوخة في قدر صغير على نار متوسطة مع التقليب المستمر.',
      'حمص شرائح خبز التوست الأسمر في المحمصة حتى تصبح ذهبية ومقرمشة.',
      'ادهن التوست الساخن بمسحة خفيفة من الزبدة.',
      'اصكب الفاصوليا المطبوخة الساخنة بسخاء فوق التوست.',
      'رش القليل من جبن الشيدر المبشور والفلفل الأسود، وقدمها فوراً دافئة.'
    ],
    total_calories: 390,
    total_protein_g: 17,
    total_carbs_g: 58,
    total_fat_g: 9,
    image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80',
    country_origin: 'GB',
    category: 'breakfast',
    tags: ['High Fiber', 'Comfort Food', 'Vegetarian', 'Quick Meal'],
  },
  {
    id: 'gb_shepherds_pie',
    title_en: 'Lean Shepherds Pie',
    title_ar: 'فطيرة الراعي الصحية',
    description_en: 'A healthy twist on the traditional British pie. Lean minced lamb and vegetables simmered in gravy, topped with a creamy mashed potato crust.',
    description_ar: 'نسخة صحية من الفطيرة البريطانية التقليدية. لحم غنم مفروم قليل الدسم مطهو مع الخضار، ومغطى بطبقة من البطاطس المهروسة الكريمية.',
    ingredients: [
      { name_en: 'Lean minced lamb', name_ar: 'لحم غنم مفروم قليل الدسم', weight_g: 150 },
      { name_en: 'Potatoes (for mashing)', name_ar: 'بطاطس مسلوقة ومهروسة', weight_g: 150 },
      { name_en: 'Peas and Carrots', name_ar: 'بسلة وجزر مفروم', weight_g: 80 },
      { name_en: 'Beef broth (low sodium)', name_ar: 'مرقة لحم خفيفة', weight_g: 100 },
      { name_en: 'Olive oil', name_ar: 'زيت زيتون', weight_g: 5 },
      { name_en: 'Skimmed milk', name_ar: 'حليب خالي الدسم', weight_g: 20 },
    ],
    steps_en: [
      'Boil potatoes in salted water until tender, then mash with skimmed milk, salt, and pepper.',
      'Heat olive oil in a skillet. Sauté onions, carrots, and peas with minced lamb until meat is browned.',
      'Stir in tomato paste and beef broth. Simmer for 10 minutes until the gravy thickens.',
      'Transfer the meat filling to a baking dish.',
      'Spread the mashed potatoes evenly over the meat, roughing up the surface with a fork.',
      'Bake at 200°C (390°F) for 20-25 minutes until the top is golden-brown and bubbling.'
    ],
    steps_ar: [
      'اسلق البطاطس في ماء مملح حتى تنضج، ثم اهرسها مع الحليب خالي الدسم والملح والفلفل الأسود.',
      'سخن زيت الزيتون في مقلاة، وشوح البصل والجزر والبسلة مع اللحم المفروم حتى يتغير لونه.',
      'أضف معجون الطماطم ومرقة اللحم، واتركها تغلي ببطء لـ 10 دقائق حتى تتكثف الصلصة.',
      'انقل خليط اللحم والخضار إلى طبق مخصص للفرن.',
      'افرد البطاطس المهروسة بالتساوي فوق اللحم، وزين السطح بالشوكة.',
      'تُخبز في الفرن عند درجة حرارة 200 مئوية لمدة 20-25 دقيقة حتى يكتسب السطح لوناً ذهبياً.'
    ],
    total_calories: 460,
    total_protein_g: 32,
    total_carbs_g: 38,
    total_fat_g: 16,
    image_url: 'https://images.unsplash.com/photo-1629115913427-e5223ad07e99?auto=format&fit=crop&w=600&q=80',
    country_origin: 'GB',
    category: 'lunch',
    tags: ['Balanced Macro', 'Comfort Food', 'High Protein'],
  },
  {
    id: 'gb_porridge_berries',
    title_en: 'Warm Oat Porridge with Berries',
    title_ar: 'عصيدة شوفان دافئة بالتوت',
    description_en: 'Creamy rolled oats simmered in almond milk, topped with antioxidant-rich fresh blueberries, raspberries, and a drizzle of honey. Low GI.',
    description_ar: 'شوفان كريمي مطهو في حليب اللوز، مزين بالتوت البري الطازج الغني بمضادات الأكسدة وتوت العليق مع لمسة من العسل الطبيعي.',
    ingredients: [
      { name_en: 'Rolled oats', name_ar: 'رقائق شوفان', weight_g: 50 },
      { name_en: 'Almond milk (unsweetened)', name_ar: 'حليب اللوز غير محلى', weight_g: 200 },
      { name_en: 'Mixed berries (blueberries/raspberries)', name_ar: 'توت مشكل طازج', weight_g: 80 },
      { name_en: 'Honey', name_ar: 'عسل نحل طبيعي', weight_g: 10 },
      { name_en: 'Chia seeds', name_ar: 'بذور شيا', weight_g: 5 },
    ],
    steps_en: [
      'Combine rolled oats and almond milk in a small saucepan.',
      'Bring to a boil, then reduce heat to low and simmer for 5-7 minutes, stirring constantly until thick and creamy.',
      'Pour the warm porridge into a breakfast bowl.',
      'Top with fresh mixed berries and sprinkle chia seeds on top.',
      'Drizzle with natural honey and serve warm.'
    ],
    steps_ar: [
      'ضع رقائق الشوفان وحليب اللوز في قدر صغير.',
      'دع الخليط يغلي، ثم خفف النار واطهه لـ 5-7 دقائق مع التحريك المستمر حتى يصبح سميكاً وكريمياً.',
      'اصكب عصيدة الشوفان الدافئة في زبدية التقديم.',
      'زينها بالتوت الطازج ورش بذور الشيا على السطح.',
      'أضف العسل الطبيعي وقدمها دافئة.'
    ],
    total_calories: 280,
    total_protein_g: 8,
    total_carbs_g: 48,
    total_fat_g: 6,
    image_url: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?auto=format&fit=crop&w=600&q=80',
    country_origin: 'GB',
    category: 'snack',
    tags: ['Low GI', 'High Fiber', 'Vegan', 'Quick Meal'],
  },
  {
    id: 'gb_grilled_salmon',
    title_en: 'Grilled Salmon with Rosemary Potatoes',
    title_ar: 'سلمون مشوي مع بطاطس بالروزماري',
    description_en: 'Pan-seared salmon fillet rich in healthy Omega-3 fatty acids, served with roasted baby potatoes and steamed asparagus. Extremely nutrient-dense.',
    description_ar: 'فيليه سلمون مشوي غني بأحماض أوميغا-3 الدهنية الصحية، يقدم مع بطاطس صغيرة محمصة بالفرن وهليون مطهو على البخار. وجبة متكاملة ومغذية.',
    ingredients: [
      { name_en: 'Salmon fillet', name_ar: 'فيليه سلمون طازج', weight_g: 150 },
      { name_en: 'Baby potatoes', name_ar: 'بطاطس صغيرة', weight_g: 120 },
      { name_en: 'Asparagus', name_ar: 'هليون أخضر', weight_g: 80 },
      { name_en: 'Olive oil', name_ar: 'زيت زيتون', weight_g: 8 },
      { name_en: 'Fresh rosemary and Lemon', name_ar: 'روزماري طازج وليمون', weight_g: 10 },
    ],
    steps_en: [
      'Cut baby potatoes in halves, toss with olive oil, salt, pepper, and fresh rosemary, then roast in the oven at 200°C for 25 minutes.',
      'Season the salmon fillet with salt, black pepper, and lemon juice.',
      'Sear the salmon in a hot non-stick skillet for 4 minutes skin-side down, then flip and cook for another 3 minutes until cooked through.',
      'Steam the asparagus spears for 3-4 minutes until tender-crisp.',
      'Assemble the plate with the grilled salmon, roasted potatoes, and asparagus. Garnish with a fresh lemon wedge.'
    ],
    steps_ar: [
      'اقطع البطاطس الصغيرة إلى أنصاف، وقلبها مع زيت الزيتون والملح والفلفل والروزماري، ثم حمصها في الفرن عند 200 درجة مئوية لـ 25 دقيقة.',
      'تبل فيليه السلمون بالملح، الفلفل الأسود، وعصير الليمون.',
      'اشوِ السلمون في مقلاة ساخنة غير لاصقة لمدة 4 دقائق من جهة الجلد، ثم اقلبه واطهه لـ 3 دقائق أخرى.',
      'اطه الهليون على البخار لمدة 3-4 دقائق حتى يصبح طرياً.',
      'رتب طبقك بوضع السلمون المشوي، البطاطس المحمصة، والهليون. وزينه بشريحة ليمون طازجة.'
    ],
    total_calories: 490,
    total_protein_g: 34,
    total_carbs_g: 28,
    total_fat_g: 24,
    image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
    country_origin: 'GB',
    category: 'dinner',
    tags: ['High Omega-3', 'High Protein', 'Nutrient-Dense'],
  },
];
