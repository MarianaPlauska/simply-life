/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    /* Bloco H: mobile <768 · tablet 768–1023 · desktop ≥1024 (md/lg padrão) */
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        /* Cinzas fixos (zinc, gray...) seguem o tema: escala --g-* no index.css.
           Escritos para fundo escuro, agora funcionam no claro e no escuro. */
        zinc: { 50: 'rgb(var(--g-50) / <alpha-value>)', 100: 'rgb(var(--g-100) / <alpha-value>)', 200: 'rgb(var(--g-200) / <alpha-value>)', 300: 'rgb(var(--g-300) / <alpha-value>)', 400: 'rgb(var(--g-400) / <alpha-value>)', 500: 'rgb(var(--g-500) / <alpha-value>)', 600: 'rgb(var(--g-600) / <alpha-value>)', 700: 'rgb(var(--g-700) / <alpha-value>)', 800: 'rgb(var(--g-800) / <alpha-value>)', 900: 'rgb(var(--g-900) / <alpha-value>)', 950: 'rgb(var(--g-950) / <alpha-value>)' },
        neutral: { 50: 'rgb(var(--g-50) / <alpha-value>)', 100: 'rgb(var(--g-100) / <alpha-value>)', 200: 'rgb(var(--g-200) / <alpha-value>)', 300: 'rgb(var(--g-300) / <alpha-value>)', 400: 'rgb(var(--g-400) / <alpha-value>)', 500: 'rgb(var(--g-500) / <alpha-value>)', 600: 'rgb(var(--g-600) / <alpha-value>)', 700: 'rgb(var(--g-700) / <alpha-value>)', 800: 'rgb(var(--g-800) / <alpha-value>)', 900: 'rgb(var(--g-900) / <alpha-value>)', 950: 'rgb(var(--g-950) / <alpha-value>)' },
        gray: { 50: 'rgb(var(--g-50) / <alpha-value>)', 100: 'rgb(var(--g-100) / <alpha-value>)', 200: 'rgb(var(--g-200) / <alpha-value>)', 300: 'rgb(var(--g-300) / <alpha-value>)', 400: 'rgb(var(--g-400) / <alpha-value>)', 500: 'rgb(var(--g-500) / <alpha-value>)', 600: 'rgb(var(--g-600) / <alpha-value>)', 700: 'rgb(var(--g-700) / <alpha-value>)', 800: 'rgb(var(--g-800) / <alpha-value>)', 900: 'rgb(var(--g-900) / <alpha-value>)', 950: 'rgb(var(--g-950) / <alpha-value>)' },
        slate: { 50: 'rgb(var(--g-50) / <alpha-value>)', 100: 'rgb(var(--g-100) / <alpha-value>)', 200: 'rgb(var(--g-200) / <alpha-value>)', 300: 'rgb(var(--g-300) / <alpha-value>)', 400: 'rgb(var(--g-400) / <alpha-value>)', 500: 'rgb(var(--g-500) / <alpha-value>)', 600: 'rgb(var(--g-600) / <alpha-value>)', 700: 'rgb(var(--g-700) / <alpha-value>)', 800: 'rgb(var(--g-800) / <alpha-value>)', 900: 'rgb(var(--g-900) / <alpha-value>)', 950: 'rgb(var(--g-950) / <alpha-value>)' },
        stone: { 50: 'rgb(var(--g-50) / <alpha-value>)', 100: 'rgb(var(--g-100) / <alpha-value>)', 200: 'rgb(var(--g-200) / <alpha-value>)', 300: 'rgb(var(--g-300) / <alpha-value>)', 400: 'rgb(var(--g-400) / <alpha-value>)', 500: 'rgb(var(--g-500) / <alpha-value>)', 600: 'rgb(var(--g-600) / <alpha-value>)', 700: 'rgb(var(--g-700) / <alpha-value>)', 800: 'rgb(var(--g-800) / <alpha-value>)', 900: 'rgb(var(--g-900) / <alpha-value>)', 950: 'rgb(var(--g-950) / <alpha-value>)' },
        /* Aliases Bloco H */
        'bg-canvas': 'var(--bg-canvas, var(--sl-canvas))',
        'bg-surface': 'var(--bg-surface, var(--sl-surface))',
        'bg-elevated': 'var(--bg-elevated, var(--sl-elevated))',
        'border-hairline': 'var(--border-hairline, var(--sl-border))',
        'text-primary': 'var(--text-primary, var(--sl-text))',
        'text-muted-h': 'var(--text-muted, var(--sl-text-muted))',
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
        control: 'var(--sl-radius-control)',
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
        sans: ['"Lexend"', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        'ui-caption': ['0.75rem', { lineHeight: '1rem' }],
        'ui-body': ['0.8125rem', { lineHeight: '1.25rem' }],
        'ui-title': ['1rem', { lineHeight: '1.375rem' }],
        'ui-heading': ['1.75rem', { lineHeight: '2.125rem' }],
        /* Bloco H — H1 / H2 / hero / body */
        h1: ['1.75rem', { lineHeight: '2.125rem', fontWeight: '700' }],
        'h1-md': ['2rem', { lineHeight: '2.375rem', fontWeight: '700' }],
        'h1-lg': ['2.25rem', { lineHeight: '2.625rem', fontWeight: '700' }],
        h2: ['1rem', { lineHeight: '1.375rem', fontWeight: '600' }],
        'h2-md': ['1.0625rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        'h2-lg': ['1.125rem', { lineHeight: '1.625rem', fontWeight: '600' }],
        hero: ['1.375rem', { lineHeight: '1.75rem', fontWeight: '700' }],
        'hero-md': ['1.625rem', { lineHeight: '2rem', fontWeight: '700' }],
        'hero-lg': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],
      },
    },
  },
  plugins: [],
}
