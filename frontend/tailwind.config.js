/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fundo: 'var(--sl-canvas)',
        card: 'var(--sl-surface)',
        chrome: 'var(--sl-chrome)',
        elevated: 'var(--sl-elevated)',
        ink: 'var(--sl-text)',
        'ink-muted': 'var(--sl-text-muted)',
        line: 'var(--sl-border)',
        accent: {
          DEFAULT: 'var(--sl-accent)',
          hover: 'var(--sl-accent-hover)',
          muted: 'var(--sl-accent-muted)',
        },
        urgente: 'var(--sl-urgent)',
        atencao: 'var(--sl-attention)',
        concluido: 'var(--sl-success)',
      },
      borderRadius: {
        sl: 'var(--sl-radius)',
        'sl-sm': 'var(--sl-radius-sm)',
        'sl-lg': 'var(--sl-radius-lg)',
        pill: 'var(--sl-radius-pill)',
      },
      boxShadow: {
        sl: 'var(--sl-shadow)',
        'sl-lg': 'var(--sl-shadow-lg)',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'ui-caption': ['0.75rem', { lineHeight: '1rem' }],
        'ui-body': ['0.8125rem', { lineHeight: '1.25rem' }],
        'ui-title': ['0.9375rem', { lineHeight: '1.375rem' }],
        'ui-heading': ['1.125rem', { lineHeight: '1.5rem' }],
      },
    },
  },
  plugins: [],
}
