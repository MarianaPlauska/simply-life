import type { ViewStyle } from 'react-native'

/**
 * Permite propriedades CSS puras (grid, cursor, transition) em arquivos
 * .web.tsx, que só rodam sob react-native-web e nunca no app nativo.
 */
export function webStyle<T extends Record<string, unknown>>(style: T): ViewStyle
{
  return style as unknown as ViewStyle
}
