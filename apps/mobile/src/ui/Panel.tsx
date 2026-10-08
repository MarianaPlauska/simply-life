import { Children, createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native'
import { useWebDesk } from '../components/dashboard/web/webBox'
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
  const ref = useRef<View>(null)

  // web: bloco que retornou null deixa um item vazio; esconde o item e, se todos
  // estiverem vazios, o painel inteiro (não depende do :has do CSS do navegador)
  useEffect(() =>
  {
    if (Platform.OS !== 'web') return
    const el = ref.current as unknown as HTMLElement | null
    if (!el || typeof MutationObserver === 'undefined') return
    const sync = () =>
    {
      let any = false
      el.querySelectorAll<HTMLElement>(':scope > div > [data-panel-item]').forEach((it) =>
      {
        const has = it.childElementCount > 0
        it.style.display = has ? '' : 'none'
        if (has) any = true
      })
      el.style.display = any ? '' : 'none'
    }
    sync()
    const mo = new MutationObserver(sync)
    mo.observe(el, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [])

  return (
    <View
      ref={ref}
      // na web, Panel sem nenhum bloco com conteúdo some (regra em app/+html.tsx)
      {...({ dataSet: { panel: '' } } as object)}
      style={[
        {
          borderRadius: desk ? 16 : 12,
          backgroundColor: colors.elevated,
          borderWidth: 1,
          // computador (web): cartão branco, contorno só de leve
          borderColor: desk ? colors.cardRim : colors.hairline,
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
      style={{ paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.hairline }}
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
