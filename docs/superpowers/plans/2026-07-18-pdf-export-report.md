# PDF Health Summary Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the weekly PDF health summary report generator via a Supabase Edge Function using PDFKit and integrate it into the profile page with automatic cleanup.

**Architecture:** The client calls a `generate-pdf-report` Edge Function. The function aggregates database data, fetches AI insights from Gemini, renders a 2-page PDF in-memory using PDFKit, uploads it to a private Supabase Storage bucket, and returns a short-lived (5-minute) signed URL. Once downloaded/shared, the client calls the function again to immediately delete the file.

**Tech Stack:** Deno, Supabase Edge Functions, PDFKit (NPM), Expo FileSystem, Expo Sharing, Supabase Client, TypeScript.

---

### Task 1: Supabase Storage Bucket & RLS Setup

**Files:**
* Modify: `supabase_schema.sql`

- [ ] **Step 1: Append Storage Bucket initialization and RLS Policies to `supabase_schema.sql`**

Append the following SQL commands to `d:\digest\supabase_schema.sql` at the end of the file:

```sql
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
```

- [ ] **Step 2: Commit Task 1**

```bash
git add supabase_schema.sql
git commit -m "feat: add reports storage bucket and RLS policies"
```

---

### Task 2: Edge Function Skeleton & Boilerplate

**Files:**
* Create: `supabase/functions/generate-pdf-report/index.ts`

- [ ] **Step 1: Create the basic Edge Function handler with CORS and client validation**

Create `d:\digest\supabase\functions\generate-pdf-report\index.ts` with the following skeleton:

```typescript
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

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Server credentials are not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Invalid or expired session');
    }

    const userId = user.id;
    const body = await req.json().catch(() => ({}));

    // Handle delete action
    if (body.action === 'delete' && body.fileName) {
      const filePath = `${userId}/${body.fileName}`;
      const { error: deleteError } = await supabase.storage.from('reports').remove([filePath]);
      if (deleteError) throw deleteError;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: "Skeleton active", userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
```

- [ ] **Step 2: Commit Task 2**

```bash
git add supabase/functions/generate-pdf-report/index.ts
git commit -m "feat: skeleton for generate-pdf-report Edge Function"
```

---

### Task 3: Database Queries inside the Edge Function

**Files:**
* Modify: `supabase/functions/generate-pdf-report/index.ts`

- [ ] **Step 1: Implement data aggregation queries for the past 7 days**

Replace the end of the skeleton in `d:\digest\supabase\functions\generate-pdf-report\index.ts` (the return block) with database loading code:

```typescript
    // Fetch profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (profileErr || !profile) throw new Error('Profile not found');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split('T')[0];

    // Fetch food logs joined with foods cache
    const { data: foodLogs, error: foodErr } = await supabase
      .from('food_logs')
      .select('amount_g, logged_date, foods_cache(*)')
      .eq('user_id', userId)
      .gte('logged_date', dateStr);
    if (foodErr) throw foodErr;

    // Fetch water logs
    const { data: waterLogs, error: waterErr } = await supabase
      .from('water_logs')
      .select('amount_ml, logged_date')
      .eq('user_id', userId)
      .gte('logged_date', dateStr);
    if (waterErr) throw waterErr;

    // Fetch workout logs
    const { data: workoutLogs, error: workoutErr } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_date', dateStr);
    if (workoutErr) throw workoutErr;

    // Fetch latest active meal plan
    const { data: mealPlans, error: mealErr } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (mealErr) throw mealErr;
    const latestPlan = mealPlans?.[0] || null;
```

- [ ] **Step 2: Commit Task 3**

```bash
git add supabase/functions/generate-pdf-report/index.ts
git commit -m "feat: query logs and profile in generate-pdf-report Edge Function"
```

---

### Task 4: AI Insights with Gemini

**Files:**
* Modify: `supabase/functions/generate-pdf-report/index.ts`

- [ ] **Step 1: Write helper function to query Gemini and generate summary**

Add the prompt generator and fetch call inside `d:\digest\supabase\functions\generate-pdf-report\index.ts`:

