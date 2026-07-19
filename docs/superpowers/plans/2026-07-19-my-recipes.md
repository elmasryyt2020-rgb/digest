# "My Recipes" Scrollable Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "My Recipes" scrollable section to the Recommended tab in recipes.tsx (above the standard recommendations) so users can tap and revisit any recipe they've generated, and rename the tab to "My Recipes".

**Architecture:** Retrieve `generatedRecipes` from the Zustand `useDiaryStore`. Insert a horizontal scrollable row of recipe cards that match the standard recommendations layout. If empty, show a call-to-action placeholder that switches tabs to pantry search. Add a text header between the sections. Rename segment tab header.

**Tech Stack:** React Native, Expo Router, NativeWind, Zustand

---

### Task 1: Update recipes.tsx with My Recipes Section

**Files:**
- Modify: `app/(tabs)/recipes.tsx`

- [x] **Step 1: Retrieve `generatedRecipes` from Zustand store**
  Find the existing store hook selectors and add `generatedRecipes`:
  ```typescript
  const generatedRecipes = useDiaryStore((state) => state.generatedRecipes);
  ```

- [x] **Step 2: Add translation keys and update tab label**
  Add keys for "My Recipes", empty state text, fats, recommended feed header, and update `recommend` key to "My Recipes" / "وصفاتي":
  ```typescript
  recommend: isRtl ? 'وصفاتي' : 'My Recipes',
  myRecipes: isRtl ? 'وصفاتي المبتكرة' : 'My Generated Recipes',
  createFirstRecipe: isRtl ? 'ابتكر وصفتك الأولى بالذكاء الاصطناعي!' : 'Create your first AI recipe!',
  tryPantrySearch: isRtl ? 'استخدم محتويات الثلاجة لابتكار وصفات مخصصة.' : 'Use pantry search to generate custom recipes.',
  fats: isRtl ? 'دهون' : 'fats',
  recommendedTitle: isRtl ? 'وصفات مقترحة لك' : 'Recommended for You',
  ```

- [x] **Step 3: Add My Recipes UI above the standard recommendations**
  Inside the main `<ScrollView>` of the `recommend` tab, above the `feedRecipes.map(...)` statement, insert the "My Recipes" UI block with cards matching standard feed aesthetics (showing description and shortened macros like `💪 12g` to prevent horizontal text overflow, and wrapping if necessary):
  ```tsx
  {/* My Recipes Section */}
  <View className="mb-6">
    <Text className={`text-sm font-outfit-bold text-text-primary mb-3 ${isRtl ? 'text-right' : 'text-left'}`}>
      {t.myRecipes}
    </Text>
    
    {generatedRecipes.length === 0 ? (
      <TouchableOpacity
        onPress={() => setActiveTab('pantry')}
        className="bg-bg-card border border-dashed border-border-muted rounded-3xl p-5 items-center justify-center"
        activeOpacity={0.7}
      >
        <View className="bg-accent-mint p-3 rounded-full mb-2">
          <Ionicons name="restaurant-outline" size={20} color={isDark ? '#5C856C' : '#4C6E58'} />
        </View>
        <Text className="text-xs font-outfit-bold text-text-primary mb-1 text-center">
          {t.createFirstRecipe}
        </Text>
        <Text className="text-[10px] font-inter-regular text-text-muted text-center">
          {t.tryPantrySearch}
        </Text>
      </TouchableOpacity>
    ) : (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + 16}
        decelerationRate="fast"
        snapToAlignment="start"
        contentContainerStyle={{ 
          flexDirection: isRtl ? 'row-reverse' : 'row',
          gap: 16
        }}
      >
        {generatedRecipes.map((recipe) => (
          <TouchableOpacity
            key={recipe.id}
            onPress={() => router.push(`/recipes/${recipe.id}` as any)}
            className="bg-bg-card rounded-3xl border border-border-muted overflow-hidden shadow-sm animate-none"
            style={{ width: cardWidth }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isRtl ? recipe.title_ar : recipe.title_en}
          >
            <RecipeImage 
              uri={recipe.image_url} 
              title={language === 'ar' ? recipe.title_ar : recipe.title_en}
              category={recipe.category}
              heightClass="h-40" 
            />
            <View className="p-4">
              <Text 
                numberOfLines={1}
                className={`text-sm font-outfit-bold text-text-primary mb-1.5 ${isRtl ? 'text-right' : 'text-left'}`}
              >
                {isRtl ? recipe.title_ar : recipe.title_en}
              </Text>
              
              <Text 
                numberOfLines={2} 
                className={`text-[11px] font-inter-regular text-text-muted leading-relaxed mb-3 ${isRtl ? 'text-right' : 'text-left'}`}
              >
                {isRtl ? recipe.description_ar : recipe.description_en}
              </Text>

              {/* Macros info strip */}
              <View className={`flex-row items-center flex-wrap ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Text className="text-[10px] font-inter-semibold text-text-muted">
                  🔥 {recipe.total_calories} {t.kcal} |
                </Text>
                <Text className="text-[10px] font-inter-semibold text-[#7E9DB0] ml-1">
                  💪 {recipe.total_protein_g}g {t.protein} |
                </Text>
                <Text className="text-[10px] font-inter-semibold text-[#D3B177] ml-1">
                  🌾 {recipe.total_carbs_g}g {t.carbs} |
                </Text>
                <Text className="text-[10px] font-inter-semibold text-[#9CA19E] ml-1">
                  🥑 {recipe.total_fat_g}g {t.fats}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    )}
  </View>
  ```

- [x] **Step 4: Add Section Header text between My Recipes and Recommended**
  Above the standard recommended feed, render the `recommendedTitle` header text:
  ```tsx
  {/* Recommended Section Header */}
  <Text className={`text-sm font-outfit-bold text-text-primary mb-3 mt-2 ${isRtl ? 'text-right' : 'text-left'}`}>
    {t.recommendedTitle}
  </Text>
  ```

- [x] **Step 5: Verify type safety and syntax correctness**
  Run: `npm run typecheck`
  Expected: Command completes successfully with no TypeScript compilation errors.
