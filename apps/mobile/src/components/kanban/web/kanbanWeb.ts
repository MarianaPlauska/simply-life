import type { TextStyle } from 'react-native'
import { useTheme } from '../../../theme/ThemeProvider'

/** Fundo do hover nas linhas: um degrau visível nos dois temas (no claro surface é branco como o cartão). */
export function useRowHover(): string
{
  const { colors, mode } = useTheme()
  return mode === 'dark' ? colors.surface : colors.canvas
}

/** Lexend por peso (Text não aceita fontWeight: o peso vem da família). */
export const LEX = {
  regular: { fontFamily: 'Lexend_400Regular' } as TextStyle,
  medium: { fontFamily: 'Lexend_500Medium' } as TextStyle,
  semibold: { fontFamily: 'Lexend_600SemiBold' } as TextStyle,
}

/** Rótulo de seção nas colunas do computador: 13px, sem caixa alta gritando. */
export const SECTION_LABEL: TextStyle = { fontSize: 13, lineHeight: 18, fontFamily: 'Lexend_500Medium', letterSpacing: 0.2 }
