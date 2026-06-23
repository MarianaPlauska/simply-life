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
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
