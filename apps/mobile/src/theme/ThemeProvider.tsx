import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import {
  colorsFor,
  type ColorTokens,
  type ThemeMode,
  type ElevationSet,
  RADIUS,
  SPACE,
  TYPE_SCALE,
  ELEVATION,
} from '@simply-life/ui-tokens'

type ThemeContextValue = {
  mode: ThemeMode
  colors: ColorTokens
  radius: typeof RADIUS
  space: typeof SPACE
  type: typeof TYPE_SCALE
  elevation: ElevationSet
  toggleMode: () => void
  setMode: (m: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode })
{
  const system = useColorScheme()
  const [override, setOverride] = useState<ThemeMode | null>(null)
  const mode: ThemeMode = override ?? (system === 'light' ? 'light' : 'dark')

  const value = useMemo<ThemeContextValue>(() =>
  {
    const colors = colorsFor(mode)
    return {
      mode,
      colors,
      radius: RADIUS,
      space: SPACE,
      type: TYPE_SCALE,
      elevation: mode === 'light' ? ELEVATION.light : ELEVATION.dark,
      toggleMode: () => setOverride((prev) =>
      {
        const current = prev ?? (system === 'light' ? 'light' : 'dark')
        return current === 'light' ? 'dark' : 'light'
      }),
      setMode: setOverride,
    }
  }, [mode, system])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue
{
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
