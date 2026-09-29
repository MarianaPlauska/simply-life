import { View, StyleSheet, useWindowDimensions } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Icon } from '../ui/Icon'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TOUCH } from '@simply-life/ui-tokens'
import { PressableScale, Text } from '../ui'
import { useTheme } from '../theme/ThemeProvider'
import { useCaptureStore, captureForTab, captureFabLabel } from '../store/captureStore'
import { hapticLight } from '../lib/haptics'
import { useModules } from '../hooks/useModules'
import type { AppModuleGroup } from '../lib/appModules'

const ICONS: Record<string, keyof typeof Icon.glyphMap> = {
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

const ROUTE_GROUP: Record<string, AppModuleGroup | undefined> = {
  kanban: 'tarefas',
  saude: 'saude',
  financeiro: 'carteira',
}

/** Barra compacta + Captura sempre elevada (FAB) */
const BAR_H = 58
const FAB = 54
const GLOW = 66

export function TabBarWithFab({ state, navigation }: BottomTabBarProps)
{
  const { colors, elevation } = useTheme()
  const insets = useSafeAreaInsets()
  const { width: vw } = useWindowDimensions()
  const openCapture = useCaptureStore((s) => s.openCapture)
  const modules = useModules()
  const activeName = state.routes[Math.max(0, state.index)]?.name ?? 'index'
  // Aba de um grupo que a pessoa não usa não aparece (volta em Preferências)
  const routes = state.routes.filter((r) =>
  {
    const g = ROUTE_GROUP[r.name]
    return !g || modules.group(g) || r.name === activeName
  })
  const capture = captureForTab(activeName)
  // o + fica no meio: com número ímpar de abas, um espaço vazio equilibra os lados
  const half = Math.ceil(routes.length / 2)
  const left = routes.slice(0, half)
  const right = routes.slice(half)
  const pad = left.length - right.length

  // Escuro: barra petróleo, aba ativa em petróleo profundo. Claro: barra branca, aba ativa em tinta petróleo. Coral só no + e no pontinho.
  const barBg = colors.navBg
  const idleFg = colors.navInk
  const activeBg = colors.navActiveBg
  const activeFg = colors.navActiveInk
  const barW = Math.min(vw - 24, 420)

  const renderTab = (route: (typeof routes)[number], i: number) =>
  {
    const focused = route.name === activeName
    const outline = ICONS[route.name] ?? 'ellipse-outline'
    const filled = outline.replace('-outline', '') as keyof typeof Icon.glyphMap
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
          <Icon
            name={focused ? filled : outline}
            size={20}
            color={focused ? activeFg : idleFg}
          />
          <Text
            variant="micro"
            style={{
              color: focused ? activeFg : idleFg,
              fontWeight: focused ? '700' : '600',
              fontSize: 12,
              lineHeight: 16,
              marginTop: 2,
            }}
          >
            {label}
          </Text>
          {focused ? (
            <View style={{ width: 4, height: 4, borderRadius: 2, marginTop: 2, backgroundColor: colors.navActiveDot }} />
          ) : null}
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
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.navBorder,
              ...elevation.bar,
            },
          ]}
        >
          {left.map((route, i) => renderTab(route, i))}
          <View style={styles.fabGap} />
          {right.map((route, i) => renderTab(route, i + left.length))}
          {Array.from({ length: pad }).map((_, i) => <View key={`pad-${i}`} style={styles.slot} />)}
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
                backgroundColor: colors.canvas,
              },
            ]}
          >
            <View
              style={[
                styles.fab,
                {
                  backgroundColor: colors.axelFill,
                  ...elevation.fab,
                },
              ]}
            >
              <Icon name="add" size={TOUCH.icon + 2} color={colors.axelOnFill} />
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
