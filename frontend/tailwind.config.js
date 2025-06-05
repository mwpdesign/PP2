/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Professional Healthcare Design System
        'medical-blue': '#4A90A4',
        'medical-green': '#A8DADC',
        'medical-amber': '#F77F00',
        'medical-red': '#C1121F',
        'medical-gray': '#F1FAEE',
        'medical-neutral': '#457B9D',

        // Dashboard Architecture Colors (matching existing pattern)
        'sidebar-dark': '#334155',  // Dark slate for sidebar
        'sidebar-active': '#375788', // Active state for sidebar items
        'content-bg': '#FFFFFF',    // White content background
        'text-primary': '#1E293B',  // High contrast text

        brand: {
          primary: '#475569',       // Slate-600 for buttons and accents
          secondary: '#A8DADC',
          accent: '#F77F00',
          success: '#059669',       // Emerald-600 for positive actions
          danger: '#C1121F',
          gray: '#F1FAEE',
          neutral: '#457B9D',
        },
        primary: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',           // Primary brand color
          700: '#334155',           // Sidebar color
          800: '#1E293B',           // Text primary
          900: '#0F172A',
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