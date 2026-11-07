/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf8f3',
          100: '#faeee1',
          200: '#f3dac2',
          300: '#eac099',
          400: '#dfa06d',
          500: '#d6854b',
          600: '#c86e3e',
          700: '#a75735',
          800: '#864730',
          900: '#6d3b29',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

