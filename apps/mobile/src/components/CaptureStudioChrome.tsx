import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import {
  Animated,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PrimaryButton, Text } from '../ui'
import { useTheme } from '../theme/ThemeProvider'

type Props = {
  open: boolean
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
  onClose: () => void
}

/** Sheet de papel: abre compacto; puxa a alça para cima para expandir, para baixo para fechar. */
export function CaptureStudioChrome({
  open,
  title,
  subtitle,
  children,
  footer,
  onClose,
}: Props)
{
  const { colors, space } = useTheme()
  const insets = useSafeAreaInsets()
  const { height: vh } = useWindowDimensions()
  const expand = useRef(new Animated.Value(0)).current
  const fade = useRef(new Animated.Value(0)).current
  const expandStart = useRef(0)
  const compactH = Math.round(Math.min(340, vh * 0.46))
  const fullH = Math.round(vh * 0.92)
  const span = Math.max(1, fullH - compactH)
  const paper = colors.canvas
  const sheetRadius = 36

  useEffect(() =>
  {
    if (!open)
    {
      expand.setValue(0)
      fade.setValue(0)
      return
    }
    expand.setValue(0)
    fade.setValue(0)
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start()
  }, [open, expand, fade])

  const snapExpand = (to: 0 | 1) =>
  {
    Animated.spring(expand, {
      toValue: to,
      friction: 9,
      tension: 48,
      useNativeDriver: false,
    }).start()
  }

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
        onPanResponderGrant: () =>
        {
          expand.stopAnimation((v) =>
          {
            expandStart.current = v
          })
        },
        onPanResponderMove: (_, g) =>
        {
          const next = expandStart.current - g.dy / span
          expand.setValue(Math.max(0, Math.min(1, next)))
        },
        onPanResponderRelease: (_, g) =>
        {
          const tap = Math.abs(g.dy) < 14 && Math.abs(g.dx) < 14
          if (tap)
          {
            snapExpand(expandStart.current > 0.5 ? 0 : 1)
            return
          }
          const current = expandStart.current - g.dy / span
          if (expandStart.current < 0.2 && g.dy > 56)
          {
            onClose()
            return
          }
          snapExpand(current > 0.35 || g.dy < -36 ? 1 : 0)
        },
      }),
    [expand, onClose, span],
  )

  const sheetH = expand.interpolate({
    inputRange: [0, 1],
    outputRange: [compactH, fullH],
  })

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View
          pointerEvents="none"
          style={{
            ...absoluteFill,
            backgroundColor: 'rgba(26, 22, 18, 0.38)',
            opacity: fade,
          }}
        />
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Animated.View
          style={{
            height: sheetH,
            backgroundColor: paper,
            borderTopLeftRadius: sheetRadius,
            borderTopRightRadius: sheetRadius,
            borderTopWidth: 1,
            borderTopColor: colors.axel,
            paddingHorizontal: space.lg,
            paddingTop: space.md,
            paddingBottom: Math.max(insets.bottom, space.md),
            gap: space.sm,
          }}
        >
          <View
            {...pan.panHandlers}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="Altura da ficha"
            accessibilityHint="Toque para expandir. Arraste para baixo para fechar."
            style={{ gap: space.sm }}
          >
            <View
              style={{
                alignSelf: 'center',
                width: 40,
                height: 4,
                borderRadius: 999,
                backgroundColor: colors.hairline,
              }}
            />
            <View style={{ gap: 2 }}>
              <Text variant="hero" style={{ fontSize: 26, letterSpacing: -0.6 }}>
                {title}
              </Text>
              <Text variant="caption" muted>
                {subtitle}
              </Text>
            </View>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ gap: space.md, paddingBottom: space.lg }}>
              {children}
            </View>
          </ScrollView>
          {footer}
          <PrimaryButton label="Fechar" variant="ghost" onPress={onClose} />
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  )
}

const absoluteFill = {
  position: 'absolute' as const,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
}
