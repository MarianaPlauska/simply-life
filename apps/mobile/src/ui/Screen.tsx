import {
  ScrollView,
  View,
  RefreshControl,
  type ViewProps,
  StyleSheet,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { COMPONENT_SPEC } from '@simply-life/ui-tokens'
import { useTheme } from '../theme/ThemeProvider'
import { useWorkspace } from '../layout/useWorkspace'
import { tabBarScreenPadding } from './chrome'

type ScreenProps = ViewProps & {
  scroll?: boolean
  padded?: boolean
  /** Reserva espaço da tab bar flutuante (ignorado no desktop com sidebar) */
  tabBarInset?: boolean
  refreshing?: boolean
  onRefresh?: () => void
}

export function Screen({
  children,
  scroll,
  padded = true,
  tabBarInset = true,
  refreshing,
  onRefresh,
  style,
  ...rest
}: ScreenProps)
{
  const { colors } = useTheme()
  const { showRail } = useWorkspace()
  const insets = useSafeAreaInsets()
  // Desktop com sidebar: sem padding da tab bar mobile
  const useTabPad = tabBarInset && !showRail
  const bottom = useTabPad
    ? tabBarScreenPadding(insets.bottom)
    : Math.max(insets.bottom, 16)
  // Desktop: padding vem do TabShell; Screen só reserva o fundo
  const hPad = showRail ? 0 : COMPONENT_SPEC.Screen.paddingHorizontal

  const pad = padded
    ? {
        paddingHorizontal: hPad,
        paddingBottom: bottom,
        ...(showRail ? { flexGrow: 1 } : null),
      }
    : { paddingBottom: bottom }

  const refresh =
    onRefresh != null ? (
      <RefreshControl
        refreshing={Boolean(refreshing)}
        onRefresh={onRefresh}
        tintColor={colors.axel}
        colors={[colors.axel]}
      />
    ) : undefined

  if (scroll)
  {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.canvas }]} edges={['top']}>
        <ScrollView
          contentContainerStyle={[pad, style]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={refresh}
          {...rest}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.canvas }]} edges={['top']}>
      <View style={[styles.flex, pad, style]} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
})
