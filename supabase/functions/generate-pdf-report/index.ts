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
      if (typeof fileName !== 'string' || fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
        status = 400;
        throw new Error('Invalid file name');
      }

      const filePath = `${userId}/${fileName}`;
      const { error: deleteError } = await supabase.storage.from('reports').remove([filePath]);
      if (deleteError) {
        status = 500;
        throw deleteError;
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
      throw new Error('Profile not found');
    }
    if (foodLogsRes.error) {
      status = 500;
      throw foodLogsRes.error;
    }
    if (waterLogsRes.error) {
      status = 500;
      throw waterLogsRes.error;
    }
    if (workoutLogsRes.error) {
      status = 500;
      throw workoutLogsRes.error;
    }
    if (mealPlansRes.error) {
      status = 500;
      throw mealPlansRes.error;
    }

    const profile = profileRes.data;
    const foodLogs = foodLogsRes.data;
    const waterLogs = waterLogsRes.data;
    const workoutLogs = workoutLogsRes.data;
    const latestPlan = mealPlansRes.data?.[0] || null;

    // Temporal return block for verification
    return new Response(JSON.stringify({ 
      success: true, 
      profile: { display_name: profile.display_name, country: profile.country },
      foodLogsCount: foodLogs.length,
      waterLogsCount: waterLogs.length,
      workoutLogsCount: workoutLogs.length,
      hasMealPlan: latestPlan !== null
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
