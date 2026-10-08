import type { ViewStyle } from 'react-native'
import { useWorkspace } from '../../../layout/useWorkspace'
import { webStyle } from '../../dashboard/web/webStyle'
import { useWebDesk } from '../../dashboard/web/webBox'

/**
 * Grade da Carteira no computador: a mesma regra do Início (3 colunas a partir
 * de 1280, uma coluna antes). Só é usada quando useWebDesk() é true.
 */
export function useFinanceDeskGrid(): {
  wide: boolean
  grid: ViewStyle
  span2: ViewStyle
  spanAll: ViewStyle
}
{
  const { width } = useWorkspace()
  const wide = width >= 1280
  return {
    wide,
    grid: webStyle({
      display: 'grid',
      gridTemplateColumns: wide ? 'repeat(3, minmax(0, 1fr))' : 'minmax(0, 1fr)',
      gap: 16,
      alignItems: 'start',
    }),
    span2: webStyle({ gridColumn: wide ? 'span 2' : undefined }),
    spanAll: webStyle({ gridColumn: '1 / -1' }),
  }
}

/** Tira o "[Nubank] " do título quando a coluna Conta já mostra o cartão. */
export function cleanTxTitle(titulo: string): string
{
  return titulo.replace(/^\[[^\]]+\]\s*/, '')
}

/** Texto miúdo: 12px no celular, 13px no computador (nada abaixo de 13 na web). */
export function useDeskMicro(): 'label' | 'micro'
{
  return useWebDesk() ? 'label' : 'micro'
}

/** Tamanho do número grande (Fraunces) nos blocos: menor quando a coluna é estreita. */
export function useDeskBigNumber(): { fontSize: number; lineHeight: number }
{
  const { width } = useWorkspace()
  return width >= 1600 ? { fontSize: 36, lineHeight: 44 } : { fontSize: 30, lineHeight: 38 }
}