```typescript
    // Aggregation math for AI prompt
    const totalCal = foodLogs.reduce((acc, log) => acc + (Number(log.amount_g) * Number(log.foods_cache.calories_per_100g) / 100), 0);
    const avgCal = Math.round(totalCal / 7);

    const totalProtein = foodLogs.reduce((acc, log) => acc + (Number(log.amount_g) * Number(log.foods_cache.protein_per_100g) / 100), 0);
    const avgProtein = Math.round(totalProtein / 7);

    const totalCarbs = foodLogs.reduce((acc, log) => acc + (Number(log.amount_g) * Number(log.foods_cache.carbs_per_100g) / 100), 0);
    const avgCarbs = Math.round(totalCarbs / 7);

    const totalFat = foodLogs.reduce((acc, log) => acc + (Number(log.amount_g) * Number(log.foods_cache.fat_per_100g) / 100), 0);
    const avgFat = Math.round(totalFat / 7);

    const totalWater = waterLogs.reduce((acc, log) => acc + Number(log.amount_ml), 0);
    const avgWater = Math.round(totalWater / 7);

    const totalWorkoutsCount = workoutLogs.length;
    const totalCaloriesBurned = Math.round(workoutLogs.reduce((acc, log) => acc + Number(log.calories_burned), 0));

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
Provide ONLY the response without any formatting or preambles.`;

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
```

- [ ] **Step 2: Commit Task 4**

```bash
git add supabase/functions/generate-pdf-report/index.ts
git commit -m "feat: integrate Gemini AI health insights generation"
```

---

### Task 5: PDF Drawing with PDFKit

**Files:**
* Modify: `supabase/functions/generate-pdf-report/index.ts`

- [ ] **Step 1: Write PDF generation routine using Deno PDFKit**

Append the PDFKit importing and PDF drawing logic:

```typescript
    // Deno PDFKit import (requires esm.sh)
    // Deno compatibility helper for Buffer
    import PDFDocument from "npm:pdfkit";

    const doc = new PDFDocument({ margin: 36, size: 'A4' });

    const chunks: Uint8Array[] = [];
    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    
    // Draw Page 1
    // Color variables
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

    // Page 1 background
    doc.rect(0, 0, 595.28, 841.89).fill(bgBase);

    // Header
    doc.fillColor(accentSage).fontSize(16).font('Helvetica-Bold').text('digest', 36, 36);
    doc.fillColor(textPrimary).fontSize(20).font('Helvetica-Bold').text(isAr ? 'التقرير الصحي الأسبوعي' : 'Weekly Health Summary', 36, 60);
    
    const dateRangeStr = `${dateStr}  to  ${new Date().toISOString().split('T')[0]}`;
    doc.fillColor(textMuted).fontSize(10).font('Helvetica').text(dateRangeStr, 36, 85);
    doc.text(`${isAr ? 'العضو' : 'Member'}: ${clientName}  |  ${isAr ? 'الهدف' : 'Goal'}: ${healthGoal}`, 36, 100);

    // AI Insight Card
    doc.roundedRect(36, 125, 523.28, 75, 12).fillAndStroke(accentMint, accentSage);
    doc.fillColor(accentSage).fontSize(11).font('Helvetica-Bold').text(isAr ? 'رؤى الذكاء الاصطناعي:' : 'AI Insights:', 50, 137);
    doc.fillColor(textPrimary).fontSize(9.5).font('Helvetica-BoldOblique').text(`"${aiInsight}"`, 50, 152, { width: 495 });

    // Macronutrients Card
    doc.roundedRect(36, 215, 523.28, 195, 12).fillAndStroke(bgCard, borderMuted);
    doc.fillColor(textPrimary).fontSize(12).font('Helvetica-Bold').text(isAr ? 'المغذيات الكبرى (متوسط يومي)' : 'Macronutrient Performance (Daily Avg)', 50, 230);

    const drawProgressBar = (label: string, actual: number, target: number, color: string, yPos: number, unit: string) => {
      doc.fillColor(textPrimary).fontSize(10).font('Helvetica-Bold').text(label, 50, yPos);
      doc.fillColor(textMuted).fontSize(10).font('Helvetica').text(`${actual} / ${target} ${unit}`, 450, yPos, { width: 90, align: 'right' });
      
      // Bar background
      doc.roundedRect(50, yPos + 15, 490, 8, 4).fill('#EAECEB');
      
      // Actual fill
      const percent = Math.min(actual / (target || 1), 1);
      if (percent > 0) {
        doc.roundedRect(50, yPos + 15, 490 * percent, 8, 4).fill(color);
      }
    };

    drawProgressBar(isAr ? 'السعرات الحرارية' : 'Calories', avgCal, targetCal, colorCal, 260, 'kcal');
    drawProgressBar(isAr ? 'البروتين' : 'Protein', avgProtein, targetProtein, colorProt, 295, 'g');
    drawProgressBar(isAr ? 'الكربوهيدرات' : 'Carbohydrates', avgCarbs, targetCarbs, colorCarb, 330, 'g');
    drawProgressBar(isAr ? 'الدهون' : 'Fats', avgFat, targetFat, colorFat, 365, 'g');

    // Two Columns Split: Micro Nutrients & Water Summary
    // Left: Micros
    doc.roundedRect(36, 425, 250, 180, 12).fillAndStroke(bgCard, borderMuted);
    doc.fillColor(textPrimary).fontSize(11).font('Helvetica-Bold').text(isAr ? 'المغذيات الدقيقة (متوسط)' : 'Micronutrients (Daily Avg)', 50, 440);
    
    // Group and calculate micronutrients average
    let avgIron = 0, avgCalcium = 0, avgSodium = 0, avgPotassium = 0;
    foodLogs.forEach(l => {
      const micros = l.foods_cache.micros || {};
      const amtFactor = Number(l.amount_g) / 100;
      if (micros.iron) avgIron += (Number(micros.iron) * amtFactor);
      if (micros.calcium) avgCalcium += (Number(micros.calcium) * amtFactor);
      if (micros.sodium) avgSodium += (Number(micros.sodium) * amtFactor);
      if (micros.potassium) avgPotassium += (Number(micros.potassium) * amtFactor);
    });
    avgIron = Math.round((avgIron / 7) * 10) / 10;
    avgCalcium = Math.round(avgCalcium / 7);
    avgSodium = Math.round(avgSodium / 7);
    avgPotassium = Math.round(avgPotassium / 7);

    const drawMicroRow = (label: string, value: string, y: number) => {
      doc.fillColor(textMuted).fontSize(9.5).font('Helvetica').text(label, 50, y);
      doc.fillColor(textPrimary).fontSize(9.5).font('Helvetica-Bold').text(value, 200, y, { width: 75, align: 'right' });
      doc.moveTo(50, y + 14).lineTo(270, y + 14).strokeColor(borderMuted).lineWidth(0.5).stroke();
    };

    drawMicroRow(isAr ? 'الحديد' : 'Iron', `${avgIron} mg`, 470);
    drawMicroRow(isAr ? 'الكالسيوم' : 'Calcium', `${avgCalcium} mg`, 500);
    drawMicroRow(isAr ? 'الصوديوم' : 'Sodium', `${avgSodium} mg`, 530);
    drawMicroRow(isAr ? 'البوتاسيوم' : 'Potassium', `${avgPotassium} mg`, 560);

    // Right: Water
    doc.roundedRect(309, 425, 250, 180, 12).fillAndStroke(bgCard, borderMuted);
    doc.fillColor(textPrimary).fontSize(11).font('Helvetica-Bold').text(isAr ? 'معدل شرب الماء اليومي' : 'Water Intake (Daily Avg)', 323, 440);
    
    // Draw simple water indicator
    doc.fillColor('#7E9DB0').fontSize(14).font('Helvetica-Bold').text(`${avgWater} ml`, 323, 470);
    doc.fillColor(textMuted).fontSize(9.5).font('Helvetica').text(`${isAr ? 'الهدف:' : 'Target:'} ${targetWater} ml`, 323, 490);
    
    // Water progress bar
    doc.roundedRect(323, 515, 222, 10, 5).fill('#EAECEB');
    const waterPct = Math.min(avgWater / (targetWater || 1), 1);
    if (waterPct > 0) {
      doc.roundedRect(323, 515, 222 * waterPct, 10, 5).fill('#7E9DB0');
    }
    doc.fillColor(textMuted).fontSize(9.5).font('Helvetica-Oblique').text(
      waterPct >= 1 
        ? (isAr ? '✓ تم تحقيق هدف المياه بنجاح!' : '✓ Water goal achieved!')
        : (isAr ? `تبقّى ${Math.max(0, targetWater - avgWater)} مل لتحقيق الهدف` : `${Math.max(0, targetWater - avgWater)} ml left to target`),
      323, 540, { width: 220 }
    );

    // Page number
    doc.fillColor(textMuted).fontSize(9).font('Helvetica').text('Page 1 of 2', 36, 800, { width: 523.28, align: 'center' });

    // PAGE 2
    doc.addPage();
    doc.rect(0, 0, 595.28, 841.89).fill(bgBase);

    // Header 2
    doc.fillColor(accentSage).fontSize(12).font('Helvetica-Bold').text('digest', 36, 36);
    doc.fillColor(textPrimary).fontSize(16).font('Helvetica-Bold').text(isAr ? 'التدريبات وقائمة البقالة والوصفات' : 'Workouts, Grocery & Recommendations', 36, 55);

    // Workouts Card
    doc.roundedRect(36, 85, 523.28, 195, 12).fillAndStroke(bgCard, borderMuted);
    doc.fillColor(textPrimary).fontSize(12).font('Helvetica-Bold').text(isAr ? 'سجل الأنشطة والتدريبات' : 'Activity & Workouts Log', 50, 100);
    doc.fillColor(textMuted).fontSize(10).font('Helvetica').text(`${isAr ? 'إجمالي التدريبات:' : 'Total Workouts:'} ${totalWorkoutsCount} | ${isAr ? 'السعرات المحروقة:' : 'Calories Burned:'} ${totalCaloriesBurned} kcal`, 50, 120);

    // Render Workouts table
    let yWork = 145;
    workoutLogs.slice(0, 4).forEach((workout) => {
      const actName = isAr ? workout.activity_name_ar : workout.activity_name_en;
      doc.fillColor(textPrimary).fontSize(9.5).font('Helvetica-Bold').text(actName, 50, yWork);
      doc.fillColor(textMuted).fontSize(9.5).font('Helvetica').text(`${workout.duration_minutes} ${isAr ? 'دقيقة' : 'mins'} | -${workout.calories_burned} kcal`, 300, yWork);
      doc.moveTo(50, yWork + 14).lineTo(545, yWork + 14).strokeColor(borderMuted).lineWidth(0.5).stroke();
      yWork += 25;
    });
    if (totalWorkoutsCount === 0) {
      doc.fillColor(textMuted).fontSize(10).font('Helvetica-Oblique').text(isAr ? 'لم يتم تسجيل تدريبات هذا الأسبوع.' : 'No workouts logged this week.', 50, 155);
    }

    // Grocery List Checklist Card
    doc.roundedRect(36, 295, 523.28, 220, 12).fillAndStroke(bgCard, borderMuted);
    doc.fillColor(textPrimary).fontSize(12).font('Helvetica-Bold').text(isAr ? 'قائمة التسوق المقترحة' : 'Grocery Shopping List (from plan)', 50, 310);

    let listItems: string[] = [];
    if (latestPlan && latestPlan.grocery_list) {
      try {
        const rawList = latestPlan.grocery_list;
        if (Array.isArray(rawList)) {
          listItems = rawList.map((item: any) => typeof item === 'string' ? item : (item.name || item.name_en || ''));
        }
      } catch (_) {}
    }

    if (listItems.length === 0) {
      // Fallback Egyptian/UK grocery items
      listItems = profile.country === 'EG' 
        ? ['فول مدمس', 'بيض بلدي', 'جبن قريش', 'جرجير طازج', 'خبز بلدي كامل الحبة', 'زيت زيتون بكر']
        : ['Organic Eggs', 'Greek Yogurt', 'Fresh Spinach', 'Rolled Oats', 'Whole Wheat Bread', 'Olive Oil'];
    }

    let yGroc = 335;
    listItems.slice(0, 7).forEach((item, index) => {
      const col = index % 2 === 0 ? 50 : 300;
      const rowY = yGroc + Math.floor(index / 2) * 22;
      
      // Draw checkbox
      doc.strokeColor(accentSage).lineWidth(1).roundedRect(col, rowY, 10, 10, 2).stroke();
      doc.fillColor(textPrimary).fontSize(9.5).font('Helvetica').text(item, col + 18, rowY + 1);
    });

    // Localized Recipe Spotlight
    doc.roundedRect(36, 530, 523.28, 140, 12).fillAndStroke(accentMint, borderMuted);
    doc.fillColor(accentSage).fontSize(11).font('Helvetica-Bold').text(isAr ? '★ وصفة مقترحة مخصصة لك:' : '★ Recommended Recipe for You:', 50, 545);

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

    doc.fillColor(textPrimary).fontSize(10).font('Helvetica-Bold').text(recTitle, 50, 565);
    doc.fillColor(textMuted).fontSize(9).font('Helvetica').text(recDesc, 50, 580, { width: 495 });
    doc.fillColor(accentSage).fontSize(9).font('Helvetica-Bold').text(recMacros, 50, 615);

    // Footer 2
    doc.fillColor(textMuted).fontSize(9).font('Helvetica').text('Page 2 of 2', 36, 800, { width: 523.28, align: 'center' });

    // End stream
    doc.end();
