import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let status = 400;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      status = 401;
      throw new Error('Missing Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      status = 500;
      throw new Error('Server credentials are not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      status = 401;
      throw new Error('Invalid or expired session');
    }

    const userId = user.id;
    const body = await req.json().catch(() => ({}));

    // Handle delete action
    if (body.action === 'delete') {
      const fileName = body.fileName;
      if (typeof fileName !== 'string' || !fileName.trim() || fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
        status = 400;
        throw new Error('Invalid file name');
      }

      const filePath = `${userId}/${fileName}`;
      const { error: deleteError } = await supabase.storage.from('reports').remove([filePath]);
      if (deleteError) {
        status = 500;
        throw new Error(deleteError.message);
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Set up dates
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split('T')[0];

    // Execute queries in parallel
    const [profileRes, foodLogsRes, waterLogsRes, workoutLogsRes, mealPlansRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, language, country, health_goal, target_calories, target_protein_g, target_carbs_g, target_fat_g, target_water_ml')
        .eq('id', userId)
        .single(),
      supabase
        .from('food_logs')
        .select('amount_g, logged_date, foods_cache(calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, micros)')
        .eq('user_id', userId)
        .gte('logged_date', dateStr),
      supabase
        .from('water_logs')
        .select('amount_ml, logged_date')
        .eq('user_id', userId)
        .gte('logged_date', dateStr),
      supabase
        .from('workout_logs')
        .select('activity_name_en, activity_name_ar, duration_minutes, calories_burned, logged_date')
        .eq('user_id', userId)
        .gte('logged_date', dateStr),
      supabase
        .from('meal_plans')
        .select('grocery_list')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
    ]);

    // Handle database errors
    if (profileRes.error || !profileRes.data) {
      status = 404;
      throw new Error(profileRes.error?.message || 'Profile not found');
    }
    if (foodLogsRes.error) {
      status = 500;
      throw new Error(foodLogsRes.error.message);
    }
    if (waterLogsRes.error) {
      status = 500;
      throw new Error(waterLogsRes.error.message);
    }
    if (workoutLogsRes.error) {
      status = 500;
      throw new Error(workoutLogsRes.error.message);
    }
    if (mealPlansRes.error) {
      status = 500;
      throw new Error(mealPlansRes.error.message);
    }

    const profile = profileRes.data;
    const foodLogs = foodLogsRes.data;
    const waterLogs = waterLogsRes.data;
    const workoutLogs = workoutLogsRes.data;
    const latestPlan = mealPlansRes.data?.[0] || null;

    // Aggregation math
    let totalCal = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    for (const log of foodLogs || []) {
      const amt = Number(log.amount_g) || 0;
      const cache = log.foods_cache as any;
      if (cache) {
        totalCal += (amt * (Number(cache.calories_per_100g) || 0)) / 100;
        totalProtein += (amt * (Number(cache.protein_per_100g) || 0)) / 100;
        totalCarbs += (amt * (Number(cache.carbs_per_100g) || 0)) / 100;
        totalFat += (amt * (Number(cache.fat_per_100g) || 0)) / 100;
      }
    }

    const avgCal = Math.round(totalCal / 7);
    const avgProtein = Math.round(totalProtein / 7);
    const avgCarbs = Math.round(totalCarbs / 7);
    const avgFat = Math.round(totalFat / 7);

    let totalWater = 0;
    for (const log of waterLogs || []) {
      totalWater += Number(log.amount_ml) || 0;
    }
    const avgWater = Math.round(totalWater / 7);

    const totalWorkoutsCount = workoutLogs?.length || 0;
    let totalCaloriesBurned = 0;
    for (const log of workoutLogs || []) {
      totalCaloriesBurned += Number(log.calories_burned) || 0;
    }
    totalCaloriesBurned = Math.round(totalCaloriesBurned);

    const isAr = profile.language === 'ar';
    const clientName = profile.display_name || (isAr ? 'مستخدم' : 'User');
    const healthGoal = profile.health_goal || 'maintain_weight';

    const targetCal = Math.round(Number(profile.target_calories) || 2000);
    const targetProtein = Math.round(Number(profile.target_protein_g) || 120);
    const targetCarbs = Math.round(Number(profile.target_carbs_g) || 200);
    const targetFat = Math.round(Number(profile.target_fat_g) || 65);
    const targetWater = Math.round(Number(profile.target_water_ml) || 2500);

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    let aiInsight = isAr 
      ? "حافظ على وتيرة جيدة في تتبع وجباتك والتزامك بأهدافك الصحية!"
      : "Keep up the excellent work tracking your meals and adhering to your fitness goals!";

    if (geminiKey) {
      try {
        const prompt = `You are a professional nutritionist. Write a personal, friendly coaching summary in ${isAr ? 'Arabic' : 'English'} for ${clientName} based on their weekly metrics.
Daily Target Calories: ${targetCal} kcal, Average intake: ${avgCal} kcal.
Target Macros: Protein ${targetProtein}g, Carbs ${targetCarbs}g, Fats ${targetFat}g.
Average Actual Macros: Protein ${avgProtein}g, Carbs ${avgCarbs}g, Fats ${avgFat}g.
Target Daily Water: ${targetWater}ml, Average actual water: ${avgWater}ml.
Workouts: completed ${totalWorkoutsCount} workouts this week, burning ${totalCaloriesBurned} total calories.
Health Goal: ${healthGoal}.
Keep the summary to exactly 2-3 sentences. Focus on positive reinforcement or 1 actionable adjustment (e.g. eating more protein/water, adjusting calories).
Provide ONLY the response without any formatting, markdown, or preambles.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          }
        );
        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (responseText) aiInsight = responseText;
        }
      } catch (err) {
        console.error('Error generating AI Insights:', err);
      }
    }

    // Temporal return block for verification
    return new Response(JSON.stringify({ 
      success: true, 
      aiInsight,
      averages: { avgCal, avgProtein, avgCarbs, avgFat, avgWater },
      totals: { totalWorkoutsCount, totalCaloriesBurned }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Edge Function error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    });
  }
});
