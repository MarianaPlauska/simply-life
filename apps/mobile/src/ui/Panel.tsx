import { Children, createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'
import { useWebDesk } from '../components/dashboard/web/webBox'
import { SurfaceGlow } from './SurfaceGlow'
import { useTheme } from '../theme/ThemeProvider'

const InPanel = createContext(false)

/** true quando o bloco está dentro de um Panel: aí ele não desenha a própria caixa. */
export function useInPanel(): boolean
{
  return useContext(InPanel)
}

/**
 * Uma superfície só para vários blocos, separados por uma linha fina.
 * Evita a "caixa dentro de caixa": cada bloco filho deixa de ter fundo, borda e canto próprios.
 * Blocos que não têm nada a mostrar (retornam null) não deixam faixa vazia nem linha sobrando.
 */
export function Panel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> })
{
  const { colors } = useTheme()
  const desk = useWebDesk()
  const items = Children.toArray(children)
  const [filled, setFilled] = useState<Record<number, boolean>>({})
  const any = items.some((_c, i) => filled[i] === true)
  const reported = items.length > 0 && items.every((_c, i) => typeof filled[i] === 'boolean')

  const report = useCallback((i: number, has: boolean) =>
  {
    setFilled((prev) => (prev[i] === has ? prev : { ...prev, [i]: has }))
  }, [])

  const first = items.findIndex((_c, i) => filled[i] === true)

  if (items.length === 0 || (reported && !any)) return null

  return (
    <View
      style={[
        {
          borderRadius: desk ? 16 : 20,
          backgroundColor: any ? colors.elevated : 'transparent',
          borderWidth: any ? 1 : 0,
          borderColor: desk ? colors.cardRim : colors.hairline,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {any && !desk ? <SurfaceGlow /> : null}
      <InPanel.Provider value>
        {items.map((child, i) => (
          <PanelItem key={i} index={i} divider={i !== first} onFilled={report}>
            {child}
          </PanelItem>
        ))}
      </InPanel.Provider>
    </View>
  )
}

function PanelItem({
  children,
  index,
  divider,
  onFilled,
}: {
  children: ReactNode
  index: number
  divider: boolean
  onFilled: (i: number, has: boolean) => void
})
{
  const { colors } = useTheme()
  const [has, setHas] = useState<boolean | null>(null)

  if (has === false) return null

  return (
    <View
      style={
        has
          ? {
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderTopWidth: divider ? 1 : 0,
              borderTopColor: colors.hairline,
            }
          : { position: 'absolute', opacity: 0, pointerEvents: 'none' }
      }
    >
      <View
        onLayout={(e) =>
        {
          const next = e.nativeEvent.layout.height > 0
          setHas(next)
          onFilled(index, next)
        }}
      >
        {children}
      </View>
    </View>
  )
}

/**
 * Estilo da caixa de um bloco: fora de um Panel, como sempre; dentro, sem fundo, borda,
 * canto e recuo próprios. `flush` para listas cujas linhas já têm recuo lateral:
 * elas encostam na borda do Panel e o texto fica alinhado com o título.
 */
export function usePanelBox(style: ViewStyle, flush = false): ViewStyle
{
  const inPanel = useInPanel()
  if (!inPanel) return style
  const { borderRadius: _r, backgroundColor: _b, borderWidth: _w, borderColor: _c, padding: _p, ...rest } = style
  return { ...rest, ...(flush ? { marginHorizontal: -20 } : null) }
}
