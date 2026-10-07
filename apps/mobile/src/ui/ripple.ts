import { Platform, type PressableAndroidRippleConfig } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'

/** Android mostra a "onda" de toque do sistema; no iPhone e na web o toque continua como era. */
export const IS_ANDROID = Platform.OS === 'android'

/**
 * Onda de toque do Android nas cores da marca.
 * `onFill`: o botão tem fundo forte (coral), então a onda é clara.
 */
export function useRipple(onFill = false): PressableAndroidRippleConfig | undefined
{
  const { mode } = useTheme()
  if (!IS_ANDROID) return undefined
  if (onFill) return { color: 'rgba(255, 255, 255, 0.22)' }
  return { color: mode === 'dark' ? 'rgba(238, 242, 240, 0.12)' : 'rgba(31, 42, 42, 0.10)' }
}
