/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: '#080810',
        surface: '#0f0f1a',
        card: '#141428',
        'card-hover': '#1a1a35',
        glass: 'rgba(20, 20, 50, 0.6)',
        cyan: {
          DEFAULT: '#00d4ff',
          dim: '#00a8cc'
        },
        amber: {
          DEFAULT: '#ffaa00'
        },
        green: {
          DEFAULT: '#00ff88'
        },
        red: {
          DEFAULT: '#ff4466'
        },
        purple: {
          DEFAULT: '#a855f7'
        },
        primary: '#eef0ff',
        secondary: '#8890bb',
        muted: '#4a5080',
        border: 'rgba(100, 110, 200, 0.15)',
        'border-bright': 'rgba(0, 212, 255, 0.3)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.25)',
        'glow-red': '0 0 20px rgba(255, 68, 102, 0.4)',
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.25)',
        'glow-amber': '0 0 20px rgba(255, 170, 0, 0.3)',
      },
      animation: {
        'pulse-dot': 'pulse-dot 1s infinite',
        'flow-item': 'flow-item 1.4s linear infinite',
        'bottleneck-pulse': 'bottleneck-pulse 1.5s ease-in-out infinite',
        'slide-in': 'slide-in 0.2s ease',
        'slide-in-slow': 'slide-in 0.3s ease',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.4)' },
        },
        'flow-item': {
          '0%': { left: '0%', opacity: '0' },
          '10%, 90%': { opacity: '1' },
          '100%': { left: '100%', opacity: '0' },
        },
        'bottleneck-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 68, 102, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 68, 102, 0.6)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        }
      }
    },
  },
  plugins: [],
}
