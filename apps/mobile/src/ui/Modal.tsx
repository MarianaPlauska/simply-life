import { useRef } from 'react'
import { Animated, Modal as RNModal, PanResponder, Platform, Pressable, View, type ModalProps } from 'react-native'
import { useWorkspace } from '../layout/useWorkspace'
import { useTheme } from '../theme/ThemeProvider'

/** Largura das fichas no computador: o suficiente para um formulário, sem esticar botões. */
export const DESKTOP_SHEET_WIDTH = 560

/** quanto arrastar para baixo (px) para fechar a ficha no celular */
const DRAG_CLOSE = 110

type Props = ModalProps & {
  /** ocupa a tela toda também no computador (ex.: animação de comemoração) */
  fullWidth?: boolean
  /** desliga o arrastar para fechar (ex.: telas que não são fichas de baixo) */
  noDrag?: boolean
}

/**
 * Modal do app.
 * Celular: o Modal do React Native, e dá para arrastar a ficha para baixo para fechar.
 * Computador: as fichas (feitas para o celular) ficam numa coluna centrada de
 * DESKTOP_SHEET_WIDTH, presa embaixo; os lados escurecem e fecham ao clicar.
 */
export function Modal({ children, fullWidth, noDrag, ...props }: Props)
{
  const { showRail } = useWorkspace()
  const { colors } = useTheme()
  const close = () => props.onRequestClose?.(undefined as never)

  // arrastar para fechar: só quando o gesto é claramente para baixo, para não brigar com a rolagem
  const dragY = useRef(new Animated.Value(0)).current
  const closeRef = useRef(close)
  closeRef.current = close
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => g.dy > 16 && g.dy > Math.abs(g.dx) * 2,
      onPanResponderMove: (_e, g) => dragY.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_e, g) =>
      {
        if (g.dy > DRAG_CLOSE || g.vy > 1.2)
        {
          closeRef.current()
          // volta ao lugar depois de fechar, pronto para a próxima vez
          setTimeout(() => dragY.setValue(0), 300)
          return
        }
        Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start()
      },
      onPanResponderTerminate: () =>
        Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start(),
    }),
  ).current

  const native = Platform.OS !== 'web'
  if (native)
  {
    if (noDrag || !props.transparent || fullWidth) return <RNModal {...props}>{children}</RNModal>
    return (
      <RNModal {...props}>
        <Animated.View style={{ flex: 1, transform: [{ translateY: dragY }] }} {...pan.panHandlers}>
          {children}
        </Animated.View>
      </RNModal>
    )
  }

  if (!showRail || fullWidth || !props.transparent) return <RNModal {...props}>{children}</RNModal>

  const side = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Fechar"
      onPress={close}
      style={{ flex: 1, backgroundColor: colors.overlay }}
    />
  )

  return (
    <RNModal {...props}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {side}
        <View style={{ width: DESKTOP_SHEET_WIDTH, maxWidth: '100%' }}>{children}</View>
        {side}
      </View>
    </RNModal>
  )
}
