import type { ColorScheme } from '../store/storeTypes'

// Aplica tema claro/escuro no documento (Tailwind darkMode: class)

export function applyColorScheme(scheme: ColorScheme): void
{
  const root = document.documentElement
  root.classList.toggle('dark', scheme === 'dark')
  root.style.colorScheme = scheme

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta)
  {
    meta.setAttribute('content', scheme === 'dark' ? '#141312' : '#F4F1EA')
  }
}
