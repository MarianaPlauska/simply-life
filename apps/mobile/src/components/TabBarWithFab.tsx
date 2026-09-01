import { View, StyleSheet, Platform } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Path } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TOUCH } from '@simply-life/ui-tokens'
import { Text, PressableScale } from '../ui'
import { useTheme } from '../theme/ThemeProvider'
import { useCaptureStore } from '../store/captureStore'
import { hapticLight } from '../lib/haptics'

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  kanban: 'list-outline',
  saude: 'heart-outline',
  financeiro: 'wallet-outline',
}

const LABELS: Record<string, string> = {
  index: 'Início',
  kanban: 'Tarefas',
  saude: 'Saúde',
  financeiro: 'Finanças',
}

const BAR_H = 64
const FAB = TOUCH.fab
const NOTCH_R = FAB / 2 + 10

/** Tab bar com entalhe sob o FAB (estilo notch) */
export function TabBarWithFab({ state, navigation }: BottomTabBarProps)
{
  const { colors, elevation, mode } = useTheme()
  const insets = useSafeAreaInsets()
  const openCapture = useCaptureStore((s) => s.openCapture)

  const left = state.routes.slice(0, 2)
  const right = state.routes.slice(2)
  const barBg =
    mode === 'light'
      ? Platform.OS === 'web'
        ? 'rgba(255,255,255,0.96)'
        : colors.chrome
      : 'rgba(36,24,26,0.96)'

  const renderTab = (route: (typeof state.routes)[0]) =>
  {
    const focused = state.index === state.routes.indexOf(route)
    const icon = ICONS[route.name] ?? 'ellipse-outline'
    const label = LABELS[route.name] ?? route.name
    return (
      <PressableScale
        key={route.key}
        accessibilityRole="button"
        onPress={() => navigation.navigate(route.name)}
        style={styles.tab}
      >
        <View
          style={{
            width: 44,
            height: 30,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: focused ? colors.axelMuted : 'transparent',
          }}
        >
          <Ionicons
            name={focused ? (icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap) : icon}
            size={22}
            color={focused ? colors.axel : colors.inkMuted}
          />
        </View>
        <Text variant="micro" color={focused ? colors.axel : colors.inkMuted} style={{ fontSize: 11 }}>
          {label}
        </Text>
      </PressableScale>
    )
  }

  // Path: barra com semicírculo côncavo no centro
  const w = 360
  const mid = w / 2
  const notchPath = `
    M 0,0
    L ${mid - NOTCH_R - 8},0
    C ${mid - NOTCH_R},0 ${mid - NOTCH_R},${NOTCH_R * 0.15} ${mid - NOTCH_R * 0.85},${NOTCH_R * 0.55}
    A ${NOTCH_R},${NOTCH_R} 0 0 0 ${mid + NOTCH_R * 0.85},${NOTCH_R * 0.55}
    C ${mid + NOTCH_R},${NOTCH_R * 0.15} ${mid + NOTCH_R},0 ${mid + NOTCH_R + 8},0
    L ${w},0
    L ${w},${BAR_H}
    L 0,${BAR_H}
    Z
  `

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}
    >
      <View style={styles.barOuter}>
        <Svg
          width="100%"
          height={BAR_H}
          viewBox={`0 0 ${w} ${BAR_H}`}
          preserveAspectRatio="none"
          style={StyleSheet.absoluteFill}
        >
          <Path d={notchPath} fill={barBg} />
        </Svg>
        <View
          style={[
            styles.barInner,
            {
              borderColor: colors.hairline,
              ...elevation.bar,
            },
          ]}
        >
          <View style={styles.side}>{left.map(renderTab)}</View>
          <View style={{ width: FAB + 8 }} />
          <View style={styles.side}>{right.map(renderTab)}</View>
        </View>

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Capturar"
          onPress={() =>
          {
            hapticLight()
            openCapture('dump')
          }}
          style={[
            styles.fab,
            {
              width: FAB,
              height: FAB,
              backgroundColor: colors.axel,
              borderRadius: 16,
              ...elevation.fab,
            },
          ]}
        >
          <Ionicons name="add" size={TOUCH.icon + 4} color={colors.axelOnFill} />
        </PressableScale>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  barOuter: {
    height: BAR_H,
    justifyContent: 'flex-end',
  },
  barInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: BAR_H,
    paddingBottom: 6,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tab: {
    minWidth: 56,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    top: -FAB / 2 + 4,
    left: '50%',
    marginLeft: -FAB / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
