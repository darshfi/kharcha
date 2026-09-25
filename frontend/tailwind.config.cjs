/**
 * Tailwind is wired to the CSS custom properties in src/index.css.
 *
 * There are no literal color values here on purpose — every `colors.*` entry
 * resolves to `var(--token)`, which is redefined per theme. That means a
 * single class like `bg-surface` is correct in light and dark without a
 * `dark:` variant, and no color can drift out of sync with the token set.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        raised: 'var(--surface-raised)',
        line: 'var(--border)',

        fg: 'var(--text-primary)',
        muted: 'var(--text-secondary)',
        dim: 'var(--text-tertiary)',

        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-soft': 'var(--accent-soft)',
        'on-accent': 'var(--accent-contrast)',

        positive: 'var(--positive)',
        'positive-soft': 'var(--positive-soft)',
        negative: 'var(--negative)',
        'negative-soft': 'var(--negative-soft)',
        warning: 'var(--warning)',
        'warning-soft': 'var(--warning-soft)',

        track: 'var(--track)',
      },
      borderRadius: {
        card: '16px',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
