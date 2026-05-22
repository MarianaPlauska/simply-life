/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // O seu Design System focado em baixa fadiga ocular
        fundo: '#000000',     // True Black — OLED / contraste infinito
        card: '#090514',      // Roxo-cinza ultracescuro (data containers)
        urgente: '#ef4444',   // red-500 (Acelerador: Urgência máxima)
        atencao: '#f59e0b',   // amber-500 (Acelerador: Atenção)
        concluido: '#10b981', // emerald-500 (Baixa fricção / Feito)
        ia: '#8b5cf6',        // violet-500 (Ações da Inteligência Artificial)
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}