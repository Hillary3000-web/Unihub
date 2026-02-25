/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy:  { DEFAULT: '#0F2044', 50: '#E8EDF5', 100: '#C5D1E8', 200: '#8BA3CC', 300: '#5175B0', 400: '#2A4F94', 500: '#0F2044', 600: '#0C1A38', 700: '#09132A', 800: '#060D1C', 900: '#03060E' },
        gold:  { DEFAULT: '#C9972A', light: '#E8B84B', dark: '#9A7120' },
        cream: '#FAF8F3',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(15,32,68,0.08)',
        glow: '0 0 32px rgba(201,151,42,0.2)',
      },
      animation: {
        'fade-up':   'fadeUp 0.5s ease forwards',
        'fade-in':   'fadeIn 0.4s ease forwards',
        'slide-in':  'slideIn 0.3s ease forwards',
      },
      keyframes: {
        fadeUp:  { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { transform: 'translateX(-16px)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
      },
    },
  },
  plugins: [],
}