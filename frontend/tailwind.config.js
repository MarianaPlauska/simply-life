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
        voice: 'var(--sl-voice)',
        ink: 'var(--sl-text)',
        'ink-muted': 'var(--sl-text-muted)',
        'ink-faint': 'var(--sl-text-faint)',
        line: 'var(--sl-border)',
        accent: {
          DEFAULT: 'var(--sl-accent)',
          hover: 'var(--sl-accent-hover)',
          muted: 'var(--sl-accent-muted)',
        },
        axel: {
          DEFAULT: 'var(--sl-axel)',
          hover: 'var(--sl-axel-hover)',
          muted: 'var(--sl-axel-muted)',
        },
        health: {
          DEFAULT: 'var(--sl-health)',
          muted: 'var(--sl-health-muted)',
        },
        finance: {
          DEFAULT: 'var(--sl-finance)',
          muted: 'var(--sl-finance-muted)',
        },
        tasks: {
          DEFAULT: 'var(--sl-tasks)',
          muted: 'var(--sl-tasks-muted)',
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
        voice: 'var(--sl-shadow-voice)',
      },
      fontFamily: {
        sans: ['"Manrope"', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        'ui-caption': ['0.75rem', { lineHeight: '1rem' }],
        'ui-body': ['1rem', { lineHeight: '1.5rem' }],
        'ui-title': ['0.9375rem', { lineHeight: '1.375rem' }],
        'ui-heading': ['1.125rem', { lineHeight: '1.5rem' }],
      },
    },
  },
  plugins: [],
}
