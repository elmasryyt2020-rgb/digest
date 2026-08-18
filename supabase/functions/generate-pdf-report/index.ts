import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import PDFDocument from "npm:pdfkit";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { amiriRegularBase64 } from "./fonts/Amiri-Regular.ts";
import { amiriBoldBase64 } from "./fonts/Amiri-Bold.ts";
import { OutfitRegularBase64 as outfitRegularBase64 } from "./fonts/Outfit-Regular.ts";
import { OutfitSemiBoldBase64 as outfitSemiBoldBase64 } from "./fonts/Outfit-SemiBold.ts";
import { OutfitBoldBase64 as outfitBoldBase64 } from "./fonts/Outfit-Bold.ts";
import { InterRegularBase64 as interRegularBase64 } from "./fonts/Inter-Regular.ts";
import { InterBoldBase64 as interBoldBase64 } from "./fonts/Inter-Bold.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callGemini(geminiKey: string, payload: any): Promise<any> {
  const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = '';
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        return await res.json();
      }
      const errText = await res.text();
      lastError = `${model}: ${res.status} - ${errText}`;
      console.warn(`Gemini model ${model} failed, trying fallback...`, lastError);
    } catch (e: any) {
      lastError = `${model}: ${e.message}`;
    }
  }
  throw new Error(`All Gemini models failed. Last error: ${lastError}`);
}

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

// Detects Arabic characters in any string
function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

/**
 * Fixes Arabic text for PDFKit's LTR-only canvas.
 *
 * PDFKit renders all text left-to-right. Arabic is RTL, so word order is wrong.
 * Amiri font's OpenType features already handle Arabic letter joining/shaping
 * correctly — we must NOT use a reshaper (it produces Presentation Forms that
 * PDFKit then double-processes through OpenType, garbling everything).
 *
 * Fix: reverse WORD ORDER only. Each word's internal character sequence stays
 * in logical order so the font can shape it correctly.
 */
function fixArabic(text: string, forceAr?: boolean): string {
  if (!text) return '';
  const isArabic = forceAr || containsArabic(text);
  if (!isArabic) return text;

  // Reverse word order: RTL logical sequence → LTR visual sequence
  // Characters within each word stay in logical order for correct OpenType shaping
  return text.split(' ').reverse().join(' ');
}


