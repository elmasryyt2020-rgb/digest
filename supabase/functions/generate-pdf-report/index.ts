import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import PDFDocument from "npm:pdfkit";
import reshaper from "npm:arabic-persian-reshaper@1.0.1";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { amiriRegularBase64 } from "./fonts/Amiri-Regular.ts";
import { amiriBoldBase64 } from "./fonts/Amiri-Bold.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FoodsCache {
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  micros?: {
    iron?: number;
    calcium?: number;
    sodium?: number;
    potassium?: number;
  };
}

interface FoodLog {
  amount_g: number;
  logged_date: string;
  foods_cache: FoodsCache | null;
}

// Arabic shaping and reversing helper preserving English words and numbers
function fixArabic(text: string, isAr: boolean): string {
  if (!isAr) return text;
  if (!text) return "";
  
  // Reshape Arabic characters to their connected forms
  const reshaped = reshaper.PersianShaper.convertArabic(text);
  
  // Reverse the entire string for LTR canvas compatibility
  const reversedStr = reshaped.split('').reverse().join('');
  
  // Restore original ordering for numbers, English words, and Arabic-Indic numerals
  return reversedStr.replace(/[a-zA-Z0-9%_\.-\u0660-\u0669\u06F0-\u06F9]+/g, (match) => {
    return match.split('').reverse().join('');
  });
}

