import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useWindowDimensions } from 'react-native'
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
import { readColorSchemeSync } from '../lib/sync/prefs'

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

function persistMode(next: ThemeMode): void
{
  void usePrefsStore.getState().patch({ color_scheme: next })
}

export function ThemeProvider({
  children,
  forceMode,
}: {
  children: ReactNode
  forceMode?: ThemeMode
})
{
  const scheme = usePrefsStore((s) => s.prefs.color_scheme)
  const prefsLoaded = usePrefsStore((s) => s.loaded)
  const hydrate = usePrefsStore((s) => s.hydrate)
  const boot = useMemo(() => readColorSchemeSync(), [])
  const mode: ThemeMode = forceMode ?? (prefsLoaded ? scheme : boot ?? scheme) ?? 'light'
  const { width } = useWindowDimensions()
  const largeText = usePrefsStore((s) => s.prefs.a11y_large_text)
  const highContrast = usePrefsStore((s) => s.prefs.a11y_high_contrast)

  useEffect(() =>
  {
    if (forceMode) return
    void hydrate()
  }, [hydrate, forceMode])

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
      toggleMode: () => persistMode(mode === 'dark' ? 'light' : 'dark'),
      setMode: persistMode,
    }
  }, [mode, largeText, highContrast, width, forceMode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue
{
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
