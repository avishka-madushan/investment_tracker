/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0a0a0f',
        glassBg: 'rgba(255, 255, 255, 0.04)',
        glassBorder: 'rgba(255, 255, 255, 0.08)',
        glassCardBg: 'rgba(20, 20, 28, 0.65)',
        textMain: '#e0e0e0',
        textMuted: 'rgba(255, 255, 255, 0.6)',
        accentSuccess: '#34d399',
        accentDanger: '#f87171',
        accentIndigo: '#6366f1',
        accentPurple: '#a855f7',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #6366f1, #a855f7)',
        'accent-btn': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      },
      boxShadow: {
        glass: '0 4px 24px rgba(0, 0, 0, 0.3)',
        'glass-hover': '0 8px 32px rgba(0, 0, 0, 0.4)',
        accent: '0 8px 24px rgba(99, 102, 241, 0.35)',
      },
      animation: {
        'bg-shift': 'bgShift 15s ease-in-out infinite alternate',
        'float-slow': 'float 10s ease-in-out infinite',
        'float-delayed': 'float 10s ease-in-out 5s infinite',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        bgShift: {
          '0%': { opacity: '0.7', transform: 'scale(1)' },
          '100%': { opacity: '1', transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-40px) rotate(5deg)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
