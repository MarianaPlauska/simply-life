import { chartColor } from '@simply-life/ui-tokens'
import { useTheme } from './ThemeProvider'

/**
 * Cores de destaque que não são ação. Coral fica só em botões e no +.
 * - select*: filtro ou opção escolhida (petróleo no claro, menta no escuro).
 * - data*: séries de gráfico, na ordem teal, azul, ardósia; o verde fica por último.
 */
export function useAccents()
{
  const { colors, chart, mode } = useTheme()
  const dark = mode === 'dark'
  const data = chartColor(chart, 'teal')
  return {
    selectBg: dark ? colors.brandInk : colors.brand,
    selectFg: dark ? colors.brandDeep : colors.onBrand,
    /** contorno ou tinta de algo selecionado sem preenchimento */
    selectInk: dark ? colors.brandInk : colors.brand,
    data,
    dataMuted: `${data}33`,
    data2: chartColor(chart, 'blue'),
    data3: chartColor(chart, 'slate'),
    data4: chartColor(chart, 'violet'),
    data5: chartColor(chart, 'amber'),
  }
}