// Module-level cache for fonts to avoid disk I/O and memory fragmentation on every request
let fontRegularBytes: Uint8Array | null = null;
let fontBoldBytes: Uint8Array | null = null;

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
    const foodLogs = (foodLogsRes.data as unknown) as FoodLog[];
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
      const cache = log.foods_cache;
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

    // Initialize PDFKit document
    const doc = new PDFDocument({ margin: 36, size: 'A4' });
    const chunks: Uint8Array[] = [];
    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));

    // Register Custom Fonts for Arabic / English support from local base64 cache
    if (!fontRegularBytes) {
      fontRegularBytes = decode(amiriRegularBase64);
    }
    if (!fontBoldBytes) {
      fontBoldBytes = decode(amiriBoldBase64);
    }
    doc.registerFont('Amiri', fontRegularBytes);
    doc.registerFont('Amiri-Bold', fontBoldBytes);

    const fReg = isAr ? 'Amiri' : 'Helvetica';
    const fBold = isAr ? 'Amiri-Bold' : 'Helvetica-Bold';
    const fOblique = isAr ? 'Amiri' : 'Helvetica-Oblique';

    // Design System Tokens (Light Theme Palette)
    const bgBase = '#F8F9F8';
    const bgCard = '#FFFFFF';
    const borderMuted = '#EAECEB';
    const textPrimary = '#1A1E1C';
    const textMuted = '#626A66';
    const accentSage = '#4C6E58';
    const accentMint = '#E2ECD7';
    
    const colorCal = '#E58C73';
    const colorProt = '#7E9DB0';
    const colorCarb = '#D3B177';
    const colorFat = '#9CA19E';

    // -------------------------------------------------------------
    // DRAW PAGE 1: Weekly Dashboard & Nutrition
    // -------------------------------------------------------------
    doc.rect(0, 0, 595.28, 841.89).fill(bgBase);

    // Header
    doc.fillColor(accentSage).fontSize(16).font(fBold).text('digest', 36, 36);
    doc.fillColor(textPrimary).fontSize(20).font(fBold).text(fixArabic(isAr ? 'التقرير الصحي الأسبوعي' : 'Weekly Health Summary', isAr), 36, 60);
    
    const dateRangeStr = `${dateStr}  to  ${new Date().toISOString().split('T')[0]}`;
    doc.fillColor(textMuted).fontSize(10).font(fReg).text(dateRangeStr, 36, 88);
    
    const metaStr = `${isAr ? 'العضو' : 'Member'}: ${clientName}  |  ${isAr ? 'الهدف' : 'Goal'}: ${healthGoal}`;
    doc.text(fixArabic(metaStr, isAr), 36, 103);

    // AI Insight Card (Dynamic height calculation)
    const shapedInsight = fixArabic(`"${aiInsight}"`, isAr);
    doc.font(fOblique).fontSize(9.5);
    const insightHeight = doc.heightOfString(shapedInsight, { width: 480 });
    const cardHeight = Math.max(80, insightHeight + 40);

    doc.roundedRect(36, 125, 523.28, cardHeight, 12).fillAndStroke(accentMint, accentSage);
    doc.fillColor(accentSage).fontSize(11).font(fBold).text(fixArabic(isAr ? 'رؤى الذكاء الاصطناعي:' : 'AI Insights:', isAr), 50, 138);
    doc.fillColor(textPrimary).fontSize(9.5).font(fOblique).text(shapedInsight, 50, 155, { width: 480 });

    // Macronutrients Card
    let currentY = 125 + cardHeight + 15;
    doc.roundedRect(36, currentY, 523.28, 195, 12).fillAndStroke(bgCard, borderMuted);
    doc.fillColor(textPrimary).fontSize(12).font(fBold).text(fixArabic(isAr ? 'المغذيات الكبرى (متوسط يومي)' : 'Macronutrient Performance (Daily Avg)', isAr), 50, currentY + 15);

    const drawProgressBar = (label: string, actual: number, target: number, color: string, yPos: number, unit: string) => {
      doc.fillColor(textPrimary).fontSize(10).font(fBold).text(fixArabic(label, isAr), 50, yPos);
      doc.fillColor(textMuted).fontSize(10).font(fReg).text(fixArabic(`${actual} / ${target} ${unit}`, isAr), 450, yPos, { width: 90, align: 'right' });
      
      // Bar background
      doc.roundedRect(50, yPos + 15, 490, 8, 4).fill('#EAECEB');
      
      // Actual fill
      const percent = Math.min(actual / (target || 1), 1);
      if (percent > 0) {
        doc.roundedRect(50, yPos + 15, 490 * percent, 8, 4).fill(color);
      }
    };

    drawProgressBar(isAr ? 'السعرات الحرارية' : 'Calories', avgCal, targetCal, colorCal, currentY + 45, 'kcal');
    drawProgressBar(isAr ? 'البروتين' : 'Protein', avgProtein, targetProtein, colorProt, currentY + 80, 'g');
    drawProgressBar(isAr ? 'الكربوهيدرات' : 'Carbohydrates', avgCarbs, targetCarbs, colorCarb, currentY + 115, 'g');
    drawProgressBar(isAr ? 'الدهون' : 'Fats', avgFat, targetFat, colorFat, currentY + 150, 'g');

    // Two Columns Split: Micro Nutrients & Water Summary
    currentY += 210;
    // Left: Micros
    doc.roundedRect(36, currentY, 250, 180, 12).fillAndStroke(bgCard, borderMuted);
    doc.fillColor(textPrimary).fontSize(11).font(fBold).text(fixArabic(isAr ? 'المغذيات الدقيقة (متوسط)' : 'Micronutrients (Daily Avg)', isAr), 50, currentY + 15);
    
    let avgIron = 0, avgCalcium = 0, avgSodium = 0, avgPotassium = 0;
    for (const l of foodLogs || []) {
      const micros = l.foods_cache?.micros || {};
      const amtFactor = (Number(l.amount_g) || 0) / 100;
      if (micros.iron) avgIron += (Number(micros.iron) * amtFactor);
      if (micros.calcium) avgCalcium += (Number(micros.calcium) * amtFactor);
      if (micros.sodium) avgSodium += (Number(micros.sodium) * amtFactor);
      if (micros.potassium) avgPotassium += (Number(micros.potassium) * amtFactor);
    }
    avgIron = Math.round((avgIron / 7) * 10) / 10;
    avgCalcium = Math.round(avgCalcium / 7);
    avgSodium = Math.round(avgSodium / 7);
    avgPotassium = Math.round(avgPotassium / 7);

    const drawMicroRow = (label: string, value: string, y: number) => {
      doc.fillColor(textMuted).fontSize(9.5).font(fReg).text(fixArabic(label, isAr), 50, y);
      doc.fillColor(textPrimary).fontSize(9.5).font(fBold).text(fixArabic(value, isAr), 200, y, { width: 70, align: 'right' });
      doc.moveTo(50, y + 14).lineTo(270, y + 14).strokeColor(borderMuted).lineWidth(0.5).stroke();
    };

    drawMicroRow(isAr ? 'الحديد' : 'Iron', `${avgIron} mg`, currentY + 45);
    drawMicroRow(isAr ? 'الكالسيوم' : 'Calcium', `${avgCalcium} mg`, currentY + 75);
    drawMicroRow(isAr ? 'الصوديوم' : 'Sodium', `${avgSodium} mg`, currentY + 105);
    drawMicroRow(isAr ? 'البوتاسيوم' : 'Potassium', `${avgPotassium} mg`, currentY + 135);

    // Right: Water
    doc.roundedRect(309, currentY, 250, 180, 12).fillAndStroke(bgCard, borderMuted);
    doc.fillColor(textPrimary).fontSize(11).font(fBold).text(fixArabic(isAr ? 'معدل شرب الماء اليومي' : 'Water Intake (Daily Avg)', isAr), 323, currentY + 15);
    
    doc.fillColor('#7E9DB0').fontSize(14).font(fBold).text(fixArabic(`${avgWater} ml`, isAr), 323, currentY + 45);
    doc.fillColor(textMuted).fontSize(9.5).font(fReg).text(fixArabic(`${isAr ? 'الهدف:' : 'Target:'} ${targetWater} ml`, isAr), 323, currentY + 65);
    
    doc.roundedRect(323, currentY + 90, 222, 10, 5).fill('#EAECEB');
    const waterPct = Math.min(avgWater / (targetWater || 1), 1);
    if (waterPct > 0) {
      doc.roundedRect(323, currentY + 90, 222 * waterPct, 10, 5).fill('#7E9DB0');
    }
    
    const waterGoalText = waterPct >= 1 
      ? (isAr ? '✓ تم تحقيق هدف المياه بنجاح!' : '✓ Water goal achieved!')
      : (isAr ? `تبقّى ${Math.max(0, targetWater - avgWater)} مل لتحقيق الهدف` : `${Math.max(0, targetWater - avgWater)} ml left to target`);
    doc.fillColor(textMuted).fontSize(9.5).font(fOblique).text(fixArabic(waterGoalText, isAr), 323, currentY + 115, { width: 220 });

    // Footer 1
    doc.fillColor(textMuted).fontSize(9).font(fReg).text(fixArabic(isAr ? 'صفحة ١ من ٢' : 'Page 1 of 2', isAr), 36, 800, { width: 523.28, align: 'center' });

    // -------------------------------------------------------------
    // DRAW PAGE 2: Workouts, Grocery & Recommendation
    // -------------------------------------------------------------
    doc.addPage();
    doc.rect(0, 0, 595.28, 841.89).fill(bgBase);

    // Header 2
    doc.fillColor(accentSage).fontSize(12).font(fBold).text('digest', 36, 36);
    doc.fillColor(textPrimary).fontSize(16).font(fBold).text(fixArabic(isAr ? 'التدريبات وقائمة البقالة والوصفات' : 'Workouts, Grocery & Recommendations', isAr), 36, 55);

    // Workouts Card
    doc.roundedRect(36, 85, 523.28, 195, 12).fillAndStroke(bgCard, borderMuted);
    doc.fillColor(textPrimary).fontSize(12).font(fBold).text(fixArabic(isAr ? 'سجل الأنشطة والتدريبات' : 'Activity & Workouts Log', isAr), 50, 100);
    doc.fillColor(textMuted).fontSize(10).font(fReg).text(fixArabic(`${isAr ? 'إجمالي التدريبات:' : 'Total Workouts:'} ${totalWorkoutsCount} | ${isAr ? 'السعرات المحروقة:' : 'Calories Burned:'} ${totalCaloriesBurned} kcal`, isAr), 50, 120);

    let yWork = 145;
    const workouts = workoutLogs || [];
    workouts.slice(0, 4).forEach((workout) => {
      const actName = isAr ? workout.activity_name_ar : workout.activity_name_en;
      doc.fillColor(textPrimary).fontSize(9.5).font(fBold).text(fixArabic(actName, isAr), 50, yWork);
      doc.fillColor(textMuted).fontSize(9.5).font(fReg).text(fixArabic(`${workout.duration_minutes} ${isAr ? 'دقيقة' : 'mins'} | -${workout.calories_burned} kcal`, isAr), 300, yWork);
      doc.moveTo(50, yWork + 14).lineTo(545, yWork + 14).strokeColor(borderMuted).lineWidth(0.5).stroke();
      yWork += 25;
    });
    if (totalWorkoutsCount === 0) {
      doc.fillColor(textMuted).fontSize(10).font(fOblique).text(fixArabic(isAr ? 'لم يتم تسجيل تدريبات هذا الأسبوع.' : 'No workouts logged this week.', isAr), 50, 155);
    }

    // Grocery List Checklist Card
    doc.roundedRect(36, 295, 523.28, 220, 12).fillAndStroke(bgCard, borderMuted);
    doc.fillColor(textPrimary).fontSize(12).font(fBold).text(fixArabic(isAr ? 'قائمة التسوق المقترحة' : 'Grocery Shopping List (from plan)', isAr), 50, 310);

    let listItems: string[] = [];
    if (latestPlan && latestPlan.grocery_list) {
      try {
        const rawList = latestPlan.grocery_list;
        if (Array.isArray(rawList)) {
          listItems = rawList.map((item: any) => typeof item === 'string' ? item : (item.name || item.name_en || ''));
        }
      } catch (_) {}
    }
    listItems = listItems.filter(Boolean);

    if (listItems.length === 0) {
      listItems = profile.country === 'EG' 
        ? ['فول مدمس', 'بيض بلدي', 'جبن قريش', 'جرجير طازج', 'خبز بلدي كامل الحبة', 'زيت زيتون بكر']
        : ['Organic Eggs', 'Greek Yogurt', 'Fresh Spinach', 'Rolled Oats', 'Whole Wheat Bread', 'Olive Oil'];
    }

    const yGroc = 335;
    listItems.slice(0, 8).forEach((item, index) => {
      const col = index % 2 === 0 ? 50 : 300;
      const rowY = yGroc + Math.floor(index / 2) * 25;
      doc.strokeColor(accentSage).lineWidth(1).roundedRect(col, rowY, 10, 10, 2).stroke();
      doc.fillColor(textPrimary).fontSize(9.5).font(fReg).text(fixArabic(item, isAr), col + 18, rowY);
    });

    // Localized Recipe Recommendation Spotlight
    doc.roundedRect(36, 530, 523.28, 140, 12).fillAndStroke(accentMint, borderMuted);
    doc.fillColor(accentSage).fontSize(11).font(fBold).text(fixArabic(isAr ? '★ وصفة مقترحة مخصصة لك:' : '★ Recommended Recipe for You:', isAr), 50, 545);

    const isEG = profile.country === 'EG';
    const recTitle = isEG 
      ? (isAr ? 'شوربة العدس المصرية المغذية' : 'Nutritious Egyptian Lentil Soup')
      : (isAr ? 'شوفان بنكهة التفاح والقرفة' : 'Apple Cinnamon Overnight Oats');
    const recDesc = isEG
      ? (isAr ? 'مصدر ممتاز للبروتين النباتي والألياف والحديد والزنك لزيادة طاقتك.' : 'An excellent source of plant-based protein, fiber, and iron to keep you active.')
      : (isAr ? 'وجبة إفطار منخفضة السعرات غنية بالمعادن والألياف بطيئة الامتصاص.' : 'Low-calorie breakfast rich in calcium, potassium, and slow-release complex carbs.');
    const recMacros = isEG 
      ? (isAr ? 'السعرات: ٢٩٠ | البروتين: ١٨ جم | الألياف: ١٢ جم' : 'Calories: 290 kcal | Protein: 18g | Fiber: 12g')
      : (isAr ? 'السعرات: ٢٥٠ | البروتين: ٩ جم | الألياف: ٧ جم' : 'Calories: 250 kcal | Protein: 9g | Fiber: 7g');

    doc.fillColor(textPrimary).fontSize(10).font(fBold).text(fixArabic(recTitle, isAr), 50, 565);
    doc.fillColor(textMuted).fontSize(9).font(fReg).text(fixArabic(recDesc, isAr), 50, 580, { width: 495 });
    doc.fillColor(accentSage).fontSize(9).font(fBold).text(fixArabic(recMacros, isAr), 50, 620);

    // Footer 2
    doc.fillColor(textMuted).fontSize(9).font(fReg).text(fixArabic(isAr ? 'صفحة ٢ من ٢' : 'Page 2 of 2', isAr), 36, 800, { width: 523.28, align: 'center' });

    // 1. Set up the promise and listeners first
    const pdfBytesPromise = new Promise<Uint8Array>((resolve, reject) => {
      doc.on('end', () => {
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const buffer = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          buffer.set(chunk, offset);
          offset += chunk.length;
        }
        resolve(buffer);
      });
      doc.on('error', (err: any) => reject(err));
    });

    // 2. Trigger compilation end
    doc.end();

    // 3. Await resolution
    const pdfBytes = await pdfBytesPromise;

    // 1. Proactive Sweeper - List user files in reports/userId and delete files older than 1 hour in background
    try {
      const { data: listData, error: listError } = await supabase.storage.from('reports').list(userId);
      if (listError) throw listError;
      
      if (listData && listData.length > 0) {
        const now = Date.now();
        const filesToDelete: string[] = [];
        for (const f of listData) {
          const createdAt = new Date(f.created_at).getTime();
          // 1 hour = 3600000 ms
          if (now - createdAt > 3600000) {
            filesToDelete.push(`${userId}/${f.name}`);
          }
        }
        if (filesToDelete.length > 0) {
          const { error: sweepDeleteError } = await supabase.storage.from('reports').remove(filesToDelete);
          if (sweepDeleteError) console.error('Sweeper removal error:', sweepDeleteError.message);
        }
      }
    } catch (sweepErr: any) {
      console.error('Sweeper background warning:', sweepErr.message);
    }

    // 2. Pre-generation cleanup: delete user's current directory files before writing the new one
    try {
      const { data: currentFiles, error: currentFilesError } = await supabase.storage.from('reports').list(userId);
      if (currentFilesError) throw currentFilesError;
      
      if (currentFiles && currentFiles.length > 0) {
        const toClean = currentFiles.map((f: any) => `${userId}/${f.name}`);
        const { error: cleanDeleteError } = await supabase.storage.from('reports').remove(toClean);
        if (cleanDeleteError) console.error('Pre-generation cleanup removal error:', cleanDeleteError.message);
      }
    } catch (cleanErr: any) {
      console.error('Pre-generation cleanup warning:', cleanErr.message);
    }

    // 3. Upload PDF
    const uniqueFileName = `weekly_summary_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`;
    const filePath = `${userId}/${uniqueFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('reports')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true
      });
    if (uploadError) {
      status = 500;
      throw new Error(uploadError.message);
    }

    // 4. Generate 5-minute signed URL
    const { data: signedData, error: signedError } = await supabase.storage
      .from('reports')
      .createSignedUrl(filePath, 300); // 300 seconds = 5 minutes
    
    if (signedError || !signedData) {
      status = 500;
      throw new Error(signedError?.message || 'Failed to generate secure signed link');
    }

    return new Response(JSON.stringify({ 
      url: signedData.signedUrl, 
      fileName: uniqueFileName 
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
