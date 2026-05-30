/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        sidebar: '#0B0F19',
        canvas: '#F8FAFC',
        primary: {
          DEFAULT: '#6C5CE7',
          600: '#5a4bd1',
          700: '#4b3eb8',
        },
        accent: '#00D1B2',
        ink: {
          DEFAULT: '#111827',
          muted: '#6B7280',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)',
        card: '0 4px 14px rgba(16,24,40,.06)',
      },
      borderRadius: {
        xl2: '14px',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
    },
  },
  plugins: [],
}
