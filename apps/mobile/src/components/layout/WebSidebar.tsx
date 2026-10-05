import { useState } from 'react'
import { View, Platform } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { useModules } from '../../hooks/useModules'
import { Icon } from '../../ui/Icon'
import { Text } from '../../ui'
import { BrandMark, SunFyWordmark } from '../BrandMark'
import { useTheme } from '../../theme/ThemeProvider'
import { useWorkspace } from '../../layout/useWorkspace'
import { useCaptureStore, captureForTab, captureFabLabel } from '../../store/captureStore'
import { useAuthStore } from '../../store/authStore'
import { usePrefsStore } from '../../store/prefsStore'
import { resolveAxelName } from '../../lib/axelName'
import { WebHoverable } from '../dashboard/web/WebHoverable'
import { webStyle } from '../dashboard/web/webStyle'
import { DESKTOP_SIDEBAR_WIDTH, DESKTOP_SIDEBAR_COLLAPSED } from './DesktopSidebar'

const NAV = [
  { href: '/(tabs)', match: '/(tabs)', exact: true, label: 'Início', icon: 'home-outline' as const },
  { href: '/(tabs)/kanban', match: 'kanban', label: 'Tarefas', icon: 'list-outline' as const },
  { href: '/(tabs)/saude', match: 'saude', label: 'Saúde', icon: 'heart-outline' as const },
  { href: '/(tabs)/financeiro', match: 'financeiro', label: 'Finanças', icon: 'wallet-outline' as const },
]

/**
 * Sidebar da build web — deliberadamente não segue o padrão "pílula ativa
 * com entalhe" comum em dashboards gerados: navegação tipográfica, sem
 * ícone-em-círculo, sem avatar redondo.
 */
