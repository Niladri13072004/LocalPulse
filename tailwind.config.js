/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          500: '#0284C7',
          600: '#025E8C',
          700: '#0369A1',
        },
        accent: {
          light: '#F59E0B',
          dark: '#D97706',
        },
        slate: {
          950: '#0F172A',
        }
      },
    },
  },
  plugins: [],
}
