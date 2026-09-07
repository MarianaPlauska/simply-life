import { View, StyleSheet, useWindowDimensions } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TOUCH } from '@simply-life/ui-tokens'
import { PressableScale, Text } from '../ui'
import { useTheme } from '../theme/ThemeProvider'
import { useCaptureStore, captureForTab, captureFabLabel } from '../store/captureStore'
import { hapticLight } from '../lib/haptics'

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  kanban: 'checkbox-outline',
  saude: 'heart-outline',
  financeiro: 'wallet-outline',
}

const LABELS: Record<string, string> = {
  index: 'Início',
  kanban: 'Tarefas',
  saude: 'Saúde',
  financeiro: 'Carteira',
}

/** Barra compacta + Captura sempre elevada (FAB) */
const BAR_H = 52
const FAB = 54
const GLOW = 66

export function TabBarWithFab({ state, navigation }: BottomTabBarProps)
{
  const { colors, elevation, mode } = useTheme()
  const insets = useSafeAreaInsets()
  const { width: vw } = useWindowDimensions()
  const openCapture = useCaptureStore((s) => s.openCapture)
  const routes = state.routes
  const activeIndex = Math.max(0, state.index)
  const activeName = routes[activeIndex]?.name ?? 'index'
  const capture = captureForTab(activeName)
  const left = routes.slice(0, 2)
  const right = routes.slice(2)

  const barBg = colors.axel
  const idleFg = 'rgba(255,255,255,0.82)'
  const activeBg = mode === 'dark' ? '#F5F1EC' : '#FFFFFF'
  const activeFg = colors.axel
  const barW = Math.min(vw - 24, 420)

  const renderTab = (route: (typeof routes)[number], i: number) =>
  {
    const focused = i === activeIndex
    const outline = ICONS[route.name] ?? 'ellipse-outline'
    const filled = outline.replace('-outline', '') as keyof typeof Ionicons.glyphMap
    const label = LABELS[route.name] ?? route.name

    return (
      <PressableScale
        key={route.key}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: focused }}
        onPress={() => navigation.navigate(route.name)}
        style={styles.slot}
      >
        <View
          style={[
            styles.tabInner,
            focused
              ? {
                  backgroundColor: activeBg,
                  borderRadius: 14,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }
              : null,
          ]}
        >
          <Ionicons
            name={focused ? filled : outline}
            size={20}
            color={focused ? activeFg : idleFg}
          />
          <Text
            variant="micro"
            style={{
              color: focused ? activeFg : idleFg,
              fontWeight: focused ? '700' : '600',
              fontSize: 9,
              lineHeight: 11,
              marginTop: 1,
            }}
          >
            {label}
          </Text>
        </View>
      </PressableScale>
    )
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}
    >
      <View style={[styles.stage, { width: barW, alignSelf: 'center' }]}>
        <View
          style={[
            styles.bar,
            {
              height: BAR_H,
              backgroundColor: barBg,
              ...elevation.bar,
            },
          ]}
        >
          {left.map((route, i) => renderTab(route, i))}
          <View style={styles.fabGap} />
          {right.map((route, i) => renderTab(route, i + left.length))}
        </View>

        {/* Captura sempre elevada */}
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={captureFabLabel(capture.kind)}
          onPress={() =>
          {
            hapticLight()
            openCapture(capture.kind, null, { studio: capture.studio })
          }}
          style={styles.fabHit}
        >
          <View
            style={[
              styles.glow,
              {
                backgroundColor:
                  mode === 'dark' ? 'rgba(232,115,74,0.35)' : 'rgba(232,115,74,0.22)',
              },
            ]}
          >
            <View
              style={[
                styles.fab,
                {
                  backgroundColor: activeBg,
                  borderWidth: 2,
                  borderColor: colors.axel,
                  ...elevation.fab,
                },
              ]}
            >
              <Ionicons name="add" size={TOUCH.icon + 2} color={activeFg} />
            </View>
          </View>
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
  stage: {
    height: BAR_H + 22,
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  bar: {
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  slot: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  fabGap: {
    width: GLOW,
  },
  fabHit: {
    position: 'absolute',
    alignSelf: 'center',
    top: 0,
    width: GLOW,
    height: GLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: GLOW,
    height: GLOW,
    borderRadius: GLOW / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: FAB,
    height: FAB,
    borderRadius: FAB / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
