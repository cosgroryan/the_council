/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // All council colours are CSS variables so both themes work without rebuilding
        council: {
          bg:            'var(--c-bg)',
          surface:       'var(--c-surface)',
          card:          'var(--c-card)',
          'card-hover':  'var(--c-card-hover)',
          border:        'var(--c-border)',
          'border-light':'var(--c-border-light)',
          accent:        'var(--c-accent)',
          'accent-light':'var(--c-accent-light)',
          text:          'var(--c-text)',
          'text-muted':  'var(--c-text-muted)',
          'text-dim':    'var(--c-text-dim)',
          green:         'var(--c-green)',
          red:           'var(--c-red)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':        'fadeIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
