/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,js}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        bg: { light: '#FAFAF7', dark: '#0F172A' },
        ink: { DEFAULT: '#1A1A1A', dark: '#F1F5F9' },
        muted: { DEFAULT: '#6B7280', dark: '#94A3B8' },
        sweblue: '#006AA7',
        sweyellow: '#FECC00',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
      },
      keyframes: {
        revealIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        cardIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'reveal-in': 'revealIn 220ms ease-out',
        'card-in': 'cardIn 260ms ease-out',
      },
    },
  },
  plugins: [],
}
