/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060d1a',
          900: '#0a1628',
          800: '#0f2040',
          700: '#152a55',
          600: '#1c3668',
        },
        charcoal: {
          900: '#111318',
          800: '#1a1d23',
          700: '#22262f',
          600: '#2c313c',
          500: '#617a6a',
          400: '#8a9e90',
        },
        egreen: {
          DEFAULT: '#52b87e',
          dim: '#3a9060',
          muted: '#2a6845',
        },
        eamber: {
          DEFAULT: '#c8a040',
          dim: '#a07830',
        },
        ered: {
          DEFAULT: '#c4604a',
          dim: '#a04838',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'green-glow': '0 0 20px rgba(82,184,126,0.3), 0 0 60px rgba(82,184,126,0.1)',
        'green-glow-sm': '0 0 10px rgba(82,184,126,0.5)',
        'amber-glow': '0 0 20px rgba(200,160,64,0.3), 0 0 60px rgba(200,160,64,0.1)',
        'red-glow': '0 0 20px rgba(196,96,74,0.3), 0 0 60px rgba(196,96,74,0.1)',
        'panel': '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      animation: {
        'breathe': 'breathe 4s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'countdown': 'countdown 60s linear forwards',
        'slide-up': 'slideUp 0.35s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(0.98)' },
          '50%': { opacity: '1', transform: 'scale(1.01)' },
        },
        countdown: {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '283' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateX(-50%) translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateX(-50%) translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
