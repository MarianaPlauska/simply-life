import { Children, createContext, useContext, type ReactNode } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'
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
  const items = Children.toArray(children)

  return (
    <View
      style={[
        {
          borderRadius: 16,
          backgroundColor: colors.elevated,
          borderWidth: 1,
          borderColor: colors.hairline,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {/* margem -1: esconde a linha de cima do primeiro bloco que aparecer */}
      <View style={{ marginTop: -1 }}>
        <InPanel.Provider value>
          {items.map((child, i) => (
            <PanelItem key={i}>{child}</PanelItem>
          ))}
        </InPanel.Provider>
      </View>
    </View>
  )
}

function PanelItem({ children }: { children: ReactNode })
{
  const { colors } = useTheme()
  return (
    <View
      // na web, item vazio some (bloco que retornou null não deixa espaço); dataSet é do react-native-web
      {...({ dataSet: { panelItem: '' } } as object)}
      style={{ paddingHorizontal: 20, paddingVertical: 18, borderTopWidth: 1, borderTopColor: colors.hairline }}
    >
      {children}
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
