import type { ColorScheme } from '../store/storeTypes'

const THEME_COLOR: Record<ColorScheme, string> = {
  dark: '#1D2029',
  light: '#F4F4F2',
}

// Aplica tema claro / escuro no documento

export function applyColorScheme(scheme: ColorScheme): void
{
  const root = document.documentElement
  root.classList.remove('sepia')
  root.classList.toggle('dark', scheme === 'dark')
  root.style.colorScheme = scheme

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta)
  {
    meta.setAttribute('content', THEME_COLOR[scheme])
  }
}

export const COLOR_SCHEME_OPTIONS: { id: ColorScheme; label: string; hint: string }[] = [
  { id: 'light', label: 'Claro', hint: 'Cinza claro + laranja AXEL' },
  { id: 'dark', label: 'Escuro', hint: 'Menos luz à noite' },
]
