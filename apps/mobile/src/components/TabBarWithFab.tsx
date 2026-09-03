import { View, StyleSheet } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TOUCH } from '@simply-life/ui-tokens'
import { PressableScale } from '../ui'
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

const COPPER = '#E8734A'
const FAB = 58
const PILL_H = 56
const GLOW = 72

export function TabBarWithFab({ state, navigation }: BottomTabBarProps)
{
  const { colors, elevation } = useTheme()
  const insets = useSafeAreaInsets()
  const openCapture = useCaptureStore((s) => s.openCapture)
  const routes = state.routes
  const activeIndex = Math.max(0, state.index)
  const left = routes.slice(0, 2)
  const right = routes.slice(2)

  const renderTab = (route: (typeof routes)[number], i: number) =>
  {
    const focused = i === activeIndex
    const outline = ICONS[route.name] ?? 'ellipse-outline'
    const filled = outline.replace('-outline', '') as keyof typeof Ionicons.glyphMap
    return (
      <PressableScale
        key={route.key}
        accessibilityRole="button"
        accessibilityLabel={LABELS[route.name] ?? route.name}
        accessibilityState={{ selected: focused }}
        onPress={() => navigation.navigate(route.name)}
        style={styles.tab}
      >
        <Ionicons
          name={focused ? filled : outline}
          size={22}
          color={focused ? colors.ink : colors.inkMuted}
        />
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 999,
            marginTop: 4,
            backgroundColor: focused ? COPPER : 'transparent',
          }}
        />
      </PressableScale>
    )
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <View style={styles.stage}>
        <View
          style={[
            styles.pill,
            {
              backgroundColor: colors.elevated,
              ...elevation.bar,
            },
          ]}
        >
          {left.map((route, i) => renderTab(route, i))}
          <View style={styles.fabGap} />
          {right.map((route, i) => renderTab(route, i + left.length))}
        </View>

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Capturar"
          onPress={() =>
          {
            hapticLight()
            openCapture('dump')
          }}
          style={styles.fabHit}
        >
          <View style={styles.glow}>
            <View
              style={[
                styles.fab,
                {
                  backgroundColor: COPPER,
                  ...elevation.fab,
                },
              ]}
            >
              <Ionicons name="add" size={TOUCH.icon + 4} color="#FFFFFF" />
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
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  stage: {
    height: PILL_H + 18,
    justifyContent: 'flex-end',
  },
  pill: {
    height: PILL_H,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
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
    backgroundColor: 'rgba(232, 115, 74, 0.28)',
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
