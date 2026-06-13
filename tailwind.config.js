/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'bg-base': '#F8F9F8',
        'bg-card': '#FFFFFF',
        'border-muted': '#EAECEB',
        'text-primary': '#1A1E1C',
        'text-muted': '#626A66',
        'accent-sage': '#4C6E58',
        'accent-mint': '#E2ECD7',
        'nutrient-calories': '#E58C73',
        'nutrient-protein': '#7E9DB0',
        'nutrient-carbs': '#D3B177',
        'nutrient-fats': '#9CA19E',
      },
      fontFamily: {
        'outfit': ['Outfit-Regular', 'sans-serif'],
        'outfit-bold': ['Outfit-Bold', 'sans-serif'],
        'outfit-semibold': ['Outfit-SemiBold', 'sans-serif'],
        'outfit-medium': ['Outfit-Medium', 'sans-serif'],
        'inter': ['Inter-Regular', 'sans-serif'],
        'inter-medium': ['Inter-Medium', 'sans-serif'],
        'inter-bold': ['Inter-Bold', 'sans-serif'],
        'inter-regular': ['Inter-Regular', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
