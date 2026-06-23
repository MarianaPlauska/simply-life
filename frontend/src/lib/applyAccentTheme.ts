import { ACCENT_PALETTES, type AccentId } from './userWorkspacePrefs'

// Aplica paleta de acento nas CSS variables do Instrumento

export function applyAccentTheme(accent: AccentId, colorScheme: 'light' | 'dark'): void
{
  const palette = ACCENT_PALETTES[accent] ?? ACCENT_PALETTES.meridian
  const main = colorScheme === 'dark' ? palette.dark : palette.light
  const hover = palette.hover
  const root = document.documentElement

  root.style.setProperty('--sl-accent', main)
  root.style.setProperty('--sl-accent-hover', hover)
  root.style.setProperty('--sl-accent-muted', hexToMuted(main, colorScheme === 'dark' ? 0.14 : 0.1))
}

function hexToMuted(hex: string, alpha: number): string
{
  const n = hex.replace('#', '')
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