export function WebSidebar()
{
  const { space, colors } = useTheme()
  const { isTablet, isDesktop } = useWorkspace()
  const router = useRouter()
  const modules = useModules()
  const navVisible = (match: string) =>
    match === 'kanban' ? modules.group('tarefas')
      : match === 'saude' ? modules.group('saude')
        : match === 'financeiro' ? modules.group('carteira')
          : true
  const pathname = usePathname()
  const openCapture = useCaptureStore((s) => s.openCapture)
  const email = useAuthStore((s) => s.sessionEmail)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const isGuest = useAuthStore((s) => s.isGuest)
  const prefs = usePrefsStore((s) => s.prefs)
  const name = resolveAxelName({
    isGuest,
    callsYou: prefs.axel_calls_you,
    displayName: prefs.display_name,
    email,
  })
  const prefsCollapsed = Boolean(usePrefsStore((s) => s.prefs.sidebar_collapsed))
  const patchPrefs = usePrefsStore((s) => s.patch)
  const [tabletExpanded, setTabletExpanded] = useState(false)
  const collapsed = isTablet && !isDesktop ? !tabletExpanded : prefsCollapsed
  const width = collapsed ? DESKTOP_SIDEBAR_COLLAPSED : DESKTOP_SIDEBAR_WIDTH

  // Escuro: barra petróleo. Claro: barra branca com contorno. Coral só marca o item ativo (borda e ícone)
  const CREAM = colors.heroInk
  const inkOnBrand = `${colors.heroInk}D1`
  const inkMutedOnBrand = colors.navInk
  const divider = `${colors.navInk}29`

  const isActive = (item: (typeof NAV)[0]) =>
  {
    if (item.exact)
    {
      return pathname === '/' || pathname === '/(tabs)' || pathname.endsWith('/index')
    }
    return pathname.includes(item.match)
  }

  const toggleCollapsed = () =>
  {
    if (isTablet && !isDesktop)
    {
      setTabletExpanded((v) => !v)
      return
    }
    void patchPrefs({ sidebar_collapsed: !prefsCollapsed })
  }

  return (
    <View
      style={{
        width,
        alignSelf: 'stretch',
        backgroundColor: colors.navBg,
        borderRightWidth: 1,
        borderRightColor: colors.navBorder,
        paddingTop: space.lg,
        paddingBottom: space.lg,
        justifyContent: 'space-between',
        ...(Platform.OS === 'web'
          ? ({ transitionProperty: 'width', transitionDuration: '200ms' } as object)
          : null),
      }}
    >
      <View style={{ gap: 28 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 20,
            justifyContent: collapsed ? 'center' : 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, minWidth: 0 }}>
            <BrandMark size={22} />
            {!collapsed ? (
              <SunFyWordmark
                color={CREAM}
                style={{ fontFamily: 'Fraunces_500Medium', fontSize: 15, lineHeight: 20, letterSpacing: -0.2 }}
              />
            ) : null}
          </View>
          {!collapsed ? (
            <WebHoverable
              onPress={toggleCollapsed}
              accessibilityLabel="Recolher menu"
              style={webStyle({ padding: 4, cursor: 'pointer' })}
            >
              <Icon name="chevron-back" size={14} color={inkMutedOnBrand} />
            </WebHoverable>
          ) : null}
        </View>

        <View style={{ gap: 2, alignItems: 'stretch' }}>
          {NAV.filter((item) => navVisible(item.match)).map((item) =>
          {
            const active = isActive(item)
            return (
              <WebHoverable
                key={item.href}
                onPress={() => router.push(item.href as never)}
                accessibilityLabel={item.label}
                style={(hovered) => webStyle({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: 12,
                  minHeight: 38,
                  paddingHorizontal: collapsed ? 0 : 20,
                  borderLeftWidth: 2,
                  borderLeftColor: active ? colors.axelFill : 'transparent',
                  backgroundColor: active
                    ? `${colors.navInk}1F`
                    : hovered ? `${colors.navInk}0F` : 'transparent',
                  cursor: 'pointer',
                })}
              >
                <Icon
                  name={active ? (item.icon.replace('-outline', '') as keyof typeof Icon.glyphMap) : item.icon}
                  size={15}
                  color={active ? colors.axel : inkOnBrand}
                />
                {!collapsed ? (
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 11,
                      letterSpacing: 0.6,
                      textTransform: 'uppercase',
                      fontFamily: active ? 'Lexend_700Bold' : 'Lexend_500Medium',
                      color: active ? CREAM : inkOnBrand,
                    }}
                  >
                    {item.label}
                  </Text>
                ) : null}
              </WebHoverable>
            )
          })}
        </View>

        <View style={{ paddingHorizontal: collapsed ? 10 : 20 }}>
          <WebHoverable
            onPress={() =>
            {
              const spec = captureForTab(pathname)
              openCapture(spec.kind, null, { studio: spec.studio })
            }}
            accessibilityLabel={captureFabLabel(captureForTab(pathname).kind)}
            style={webStyle({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              minHeight: 36,
              borderRadius: 8,
              backgroundColor: colors.axelFill,
              cursor: 'pointer',
            })}
          >
            <Icon name="add" size={14} color={colors.axelOnFill} />
            {!collapsed ? (
              <Text style={{ fontSize: 12, fontFamily: 'Lexend_700Bold', color: colors.axelOnFill }}>
                Capturar
              </Text>
            ) : null}
          </WebHoverable>
        </View>
      </View>

      <WebHoverable
        onPress={() => router.push('/perfil')}
        accessibilityLabel="Abrir perfil"
        style={webStyle({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: collapsed ? 0 : 20,
          justifyContent: collapsed ? 'center' : 'flex-start',
          paddingTop: space.md,
          marginTop: space.md,
          borderTopWidth: 1,
          borderTopColor: divider,
          cursor: 'pointer',
        })}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            backgroundColor: `${colors.navInk}29`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Lexend_700Bold', color: CREAM, fontSize: 11 }}>
            {name.slice(0, 1).toUpperCase()}
          </Text>
        </View>
        {!collapsed ? (
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ fontSize: 12, fontFamily: 'Lexend_600SemiBold', color: CREAM }}>
              {name}
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 11, fontFamily: 'Lexend_500Medium', color: inkMutedOnBrand }}>
              {isAdmin ? 'Admin' : 'Perfil'}
            </Text>
          </View>
        ) : null}
      </WebHoverable>
    </View>
  )
}