// Module-level font byte cache — avoid re-decoding on every request
let fontRegularBytes: Uint8Array | null = null;
let fontBoldBytes: Uint8Array | null = null;
let fontOutfitRegBytes: Uint8Array | null = null;
let fontOutfitSemiBoldBytes: Uint8Array | null = null;
let fontOutfitBoldBytes: Uint8Array | null = null;
let fontInterRegBytes: Uint8Array | null = null;
let fontInterBoldBytes: Uint8Array | null = null;

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
    if (foodLogsRes.error) { status = 500; throw new Error(foodLogsRes.error.message); }
    if (waterLogsRes.error) { status = 500; throw new Error(waterLogsRes.error.message); }
    if (workoutLogsRes.error) { status = 500; throw new Error(workoutLogsRes.error.message); }
    if (mealPlansRes.error) { status = 500; throw new Error(mealPlansRes.error.message); }

    const profile = profileRes.data;
    const foodLogs = (foodLogsRes.data as unknown) as FoodLog[];
    const waterLogs = waterLogsRes.data;
    const workoutLogs = workoutLogsRes.data;
    const latestPlan = mealPlansRes.data?.[0] || null;

    // Aggregation math
    let totalCal = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
    for (const log of foodLogs || []) {
      const amt = Number(log.amount_g) || 0;
      const cache = log.foods_cache;
      if (cache) {
        totalCal     += (amt * (Number(cache.calories_per_100g) || 0)) / 100;
        totalProtein += (amt * (Number(cache.protein_per_100g) || 0)) / 100;
        totalCarbs   += (amt * (Number(cache.carbs_per_100g)   || 0)) / 100;
        totalFat     += (amt * (Number(cache.fat_per_100g)     || 0)) / 100;
      }
    }

    const avgCal     = Math.round(totalCal     / 7);
    const avgProtein = Math.round(totalProtein / 7);
    const avgCarbs   = Math.round(totalCarbs   / 7);
    const avgFat     = Math.round(totalFat     / 7);

    let totalWater = 0;
    for (const log of waterLogs || []) totalWater += Number(log.amount_ml) || 0;
    const avgWater = Math.round(totalWater / 7);

    const totalWorkoutsCount = workoutLogs?.length || 0;
    let totalCaloriesBurned = 0;
    for (const log of workoutLogs || []) totalCaloriesBurned += Number(log.calories_burned) || 0;
    totalCaloriesBurned = Math.round(totalCaloriesBurned);

    const isAr = profile.language === 'ar';
    const clientName = profile.display_name || (isAr ? 'مستخدم' : 'User');
    const healthGoal = profile.health_goal || 'maintain_weight';

    const targetCal     = Math.round(Number(profile.target_calories)  || 2000);
    const targetProtein = Math.round(Number(profile.target_protein_g) || 120);
    const targetCarbs   = Math.round(Number(profile.target_carbs_g)   || 200);
    const targetFat     = Math.round(Number(profile.target_fat_g)     || 65);
    const targetWater   = Math.round(Number(profile.target_water_ml)  || 2500);

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    let aiInsight = isAr
      ? "حافظ على وتيرة جيدة في تتبع وجباتك والتزامك بأهدافك الصحية!"
      : "Keep up the excellent work tracking your meals and adhering to your fitness goals!";

    if (geminiKey) {
      try {
        const prompt = `You are a professional nutritionist. Write a personal, friendly coaching summary in ${isAr ? 'Arabic' : 'English'} for ${clientName} based on their weekly metrics.\nDaily Target Calories: ${targetCal} kcal, Average intake: ${avgCal} kcal.\nTarget Macros: Protein ${targetProtein}g, Carbs ${targetCarbs}g, Fats ${targetFat}g.\nAverage Actual Macros: Protein ${avgProtein}g, Carbs ${avgCarbs}g, Fats ${avgFat}g.\nTarget Daily Water: ${targetWater}ml, Average actual water: ${avgWater}ml.\nWorkouts: completed ${totalWorkoutsCount} workouts this week, burning ${totalCaloriesBurned} total calories.\nHealth Goal: ${healthGoal}.\nKeep the summary to exactly 2-3 sentences. Focus on positive reinforcement or 1 actionable adjustment (e.g. eating more protein/water, adjusting calories).\nProvide ONLY the response without any formatting, markdown, or preambles.`;

        const geminiData = await callGemini(geminiKey, {
          contents: [{ parts: [{ text: prompt }] }],
        });
        const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (responseText) aiInsight = responseText;
      } catch (err) {
        console.error('Error generating AI Insights:', err);
      }
    }

    // Truncate AI insight to prevent layout overflow (fixed-height card)
    if (aiInsight.length > 260) aiInsight = aiInsight.substring(0, 257) + '...';

    // Aggregate micronutrients
    let avgIron = 0, avgCalcium = 0, avgSodium = 0, avgPotassium = 0;
    for (const l of foodLogs || []) {
      const micros = l.foods_cache?.micros || {};
      const amtFactor = (Number(l.amount_g) || 0) / 100;
      if (micros.iron)      avgIron      += Number(micros.iron)      * amtFactor;
      if (micros.calcium)   avgCalcium   += Number(micros.calcium)   * amtFactor;
      if (micros.sodium)    avgSodium    += Number(micros.sodium)    * amtFactor;
      if (micros.potassium) avgPotassium += Number(micros.potassium) * amtFactor;
    }
    avgIron      = Math.round((avgIron / 7) * 10) / 10;
    avgCalcium   = Math.round(avgCalcium   / 7);
    avgSodium    = Math.round(avgSodium    / 7);
    avgPotassium = Math.round(avgPotassium / 7);

    // ── Design tokens aligned with app's global.css + tailwind.config.js ──
    const PW = 595.28;
    const PH = 841.89;
    const C = {
      bg:          '#F8F9F8',  // --bg-base
      card:        '#FFFFFF',  // --bg-card
      border:      '#EAECEB',  // --border-muted
      textPrimary: '#1A1E1C',  // --text-primary
      textMuted:   '#626A66',  // --text-muted
      accent:      '#4C6E58',  // --accent-sage
      accentLight: '#E2ECD7',  // --accent-mint
      header:      '#1A2E22',  // deep forest (header bar)
      headerStrip: '#4C6E58',  // accent strip under header
      white:       '#FFFFFF',
      calColor:    '#E58C73',  // nutrient-calories
      protColor:   '#7E9DB0',  // nutrient-protein
      carbColor:   '#D3B177',  // nutrient-carbs
      fatColor:    '#9CA19E',  // nutrient-fats
      waterColor:  '#7E9DB0',  // same steel-blue as protein
    };

    // ── Font helpers ──────────────────────────────────────────────────────
    // English: Outfit family (app primary font)
    // Arabic:  Amiri family (only font with Arabic glyph support)
    const fReg      = isAr ? 'Amiri'        : 'Outfit-Regular';
    const fSemi     = isAr ? 'Amiri-Bold'   : 'Outfit-SemiBold';
    const fBold     = isAr ? 'Amiri-Bold'   : 'Outfit-Bold';
    const fInterReg = isAr ? 'Amiri'        : 'Inter-Regular';
    const fInterBold= isAr ? 'Amiri-Bold'   : 'Inter-Bold';

    // Per-item helpers: auto-switch to Amiri if item text contains Arabic
    const itemFont = (t: string) => containsArabic(t) ? 'Amiri' : 'Outfit-Regular';
    const itemText = (t: string) => fixArabic(t);

    // ── Initialize PDF ────────────────────────────────────────────────────
    const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: true });
    const chunks: Uint8Array[] = [];
    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));

    // Decode & cache fonts
    if (!fontRegularBytes)       fontRegularBytes       = decode(amiriRegularBase64);
    if (!fontBoldBytes)          fontBoldBytes          = decode(amiriBoldBase64);
    if (!fontOutfitRegBytes)     fontOutfitRegBytes     = decode(outfitRegularBase64);
    if (!fontOutfitSemiBoldBytes)fontOutfitSemiBoldBytes= decode(outfitSemiBoldBase64);
    if (!fontOutfitBoldBytes)    fontOutfitBoldBytes    = decode(outfitBoldBase64);
    if (!fontInterRegBytes)      fontInterRegBytes      = decode(interRegularBase64);
    if (!fontInterBoldBytes)     fontInterBoldBytes     = decode(interBoldBase64);

    doc.registerFont('Amiri',         fontRegularBytes);
    doc.registerFont('Amiri-Bold',    fontBoldBytes);
    doc.registerFont('Outfit-Regular',fontOutfitRegBytes);
    doc.registerFont('Outfit-SemiBold',fontOutfitSemiBoldBytes);
    doc.registerFont('Outfit-Bold',   fontOutfitBoldBytes);
    doc.registerFont('Inter-Regular', fontInterRegBytes);
    doc.registerFont('Inter-Bold',    fontInterBoldBytes);

    // ===================================================================
    // PAGE 1 — Dashboard & Nutrition
    // ===================================================================
    doc.rect(0, 0, PW, PH).fill(C.bg);

    // ── Dark header bar ──────────────────────────────────────────────────
    doc.rect(0, 0, PW, 90).fill(C.header);
    doc.rect(0, 86, PW, 4).fill(C.headerStrip);

    // Brand wordmark
    doc.fillColor(C.accent).fontSize(10).font('Outfit-Bold')
       .text('digest', 36, 16, { lineBreak: false });

    // Page title
    const p1Title = isAr ? fixArabic('التقرير الصحي الأسبوعي') : 'Weekly Health Summary';
    doc.fillColor(C.white).fontSize(19).font('Outfit-Bold')
       .text(p1Title, 36, 36, { lineBreak: false });

    // Date range + user — right-aligned in header
    const todayStr  = new Date().toISOString().split('T')[0];
    const dateLabel = `${dateStr}  –  ${todayStr}`;
    const userLabel = isAr
      ? fixArabic(`${clientName}  ·  ${healthGoal.replace(/_/g, ' ')}`)
      : `${clientName}  ·  ${healthGoal.replace(/_/g, ' ')}`;
    doc.fillColor('#AACCB8').fontSize(8.5).font('Outfit-Regular')
       .text(dateLabel, 0, 18, { width: PW - 36, align: 'right', lineBreak: false });
    doc.fillColor('#AACCB8').fontSize(8).font(fReg)
       .text(userLabel, 0, 32, { width: PW - 36, align: 'right', lineBreak: false });

    // ── AI Coach card ────────────────────────────────────────────────────
    const AI_Y = 102;
    const AI_H = 82;
    doc.roundedRect(36, AI_Y, PW - 72, AI_H, 10).fill(C.accentLight);
    doc.roundedRect(36, AI_Y, 4, AI_H, 2).fill(C.accent);

    doc.fillColor(C.accent).fontSize(7.5).font('Outfit-Bold')
       .text('AI COACH', 48, AI_Y + 14, { lineBreak: false });
    const shapedInsight = isAr ? fixArabic(`"${aiInsight}"`) : `"${aiInsight}"`;
    doc.fillColor(C.textPrimary).fontSize(9).font(fReg)
       .text(shapedInsight, 48, AI_Y + 30, {
         width: PW - 116,
         height: 44,
         ellipsis: true,
         align: isAr ? 'right' : 'left',
       });

    // ── Macronutrients card ──────────────────────────────────────────────
    const MAC_Y = AI_Y + AI_H + 12;
    const MAC_H = 206;
    doc.roundedRect(36, MAC_Y, PW - 72, MAC_H, 10).fillAndStroke(C.card, C.border);
    doc.roundedRect(36, MAC_Y, 4, MAC_H, 2).fill(C.calColor);

    const macTitle = isAr ? fixArabic('المغذيات الكبرى') : 'Macronutrient Performance';
    const macSub   = isAr ? fixArabic('المتوسط اليومي لهذا الأسبوع') : 'Daily average for this week';
    doc.fillColor(C.textPrimary).fontSize(11).font(fBold)
       .text(macTitle, 48, MAC_Y + 16, { lineBreak: false, align: isAr ? 'right' : 'left', width: PW - 96 });
    doc.fillColor(C.textMuted).fontSize(8).font(fReg)
       .text(macSub, 48, MAC_Y + 32, { lineBreak: false, align: isAr ? 'right' : 'left', width: PW - 96 });

    const BAR_X = 50;
    const BAR_W = PW - 106;

    const drawBar = (label: string, actual: number, target: number, color: string, yPos: number, unit: string) => {
      const labelText = isAr ? fixArabic(label) : label;
      const valueText = `${actual} / ${target} ${unit}`;

      if (isAr) {
        // Arabic: value on LEFT, label on RIGHT
        doc.fillColor(C.textMuted).fontSize(8.5).font('Inter-Regular')
           .text(valueText, BAR_X, yPos + 1, { lineBreak: false });
        doc.fillColor(C.textPrimary).fontSize(9.5).font(fBold)
           .text(labelText, 0, yPos, { width: PW - 46, align: 'right', lineBreak: false });
      } else {
        // English: label on LEFT, value on RIGHT
        doc.fillColor(C.textPrimary).fontSize(9.5).font(fSemi)
           .text(labelText, BAR_X, yPos, { lineBreak: false });
        doc.fillColor(C.textMuted).fontSize(8.5).font('Inter-Regular')
           .text(valueText, 0, yPos + 1, { width: PW - 46, align: 'right', lineBreak: false });
      }

      // Track bar background
      doc.roundedRect(BAR_X, yPos + 14, BAR_W, 7, 3.5).fill('#DDE8E3');
      const pct = Math.min(actual / (target || 1), 1);
      if (pct > 0) doc.roundedRect(BAR_X, yPos + 14, BAR_W * pct, 7, 3.5).fill(color);
    };

    drawBar(isAr ? 'السعرات الحرارية' : 'Calories',     avgCal,     targetCal,     C.calColor,  MAC_Y + 57,  'kcal');
    drawBar(isAr ? 'البروتين'         : 'Protein',       avgProtein, targetProtein, C.protColor, MAC_Y + 100, 'g');
    drawBar(isAr ? 'الكربوهيدرات'    : 'Carbohydrates', avgCarbs,   targetCarbs,   C.carbColor, MAC_Y + 143, 'g');
    drawBar(isAr ? 'الدهون'           : 'Fats',          avgFat,     targetFat,     C.fatColor,  MAC_Y + 170, 'g');

    // ── Micronutrients + Water row ───────────────────────────────────────
    const ROW_Y  = MAC_Y + MAC_H + 12;
    const ROW_H  = 180;
    const COL_W  = (PW - 72 - 10) / 2;
    const COL2_X = 36 + COL_W + 10;

    // Left card: Micronutrients
    doc.roundedRect(36, ROW_Y, COL_W, ROW_H, 10).fillAndStroke(C.card, C.border);
    doc.roundedRect(36, ROW_Y, 4, ROW_H, 2).fill(C.protColor);

    const microTitle = isAr ? fixArabic('المغذيات الدقيقة') : 'Micronutrients';
    const microSub   = isAr ? fixArabic('متوسط يومي') : 'Daily avg';
    doc.fillColor(C.textPrimary).fontSize(10).font(fSemi)
       .text(microTitle, 48, ROW_Y + 16, { lineBreak: false, align: isAr ? 'right' : 'left', width: COL_W - 26 });
    doc.fillColor(C.textMuted).fontSize(7.5).font(fReg)
       .text(microSub, 48, ROW_Y + 31, { lineBreak: false, align: isAr ? 'right' : 'left', width: COL_W - 26 });

    const MICRO_END_X = 36 + COL_W - 14;
    const microRows = [
      { label: isAr ? 'حديد'      : 'Iron',      val: `${avgIron} mg`      },
      { label: isAr ? 'كالسيوم'  : 'Calcium',   val: `${avgCalcium} mg`   },
      { label: isAr ? 'صوديوم'   : 'Sodium',    val: `${avgSodium} mg`    },
      { label: isAr ? 'بوتاسيوم' : 'Potassium', val: `${avgPotassium} mg` },
    ];
    microRows.forEach((row, i) => {
      const ry = ROW_Y + 52 + i * 30;
      if (isAr) {
        // Arabic: value on LEFT, label on RIGHT
        doc.fillColor(C.textPrimary).fontSize(9).font('Inter-Bold')
           .text(row.val, 48, ry, { lineBreak: false });
        doc.fillColor(C.textMuted).fontSize(9).font('Amiri')
           .text(fixArabic(row.label), 36, ry, { width: COL_W - 14, align: 'right', lineBreak: false });
      } else {
        doc.fillColor(C.textMuted).fontSize(9).font('Outfit-Regular')
           .text(row.label, 48, ry, { lineBreak: false });
        doc.fillColor(C.textPrimary).fontSize(9).font('Inter-Bold')
           .text(row.val, 36, ry, { width: COL_W - 14, align: 'right', lineBreak: false });
      }
      if (i < 3) doc.moveTo(48, ry + 17).lineTo(MICRO_END_X, ry + 17)
                    .strokeColor(C.border).lineWidth(0.5).stroke();
    });

    // Right card: Water Intake
    doc.roundedRect(COL2_X, ROW_Y, COL_W, ROW_H, 10).fillAndStroke(C.card, C.border);
    doc.roundedRect(COL2_X, ROW_Y, 4, ROW_H, 2).fill(C.waterColor);

    const waterTitle = isAr ? fixArabic('معدل الماء اليومي') : 'Water Intake';
    const waterSub   = isAr ? fixArabic('متوسط يومي') : 'Daily avg';
    doc.fillColor(C.textPrimary).fontSize(10).font(fSemi)
       .text(waterTitle, COL2_X + 12, ROW_Y + 16, { lineBreak: false, align: isAr ? 'right' : 'left', width: COL_W - 26 });
    doc.fillColor(C.textMuted).fontSize(7.5).font(fReg)
       .text(waterSub, COL2_X + 12, ROW_Y + 31, { lineBreak: false, align: isAr ? 'right' : 'left', width: COL_W - 26 });

    doc.fillColor(C.waterColor).fontSize(20).font('Inter-Bold')
       .text(`${avgWater} ml`, COL2_X + 12, ROW_Y + 52, { lineBreak: false });

    const targetWaterLabel = isAr
      ? fixArabic(`الهدف: ${targetWater} مل`)
      : `Target: ${targetWater} ml`;
    doc.fillColor(C.textMuted).fontSize(8).font(fReg)
       .text(targetWaterLabel, COL2_X + 12, ROW_Y + 80, { lineBreak: false, align: isAr ? 'right' : 'left', width: COL_W - 26 });

    const WBAR_W = COL_W - 24;
    doc.roundedRect(COL2_X + 12, ROW_Y + 96, WBAR_W, 8, 4).fill('#DDE8E3');
    const wPct = Math.min(avgWater / (targetWater || 1), 1);
    if (wPct > 0) doc.roundedRect(COL2_X + 12, ROW_Y + 96, WBAR_W * wPct, 8, 4).fill(C.waterColor);

    const waterMsg = wPct >= 1
      ? (isAr ? fixArabic('تم تحقيق الهدف! 🎯') : 'Goal achieved!')
      : (isAr ? fixArabic(`${Math.max(0, targetWater - avgWater)} مل متبقي`) : `${Math.max(0, targetWater - avgWater)} ml remaining`);
    doc.fillColor(wPct >= 1 ? C.accent : C.textMuted).fontSize(8.5).font(isAr ? 'Amiri' : 'Outfit-Regular')
       .text(waterMsg, COL2_X + 12, ROW_Y + 114, { lineBreak: false });

    // ── Page 1 footer ────────────────────────────────────────────────────
    doc.moveTo(36, PH - 32).lineTo(PW - 36, PH - 32).strokeColor(C.border).lineWidth(0.5).stroke();
    doc.fillColor(C.accent).fontSize(8).font('Outfit-Bold')
       .text('digest', 36, PH - 22, { lineBreak: false });
    doc.fillColor(C.textMuted).fontSize(8).font('Outfit-Regular')
       .text(isAr ? fixArabic('١ من ٢') : 'Page 1 of 2', 0, PH - 22, { width: PW, align: 'center', lineBreak: false });

    // ===================================================================
    // PAGE 2 — Activity, Grocery & Recipe
    // ===================================================================
    doc.addPage();
    doc.rect(0, 0, PW, PH).fill(C.bg);

    // Dark header bar
    doc.rect(0, 0, PW, 74).fill(C.header);
    doc.rect(0, 70, PW, 4).fill(C.headerStrip);
    doc.fillColor(C.accent).fontSize(10).font('Outfit-Bold')
       .text('digest', 36, 14, { lineBreak: false });
    const p2Title = isAr ? fixArabic('التدريبات والتسوق والوصفات') : 'Activity, Grocery & Recipes';
    doc.fillColor(C.white).fontSize(16).font('Outfit-Bold')
       .text(p2Title, 36, 34, { lineBreak: false });

    // ── Workouts card ────────────────────────────────────────────────────
    const W_CARD_Y = 86;
    const workList = (workoutLogs || []).slice(0, 4);
    const W_CARD_H = workList.length > 0 ? 52 + workList.length * 28 + 14 : 78;
    doc.roundedRect(36, W_CARD_Y, PW - 72, W_CARD_H, 10).fillAndStroke(C.card, C.border);
    doc.roundedRect(36, W_CARD_Y, 4, W_CARD_H, 2).fill(C.calColor);

    const workTitle = isAr ? fixArabic('سجل التدريبات') : 'Workouts Log';
    doc.fillColor(C.textPrimary).fontSize(11).font(fBold)
       .text(workTitle, 48, W_CARD_Y + 14, { lineBreak: false, align: isAr ? 'right' : 'left', width: PW - 96 });

    const workSubText = isAr
      ? fixArabic(`${totalWorkoutsCount} تدريب  ·  ${totalCaloriesBurned} سعرة محروقة`)
      : `${totalWorkoutsCount} workouts  ·  ${totalCaloriesBurned} kcal burned`;
    doc.fillColor(C.textMuted).fontSize(8.5).font(fReg)
       .text(workSubText, 48, W_CARD_Y + 30, { lineBreak: false, align: isAr ? 'right' : 'left', width: PW - 96 });

    if (workList.length === 0) {
      const emptyMsg = isAr ? fixArabic('لا توجد تدريبات هذا الأسبوع.') : 'No workouts logged this week.';
      doc.fillColor(C.textMuted).fontSize(9).font(fReg)
         .text(emptyMsg, 48, W_CARD_Y + 50, { lineBreak: false });
    } else {
      let wY = W_CARD_Y + 52;
      workList.forEach((w: any) => {
        const actName = isAr ? w.activity_name_ar : w.activity_name_en;
        const detail  = `${w.duration_minutes} ${isAr ? 'دق' : 'min'}  ·  -${w.calories_burned} kcal`;

        if (isAr) {
          // Arabic: detail on LEFT (numerics), name on RIGHT
          doc.fillColor(C.textMuted).fontSize(9).font('Inter-Regular')
             .text(detail, 50, wY + 1, { lineBreak: false });
          doc.fillColor(C.textPrimary).fontSize(9.5).font('Amiri-Bold')
             .text(fixArabic(actName), 0, wY, { width: PW - 50, align: 'right', lineBreak: false });
        } else {
          doc.fillColor(C.textPrimary).fontSize(9.5).font('Outfit-SemiBold')
             .text(actName, 50, wY, { lineBreak: false });
          doc.fillColor(C.textMuted).fontSize(9).font('Inter-Regular')
             .text(detail, 0, wY + 1, { width: PW - 50, align: 'right', lineBreak: false });
        }
        doc.moveTo(50, wY + 17).lineTo(PW - 50, wY + 17)
           .strokeColor(C.border).lineWidth(0.5).stroke();
        wY += 26;
      });
    }

    // ── Grocery card ─────────────────────────────────────────────────────
    const G_CARD_Y = W_CARD_Y + W_CARD_H + 12;
    const G_CARD_H = 195;
    doc.roundedRect(36, G_CARD_Y, PW - 72, G_CARD_H, 10).fillAndStroke(C.card, C.border);
    doc.roundedRect(36, G_CARD_Y, 4, G_CARD_H, 2).fill(C.carbColor);

    const grocTitle = isAr ? fixArabic('قائمة التسوق') : 'Grocery Shopping List';
    const grocSub   = isAr ? fixArabic('من خطة وجباتك') : 'From your meal plan';
    doc.fillColor(C.textPrimary).fontSize(11).font(fBold)
       .text(grocTitle, 48, G_CARD_Y + 14, { lineBreak: false, align: isAr ? 'right' : 'left', width: PW - 96 });
    doc.fillColor(C.textMuted).fontSize(8).font(fReg)
       .text(grocSub, 48, G_CARD_Y + 30, { lineBreak: false, align: isAr ? 'right' : 'left', width: PW - 96 });

    // Extract grocery items
    let listItems: string[] = [];
    if (latestPlan?.grocery_list) {
      const raw = latestPlan.grocery_list;
      if (Array.isArray(raw)) {
        listItems = raw.map((item: any) => {
          if (typeof item === 'string') return item;
          return item.name_en || item.name_ar || item.name || item.ingredient || item.item || '';
        });
      } else if (typeof raw === 'object' && raw !== null) {
        const nested = (raw as any).items || (raw as any).grocery || (raw as any).list;
        if (Array.isArray(nested)) {
          listItems = nested.map((item: any) =>
            typeof item === 'string' ? item : (item.name_en || item.name_ar || item.name || '')
          );
        }
      }
    }
    listItems = listItems.filter(Boolean);
    if (listItems.length === 0) {
      listItems = profile.country === 'EG'
        ? ['فول مدمس', 'بيض بلدي', 'جبن قريش', 'جرجير طازج', 'خبز بلدي', 'زيت زيتون', 'طماطم', 'فراخ']
        : ['Organic Eggs', 'Greek Yogurt', 'Fresh Spinach', 'Rolled Oats', 'Whole Wheat Bread', 'Olive Oil', 'Chicken', 'Salmon'];
    }

    // 2-column checklist — layout driven by whether the ITEMS are Arabic,
    // not the profile language. This handles English-profile users who have
    // Arabic grocery items (e.g. Egyptian meals stored as Arabic names).
    const G_LIST_Y  = G_CARD_Y + 52;
    const HALF      = PW / 2;   // ~297
    const MARGIN    = 50;
    const CB_SIZE   = 9;
    const COL_GAP   = 18;

    // Detect from the actual items — if majority are Arabic, go RTL
    const arabicItemCount = listItems.filter(i => containsArabic(i)).length;
    const groceryRTL = arabicItemCount > listItems.length / 2;

    listItems.slice(0, 10).forEach((item, idx) => {
      const isFirstCol = idx % 2 === 0;
      const rowY       = G_LIST_Y + Math.floor(idx / 2) * 26;
      const font       = itemFont(item);
      const display    = itemText(item);

      if (!groceryRTL) {
        // LTR: even → left column, odd → right column
        // [□ text              ]  [□ text              ]
        const colX = isFirstCol ? MARGIN : HALF + COL_GAP;
        doc.roundedRect(colX, rowY + 2, CB_SIZE, CB_SIZE, 2)
           .strokeColor(C.accent).lineWidth(1).stroke();
        doc.fillColor(C.textPrimary).fontSize(9).font(font)
           .text(display, colX + CB_SIZE + 5, rowY, { lineBreak: false });
      } else {
        // RTL: even → RIGHT column, odd → LEFT column
        // [           text □]  [           text □]
        // Right column spans: HALF + COL_GAP  →  PW - MARGIN
        // Left  column spans: MARGIN          →  HALF - COL_GAP
        const colStart = isFirstCol ? HALF + COL_GAP : MARGIN;
        const colEnd   = isFirstCol ? PW - MARGIN     : HALF - COL_GAP;
        const cbX      = colEnd - CB_SIZE;           // checkbox hugs the right edge
        const textW    = cbX - colStart - 5;         // text fills the space to its left
        doc.roundedRect(cbX, rowY + 2, CB_SIZE, CB_SIZE, 2)
           .strokeColor(C.accent).lineWidth(1).stroke();
        doc.fillColor(C.textPrimary).fontSize(9).font(font)
           .text(display, colStart, rowY, { width: textW, align: 'right', lineBreak: false });
      }
    });

    // ── Recipe spotlight card ─────────────────────────────────────────────
    const R_CARD_Y = G_CARD_Y + G_CARD_H + 12;
    const R_CARD_H = 130;
    doc.roundedRect(36, R_CARD_Y, PW - 72, R_CARD_H, 10).fill(C.accentLight);
    doc.roundedRect(36, R_CARD_Y, 4, R_CARD_H, 2).fill(C.accent);

    const isEG    = profile.country === 'EG';
    const recTitle = isEG
      ? (isAr ? 'شوربة العدس المصرية' : 'Egyptian Lentil Soup')
      : (isAr ? 'شوفان بالتفاح والقرفة' : 'Apple Cinnamon Overnight Oats');
    const recDesc = isEG
      ? (isAr ? 'مصدر غني بالبروتين النباتي والألياف والحديد.' : 'Rich in plant-based protein, fiber, and iron to fuel your day.')
      : (isAr ? 'إفطار صحي غني بالمعادن والألياف بطيئة الامتصاص.' : 'Wholesome breakfast packed with minerals and slow-release carbs.');
    const recMacros = isEG
      ? (isAr ? 'السعرات: ٢٩٠  |  بروتين: ١٨جم  |  ألياف: ١٢جم' : 'Calories: 290 kcal  |  Protein: 18g  |  Fiber: 12g')
      : (isAr ? 'السعرات: ٢٥٠  |  بروتين: ٩جم  |  ألياف: ٧جم'  : 'Calories: 250 kcal  |  Protein: 9g  |  Fiber: 7g');

    const recTagLabel = isAr ? fixArabic('الوصفة المقترحة') : 'RECOMMENDED RECIPE';
    doc.fillColor(C.accent).fontSize(7.5).font('Outfit-Bold')
       .text(recTagLabel, 48, R_CARD_Y + 14, { lineBreak: false, align: isAr ? 'right' : 'left', width: PW - 96 });
    doc.fillColor(C.textPrimary).fontSize(12).font(isAr ? 'Amiri-Bold' : 'Outfit-Bold')
       .text(fixArabic(recTitle), 48, R_CARD_Y + 30, { lineBreak: false, align: isAr ? 'right' : 'left', width: PW - 96 });
    doc.fillColor(C.textMuted).fontSize(9).font(isAr ? 'Amiri' : 'Outfit-Regular')
       .text(fixArabic(recDesc), 48, R_CARD_Y + 50, { width: PW - 96, lineBreak: false, align: isAr ? 'right' : 'left' });
    doc.fillColor(C.accent).fontSize(9).font(isAr ? 'Amiri-Bold' : 'Inter-Bold')
       .text(fixArabic(recMacros), 48, R_CARD_Y + 76, { lineBreak: false, align: isAr ? 'right' : 'left', width: PW - 96 });

    // ── Page 2 footer ────────────────────────────────────────────────────
    doc.moveTo(36, PH - 32).lineTo(PW - 36, PH - 32).strokeColor(C.border).lineWidth(0.5).stroke();
    doc.fillColor(C.accent).fontSize(8).font('Outfit-Bold')
       .text('digest', 36, PH - 22, { lineBreak: false });
    doc.fillColor(C.textMuted).fontSize(8).font('Outfit-Regular')
       .text(isAr ? fixArabic('٢ من ٢') : 'Page 2 of 2', 0, PH - 22, { width: PW, align: 'center', lineBreak: false });

    // ── Compile PDF ───────────────────────────────────────────────────────
    const pdfBytesPromise = new Promise<Uint8Array>((resolve, reject) => {
      doc.on('end', () => {
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const buffer = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
        resolve(buffer);
      });
      doc.on('error', (err: any) => reject(err));
    });
    doc.end();
    const pdfBytes = await pdfBytesPromise;

    // 1. Proactive Sweeper — delete files older than 1 hour
    try {
      const { data: listData, error: listError } = await supabase.storage.from('reports').list(userId);
      if (listError) throw listError;
      if (listData && listData.length > 0) {
        const now = Date.now();
        const filesToDelete: string[] = [];
        for (const f of listData) {
          if (now - new Date(f.created_at).getTime() > 3600000) {
            filesToDelete.push(`${userId}/${f.name}`);
          }
        }
        if (filesToDelete.length > 0) {
          const { error: sweepErr } = await supabase.storage.from('reports').remove(filesToDelete);
          if (sweepErr) console.error('Sweeper removal error:', sweepErr.message);
        }
      }
    } catch (sweepErr: any) {
      console.error('Sweeper background warning:', sweepErr.message);
    }

    // 2. Pre-generation cleanup — clear user's existing reports
    try {
      const { data: currentFiles, error: currentFilesError } = await supabase.storage.from('reports').list(userId);
      if (currentFilesError) throw currentFilesError;
      if (currentFiles && currentFiles.length > 0) {
        const toClean = currentFiles.map((f: any) => `${userId}/${f.name}`);
        const { error: cleanErr } = await supabase.storage.from('reports').remove(toClean);
        if (cleanErr) console.error('Pre-generation cleanup error:', cleanErr.message);
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
        upsert: true,
      });
    if (uploadError) {
      status = 500;
      throw new Error(uploadError.message);
    }

    // 4. Generate 5-minute signed URL
    const { data: signedData, error: signedError } = await supabase.storage
      .from('reports')
      .createSignedUrl(filePath, 300);
    if (signedError || !signedData) {
      status = 500;
      throw new Error(signedError?.message || 'Failed to generate secure signed link');
    }

    return new Response(JSON.stringify({ url: signedData.signedUrl, fileName: uniqueFileName }), {
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
