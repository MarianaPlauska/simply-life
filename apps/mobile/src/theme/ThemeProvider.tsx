import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useColorScheme, useWindowDimensions } from 'react-native'
import {
  colorsFor,
  type ColorTokens,
  type ThemeMode,
  type ElevationSet,
  type TypeRole,
  type TypeSpec,
  RADIUS,
  SPACE,
  typeScaleForWidth,
  ELEVATION,
} from '@simply-life/ui-tokens'
import { usePrefsStore } from '../store/prefsStore'

type ThemeContextValue = {
  mode: ThemeMode
  colors: ColorTokens
  radius: typeof RADIUS
  space: typeof SPACE
  type: Record<TypeRole, TypeSpec>
  elevation: ElevationSet
  toggleMode: () => void
  setMode: (m: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode })
{
  const system = useColorScheme()
  // Natural Tan: padrão claro. Override só se o usuário trocar.
  const [override, setOverride] = useState<ThemeMode | null>(null)
  const scheme = usePrefsStore((s) => s.prefs.color_scheme)
  const prefsLoaded = usePrefsStore((s) => s.loaded)
  const hydrate = usePrefsStore((s) => s.hydrate)
  const mode: ThemeMode = override ?? scheme ?? 'light'
  const { width } = useWindowDimensions()
  const largeText = usePrefsStore((s) => s.prefs.a11y_large_text)
  const highContrast = usePrefsStore((s) => s.prefs.a11y_high_contrast)

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  useEffect(() =>
  {
    // Sync prefs → tema (login e tabs) sem sobrescrever toggle em voo
    if (prefsLoaded && scheme && override == null)
    {
      setOverride(scheme)
    }
  }, [prefsLoaded, scheme, override])

  const value = useMemo<ThemeContextValue>(() =>
  {
    const base = colorsFor(mode)
    const colors = highContrast
      ? {
          ...base,
          inkMuted: base.ink,
          hairline: base.hairlineStrong,
        }
      : base
    const scale = largeText ? 1.12 : 1
    const raw = typeScaleForWidth(width)
    const type = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [
        k,
        {
          ...v,
          size: Math.round(v.size * scale),
          lineHeight: Math.round(v.lineHeight * scale),
        },
      ]),
    ) as Record<TypeRole, TypeSpec>
    return {
      mode,
      colors,
      radius: RADIUS,
      space: SPACE,
      type,
      elevation: mode === 'light' ? ELEVATION.light : ELEVATION.dark,
      toggleMode: () => setOverride((prev) =>
      {
        const current = prev ?? 'light'
        return current === 'light' ? 'dark' : 'light'
      }),
      setMode: setOverride,
    }
  }, [mode, system, largeText, highContrast, width])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue
{
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
