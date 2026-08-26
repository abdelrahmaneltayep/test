/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './index.artifact.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Only tokens that exist as published hex values in the Salla DS kit.
        // warning / info are deliberately absent — see src/tokens/twilight.ts.
        primary:     'var(--primary)',
        'primary-100':'var(--primary-100)',
        'primary-400':'var(--primary-400)',
        secondary:   'var(--secondary)',
        'secondary-100':'var(--secondary-100)',
        'gray-100':  'var(--gray-100)',
        'gray-200':  'var(--gray-200)',
        'gray-400':  'var(--gray-400)',
        'gray-500':  'var(--gray-500)',
        dark:        'var(--dark)',
        'dark-100':  'var(--dark-100)',
        'dark-200':  'var(--dark-200)',
        danger:      'var(--danger)',
        success:     'var(--success)',
      },
      borderRadius: { lg: 'var(--radius-lg)', xl: 'var(--radius-xl)' },
      boxShadow: { sm: 'var(--shadow-sm)' },
      fontFamily: { sans: ['PingARLT', 'IBM Plex Sans Arabic', 'PT Sans', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
