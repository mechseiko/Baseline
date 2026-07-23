/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        baseline: {
          'teal-900':       '#0E4B44',
          'teal-950':       '#082F2B',
          'clay-600':       '#B8703F',
          'alert-critical': '#D64545',
          'alert-watch':    '#E0A458',
          'stable-green':   '#4F9D8C',
          'bg-canvas':      '#F7FAF9',
          'surface':        '#FFFFFF',
          'ink-900':        '#12211F',
          'ink-500':        '#5C6B68',
          'border-subtle':  '#DCE6E3',
        },
      },
      fontFamily: {
        serif:  ['"IBM Plex Serif"', 'Georgia', 'serif'],
        sans:   ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono:   ['"IBM Plex Mono"', 'Menlo', 'monospace'],
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.3' },
        },
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'status-rise': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.97)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'pulse-dot':  'pulse-dot 1.4s ease-in-out infinite',
        'slide-in':   'slide-in 0.25s ease-out',
        'fade-in':    'fade-in 0.2s ease-out',
        'status-rise':'status-rise 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
