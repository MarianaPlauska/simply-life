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
        // Instrumento — tokens semânticos
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
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        display: ['Newsreader', 'Georgia', '"Times New Roman"', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
