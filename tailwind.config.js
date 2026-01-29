/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Shippori Mincho', 'Yu Mincho', 'serif'],
        sans: ['BIZ UDGothic', 'Hiragino Kaku Gothic ProN', 'sans-serif'],
        display: ['Crimson Pro', 'Shippori Mincho', 'serif'],
      },
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
        },
        vermillion: {
          400: '#e85d4c',
          500: '#d64933',
          600: '#b83b28',
        },
        gold: {
          400: '#d4a84b',
          500: '#c49a3a',
          600: '#a8832e',
        },
        sage: {
          400: '#7dad93',
          500: '#5f9c7a',
          600: '#4a8565',
        },
        paper: {
          DEFAULT: '#faf8f5',
          dark: '#f3f0eb',
        },
        ink: {
          DEFAULT: '#1a1a1a',
          light: '#4a4a4a',
          muted: '#7a7a7a',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(8px)' },
          to: { transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.98)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
