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
        background: '#08090D',
        secondary: '#0D1018',
        elevated: '#121622',
        card: '#151A27',
        'card-hover': '#1C2333',
        border: 'rgba(255, 255, 255, 0.08)',
        'border-highlight': 'rgba(255, 255, 255, 0.16)',
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
        accent: {
          violet: '#A78BFA',
          indigo: '#818CF8',
          cyan: '#22D3EE',
          emerald: '#34D399',
          amber: '#FBBF24',
          rose: '#FB7185',
        },
        primary: {
          DEFAULT: '#818CF8',
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#818CF8',
          600: '#6366F1',
          700: '#4F46E5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-violet': '0 0 35px -5px rgba(167, 139, 250, 0.18)',
        'glow-cyan': '0 0 35px -5px rgba(34, 211, 238, 0.18)',
        'glow-sm': '0 0 15px -2px rgba(129, 140, 248, 0.12)',
        'card': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
      },
      keyframes: {
        equalize: {
          '0%, 100%': { height: '20%' },
          '50%': { height: '100%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
        }
      },
      animation: {
        'equalize-fast': 'equalize 0.8s ease-in-out infinite',
        'equalize-slow': 'equalize 1.4s ease-in-out infinite',
        'equalize-mid': 'equalize 1.1s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
