-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Supabase Auth User ID (linked to auth.users)
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    language VARCHAR(5) DEFAULT 'ar',
    country VARCHAR(3) DEFAULT 'EG',
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    height_cm NUMERIC(5, 2) NOT NULL,
    weight_kg NUMERIC(5, 2) NOT NULL,
    activity_level VARCHAR(20) CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active')),
    health_goal VARCHAR(20) CHECK (health_goal IN ('lose_weight', 'maintain_weight', 'gain_weight')),
    target_calories NUMERIC(6, 1) DEFAULT 2000.0,
    target_protein_g NUMERIC(5, 1) DEFAULT 120.0,
    target_carbs_g NUMERIC(5, 1) DEFAULT 200.0,
    target_fat_g NUMERIC(5, 1) DEFAULT 65.0,
    target_water_ml NUMERIC(6, 1) DEFAULT 2500.0,
    diet_type VARCHAR(20) DEFAULT 'classic',
    exclusions TEXT[] DEFAULT '{}',
    disliked_ingredients TEXT[] DEFAULT '{}',
    goal_weight_kg NUMERIC(5, 2),
    unit_weight VARCHAR(10) DEFAULT 'kg',
    unit_height VARCHAR(10) DEFAULT 'cm',
    unit_water VARCHAR(10) DEFAULT 'ml',
    reminder_meals BOOLEAN DEFAULT TRUE,
    reminder_water BOOLEAN DEFAULT TRUE,
    reminder_workout BOOLEAN DEFAULT TRUE,
    macro_preset VARCHAR(20) DEFAULT 'balanced',
    macro_carbs_pct INT DEFAULT 40,
    macro_protein_pct INT DEFAULT 30,
    macro_fat_pct INT DEFAULT 30,
    app_theme VARCHAR(15) DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own profiles" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- 2. Foods Cache Table (Global caching layer for all API/AI-parsed lookups)
CREATE TABLE IF NOT EXISTS public.foods_cache (
    id TEXT PRIMARY KEY, -- 'usda:<fdc_id>' or 'off:<barcode>' or 'gemini:<hash>' or 'custom:<uuid>'
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    brand TEXT,
    barcode TEXT,
    source VARCHAR(20) DEFAULT 'usda',
    calories_per_100g NUMERIC(6, 2) NOT NULL,
    protein_per_100g NUMERIC(5, 2) NOT NULL,
    carbs_per_100g NUMERIC(5, 2) NOT NULL,
    fat_per_100g NUMERIC(5, 2) NOT NULL,
    micros JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Foods Cache
ALTER TABLE public.foods_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read cached food items." ON public.foods_cache
    FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert cached food items." ON public.foods_cache
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cached food items." ON public.foods_cache
    FOR UPDATE TO authenticated USING (true);

-- 3. Food Logs Table (Daily intake)
CREATE TABLE IF NOT EXISTS public.food_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    food_id TEXT REFERENCES public.foods_cache(id) NOT NULL,
    meal_type VARCHAR(15) CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snacks')),
    amount_g NUMERIC(6, 2) NOT NULL,
    logged_date DATE DEFAULT CURRENT_DATE NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Food Logs
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own food logs" ON public.food_logs
    FOR ALL USING (auth.uid() = user_id);

-- 4. Water Logs Table
CREATE TABLE IF NOT EXISTS public.water_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount_ml NUMERIC(5, 1) NOT NULL,
    logged_date DATE DEFAULT CURRENT_DATE NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS for Water Logs
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own water logs" ON public.water_logs
    FOR ALL USING (auth.uid() = user_id);

-- 5. Workout Logs Table
CREATE TABLE IF NOT EXISTS public.workout_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    activity_name_en TEXT NOT NULL,
    activity_name_ar TEXT NOT NULL,
    met_value NUMERIC(3, 1) NOT NULL,
    duration_minutes NUMERIC(4, 1) NOT NULL,
    calories_burned NUMERIC(6, 1) NOT NULL,
    logged_date DATE DEFAULT CURRENT_DATE NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS for Workout Logs
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own workout logs" ON public.workout_logs
    FOR ALL USING (auth.uid() = user_id);

-- 6. Generated Recipes Table (AI suggestions and user cookbook)
CREATE TABLE IF NOT EXISTS public.generated_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Null if global/public recipe
    title_en TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    ingredients JSONB NOT NULL,
    steps_en JSONB NOT NULL,
    steps_ar JSONB NOT NULL,
    total_calories NUMERIC(6, 1) NOT NULL,
    total_protein_g NUMERIC(5, 1) NOT NULL,
    total_carbs_g NUMERIC(5, 1) NOT NULL,
    total_fat_g NUMERIC(5, 1) NOT NULL,
    image_url TEXT,
    country_origin VARCHAR(3) DEFAULT 'EG',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Generated Recipes
ALTER TABLE public.generated_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read recipes." ON public.generated_recipes
    FOR SELECT USING (true);
CREATE POLICY "Users can insert their own recipes." ON public.generated_recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recipes." ON public.generated_recipes
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recipes." ON public.generated_recipes
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Meal Plans & Shopping Lists Table
CREATE TABLE IF NOT EXISTS public.meal_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    plan_data JSONB NOT NULL,
    grocery_list JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Meal Plans
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own meal plans" ON public.meal_plans
    FOR ALL USING (auth.uid() = user_id);

-- 8. Indexes for Performance Optimization
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON public.food_logs(user_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON public.water_logs(user_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON public.workout_logs(user_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_generated_recipes_user ON public.generated_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user ON public.meal_plans(user_id);

-- 9. Storage Buckets and Policies for PDF Reports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('reports', 'reports', false) 
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Users can upload, read, and delete their own files in reports/
CREATE POLICY "Users can manage their own reports" ON storage.objects
    FOR ALL 
    TO authenticated
    USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);