```

- [ ] **Step 2: Commit Task 5**

```bash
git add supabase/functions/generate-pdf-report/index.ts
git commit -m "feat: draw 2-page PDF kit report layout with Deno PDFKit"
```

---

### Task 6: PDF Upload, Signed URL & Storage Sweeper

**Files:**
* Modify: `supabase/functions/generate-pdf-report/index.ts`

- [ ] **Step 1: Collect stream buffer, write upload logic, return signed URL**

Modify `d:\digest\supabase\functions\generate-pdf-report\index.ts` to accumulate chunks, run proactive sweeper, and upload:

```typescript
    // Collect PDF stream into Uint8Array
    const pdfBytes = await new Promise<Uint8Array>((resolve, reject) => {
      const interval = setInterval(() => {
        if (doc.closed || (doc as any)._ended) {
          clearInterval(interval);
          
          // Concatenate chunks
          const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
          const buffer = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            buffer.set(chunk, offset);
            offset += chunk.length;
          }
          resolve(buffer);
        }
      }, 50);
    });

    // 1. Proactive Sweeper - Delete files older than 1 hour in background
    try {
      const { data: listData } = await supabase.storage.from('reports').list(userId);
      if (listData && listData.length > 0) {
        const now = Date.now();
        const filesToDelete: string[] = [];
        listData.forEach((f: any) => {
          const createdAt = new Date(f.created_at).getTime();
          if (now - createdAt > 3600000) { // 1 hour
            filesToDelete.push(`${userId}/${f.name}`);
          }
        });
        if (filesToDelete.length > 0) {
          await supabase.storage.from('reports').remove(filesToDelete);
        }
      }
    } catch (sweepErr) {
      console.error('Sweeper background warning:', sweepErr);
    }

    // 2. Pre-generation cleanup: delete user's current directory files
    try {
      const { data: currentFiles } = await supabase.storage.from('reports').list(userId);
      if (currentFiles && currentFiles.length > 0) {
        const toClean = currentFiles.map((f: any) => `${userId}/${f.name}`);
        await supabase.storage.from('reports').remove(toClean);
      }
    } catch (cleanErr) {
      console.error('Pre-generation cleanup warning:', cleanErr);
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
    if (uploadError) throw uploadError;

    // 4. Generate 5-minute signed URL
    const { data: signedData, error: signedError } = await supabase.storage
      .from('reports')
      .createSignedUrl(filePath, 300); // 300 seconds = 5 minutes
    if (signedError || !signedData) throw new Error('Failed to generate secure signed link');

    return new Response(JSON.stringify({ 
      url: signedData.signedUrl, 
      fileName: uniqueFileName 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
```

- [ ] **Step 2: Commit Task 6**

```bash
git add supabase/functions/generate-pdf-report/index.ts
git commit -m "feat: complete PDFKit stream conversion, storage upload, signed link, and sweeps"
```

---

### Task 7: Integrate Edge Function Call & Auto-Cleanup on Mobile Client

**Files:**
* Modify: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Replace simulated `handleExportPDF` and integrate Sharing / File System download**

Open `d:\digest\app\(tabs)\profile.tsx`. Locate lines 434-447:

```typescript
  const handleExportPDF = async () => {
    if (!isSignedIn) {
      triggerSignUp();
      return;
    }

    setExporting(true);
    setExportSuccessUrl(null);

    setTimeout(() => {
      setExporting(false);
      setExportSuccessUrl('https://supabase.co/storage/v1/object/public/reports/digest_summary.pdf');
    }, 2000);
  };
```

Replace it with the following code. We'll use `expo-file-system` to download the file locally to cache and then use `expo-sharing` to share it. After completion, we invoke the deletion API on the Edge function.

First check if imports for `FileSystem` and `Sharing` are present. If not, import them inside the file:
```typescript
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
```

Replace the `handleExportPDF` and add download trigger handlers:

```typescript
  const [reportFileName, setReportFileName] = useState<string | null>(null);

  const handleExportPDF = async () => {
    if (!isSignedIn) {
      triggerSignUp();
      return;
    }

    setExporting(true);
    setExportSuccessUrl(null);
    setReportFileName(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-pdf-report', {
        body: {},
      });

      if (error || !data || !data.url) {
        throw new Error(error?.message || 'Failed to generate report PDF');
      }

      setExportSuccessUrl(data.url);
      setReportFileName(data.fileName);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      Alert.alert(
        isRtl ? 'خطأ' : 'Error',
        isRtl ? 'فشل إنشاء تقرير PDF. يرجى المحاولة مرة أخرى.' : 'Failed to generate PDF report. Please try again.'
      );
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadAndSharePDF = async () => {
    if (!exportSuccessUrl || !reportFileName) return;

    try {
      const localUri = `${FileSystem.cacheDirectory}${reportFileName}`;
      
      // Download signed PDF locally
      const downloadResult = await FileSystem.downloadAsync(exportSuccessUrl, localUri);
      
      if (downloadResult.status !== 200) {
        throw new Error('PDF download failed');
      }

      // Check if sharing is available and share
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: isRtl ? 'تحميل التقرير الصحي' : 'Download Health Summary',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert(
          isRtl ? 'مشاركة غير مدعومة' : 'Sharing not available',
          isRtl ? 'لا يدعم هذا الجهاز مشاركة الملفات.' : 'This device does not support file sharing.'
        );
      }

      // Proactively clean up file on storage server immediately
      await supabase.functions.invoke('generate-pdf-report', {
        body: { action: 'delete', fileName: reportFileName },
      });

      // Clear state
      setExportSuccessUrl(null);
      setReportFileName(null);
      
      Alert.alert(
        isRtl ? 'تم بنجاح' : 'Success',
        isRtl ? 'تم تحميل ومشاركة التقرير الصحي بنجاح.' : 'Health report shared and downloaded successfully.'
      );
    } catch (error: any) {
      console.error('Download/Share PDF error:', error);
      Alert.alert(
        isRtl ? 'خطأ' : 'Error',
        isRtl ? 'فشل تحميل الملف. يرجى المحاولة لاحقاً.' : 'Failed to retrieve the file. Please try again.'
      );
    }
  };
```

Update the profile JSX at lines 558-568 to trigger `handleDownloadAndSharePDF` when the user clicks "Download PDF":

```tsx
          ) : exportSuccessUrl ? (
            <View className="mt-2">
              <Text className={`color-accent-sage text-xs font-outfit-bold mb-3 ${isRtl ? 'text-right' : 'text-left'}`}>✓ {t.pdfSuccess}</Text>
              <TouchableOpacity 
                onPress={handleDownloadAndSharePDF}
                className="bg-accent-sage rounded-xl py-3 flex-row items-center justify-center"
              >
                <Ionicons name="cloud-download-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text className="text-white text-xs font-outfit-bold">{t.pdfDownload}</Text>
              </TouchableOpacity>
            </View>
```

- [ ] **Step 2: Run verification and checks**

Run linter and check typescript compilation to verify no compile errors exist:
```bash
npm run typecheck
```

- [ ] **Step 3: Commit Task 7**

```bash
git add app/\(tabs\)/profile.tsx
git commit -m "feat: connect PDF export UI to generate-pdf-report Edge Function with download/sharing and cleanup"
```
