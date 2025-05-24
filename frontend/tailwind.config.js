/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'medical-blue': '#4A90A4',  // Updated to Clear Health Pass blue
        'medical-green': '#A8DADC',
        'medical-amber': '#F77F00',
        'medical-red': '#C1121F',
        'medical-gray': '#F1FAEE',
        'medical-neutral': '#457B9D',
        brand: {
          primary: '#4A90A4',
          secondary: '#A8DADC',
          accent: '#F77F00',
          danger: '#C1121F',
          gray: '#F1FAEE',
          neutral: '#457B9D',
        },
        primary: {
          50: '#F0F7F9',
          100: '#E1EFF3',
          200: '#C3DFE7',
          300: '#A5CFDB',
          400: '#87BFCF',
          500: '#4A90A4',
          600: '#3B7383',
          700: '#2C5662',
          800: '#1D3941',
          900: '#0E1C20',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        'mobile': '320px',
        'tablet': '768px',
        'desktop': '1200px',
      },
      spacing: {
        'touch': '44px', // Minimum touch target size
        'sm': '32px',    // Small component height
        'md': '40px',    // Medium component height
        'lg': '48px',    // Large component height
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'bounce-soft': 'bounceSoft 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
} 