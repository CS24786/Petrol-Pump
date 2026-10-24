/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36a8f7',
          500: '#0c8de7',
          600: '#026fc5',
          700: '#0358a0',
          800: '#074a83',
          900: '#0c3e6c',
          950: '#082747',
        },
        fuel: {
          diesel: '#f59e0b',
          petrol: '#10b981',
          oil: '#8b5cf6',
          cng: '#06b6d4',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-brand': '0 0 25px -5px rgba(12, 141, 231, 0.3)',
        'glow-fuel': '0 0 25px -5px rgba(245, 158, 11, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
