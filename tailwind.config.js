/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'bg-base': 'var(--bg-base)',
        'bg-card': 'var(--bg-card)',
        'border-muted': 'var(--border-muted)',
        'text-primary': 'var(--text-primary)',
        'text-muted': 'var(--text-muted)',
        'accent-sage': 'var(--accent-sage)',
        'accent-mint': 'var(--accent-mint)',
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

