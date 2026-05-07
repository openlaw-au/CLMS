/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          soft: 'var(--color-primary-soft)',
        },
        clerk: {
          DEFAULT: 'var(--color-clerk)',
          hover: 'var(--color-clerk-hover)',
        },
        text: {
          DEFAULT: 'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          subtle: 'var(--color-surface-subtle)',
          muted: 'var(--color-surface-muted)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          light: 'var(--color-border-light)',
          strong: 'var(--color-border-strong)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        info: 'var(--color-info)',
        danger: 'var(--color-danger)',
        legislation: 'rgb(var(--color-legislation-rgb) / <alpha-value>)',
      },
      borderRadius: {
        'metric-card': 'var(--radius-metric-card)',
        hero: 'var(--radius-hero)',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
        'page-title': ['var(--font-size-page)', { lineHeight: '1.25' }],
        'section-title': ['var(--font-size-section)', { lineHeight: '1.33' }],
        'card-title': ['var(--font-size-card-title)', { lineHeight: '1.4' }],
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        metric: 'var(--shadow-metric)',
        'metric-hover': 'var(--shadow-metric-hover)',
        'metric-loading': 'var(--shadow-metric-loading)',
        soft: '0 10px 30px rgba(15, 23, 42, 0.08)',
      },
    },
  },
};
