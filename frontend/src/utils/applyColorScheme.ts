import type { ColorScheme } from '../store/storeTypes'

const THEME_COLOR: Record<ColorScheme, string> = {
  dark: '#1E1C18',
  light: '#F7F5F2',
}

/** Chave de dispositivo — escrita na hora, sem esperar o persist Zustand. */
export const COLOR_SCHEME_STORAGE_KEY = 'simply-life-color-scheme'

export function persistColorScheme(scheme: ColorScheme): void
{
  if (typeof localStorage === 'undefined') return
  try
  {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, scheme)
  }
  catch
  {
    /* Safari privado / quota */
  }
}

export function readDedicatedColorScheme(): ColorScheme | null
{
  if (typeof localStorage === 'undefined') return null
  try
  {
    const raw = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)
    if (raw === 'dark' || raw === 'light') return raw
  }
  catch
  {
    /* ignore */
  }
  return null
}

export function parseColorScheme(value: unknown): ColorScheme | null
{
  if (value === 'dark' || value === 'light') return value
  if (value === 'sepia') return 'light'
  return null
}

// Aplica tema claro / escuro no documento (não grava — quem escolhe o tema chama persistColorScheme)

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

/** Escolha explícita do usuário: DOM + disco, na mesma ação. */
export function rememberAndApplyColorScheme(scheme: ColorScheme): void
{
  persistColorScheme(scheme)
  applyColorScheme(scheme)
}

export const COLOR_SCHEME_OPTIONS: { id: ColorScheme; label: string; hint: string }[] = [
  { id: 'light', label: 'Claro', hint: 'Off-white + voz do AXEL' },
  { id: 'dark', label: 'Escuro', hint: 'Grafite à noite' },
]
