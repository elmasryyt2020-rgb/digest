# Specification: My Recipes Section in Recommended Feed

Introduce a scrollable "My Recipes" section at the top of the Recommended tab (renamed to "My Recipes") in the Recipes feed. This section displays a horizontal list of custom recipes that the user has successfully generated using the AI Pantry search.

## Context & Motivation
Currently, users can generate recipes via the Pantry Search tab, but once they navigate away, they have no easy way to find and revisit those previously generated recipes from the main Recipes tab. Storing and displaying these generated recipes directly above standard recommendations helps users quickly access their customized culinary creations.

## Requirements
1. **Zustand State Integration**: Pull `generatedRecipes` from the `useDiaryStore`.
2. **Tab Location & Selector**: Renamed the selector tab segment from "Recommended" to "My Recipes" ("وصفاتي" in Arabic). Positioned the horizontal row inside this tab above standard recommended recipes.
3. **Layout & Interaction**:
   - Title: "My Recipes" (in English) / "وصفاتي" (in Arabic).
   - Empty State: If no recipes have been generated, show a clean placeholder card promoting the Pantry Search feature (e.g. "Create your first AI recipe"). Tapping it switches the active tab to `pantry`.
   - Populated State: A horizontally scrolling list (using a horizontal `<ScrollView>`) displaying cards for each generated recipe.
   - Tap Interaction: Tapping any card navigates to the detailed recipe page at `router.push('/recipes/[id]')`.
4. **Localization (ar/en support)**:
   - Match the user's selected language (`profile.language`).
   - Use correct RTL layouts for Arabic (e.g., horizontal scroll direction, text alignments).
5. **Aesthetics & Styling**:
   - Use NativeWind styling conforming to the project's premium minimalist theme.
   - Horizontal Card size: Matches standard recommended recipe cards exactly using `useWindowDimensions` (screen width minus padding, which is `screenWidth - 40`).
   - Image height set to `h-40`.
   - Cards display recipe image, title, description, and full macronutrients (calories, protein, carbs, and fats). Category tags are excluded. Horizontal ScrollView uses paging/snapping configurations for a premium feeling.
   - A clear section title (**"Recommended for You"** / **"وصفات مقترحة لك"**) is rendered between the horizontal slider and the standard recommended list.
