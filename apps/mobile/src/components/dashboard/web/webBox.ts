import { Platform, type ViewStyle } from 'react-native'
import { useTheme } from '../../../theme/ThemeProvider'
import { useWorkspace } from '../../../layout/useWorkspace'

/**
 * Regra única de bloco na web (computador): todo cartão, painel e campo grande usa
 * o mesmo canto, a mesma borda fina e o mesmo recuo, sem sombra. No celular cada
 * componente segue com o próprio estilo.
 */
export const WEB_BOX = { radius: 16, padX: 20, padY: 16 } as const

/** true na web com barra lateral (computador) */
export function useWebDesk(): boolean
{
  const { showRail } = useWorkspace()
  return Platform.OS === 'web' && showRail
}

/** Estilo da caixa padrão no computador; null fora dele (cada um mantém o seu). */
export function useWebBox(): ViewStyle | null
{
  const { colors } = useTheme()
  const desk = useWebDesk()
  if (!desk) return null
  return {
    borderRadius: WEB_BOX.radius,
    borderWidth: 1,
    // cartão branco sobre o fundo claro, contorno só de leve (como um painel de sistema)
    borderColor: colors.cardRim,
    backgroundColor: colors.elevated,
    paddingHorizontal: WEB_BOX.padX,
    paddingVertical: WEB_BOX.padY,
  }
}
