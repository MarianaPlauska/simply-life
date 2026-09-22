import { useState } from 'react'
import { View, Platform } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '../../ui'
import { BrandMark } from '../BrandMark'
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

  const CREAM = colors.ink
  const inkOnBrand = 'rgba(243, 230, 216, 0.82)'
  const inkMutedOnBrand = 'rgba(243, 230, 216, 0.48)'
  const divider = 'rgba(243, 230, 216, 0.12)'

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
        backgroundColor: colors.canvas,
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
            <BrandMark size={22} onFill />
            {!collapsed ? (
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: 'Fraunces_500Medium',
                  color: CREAM,
                  fontSize: 15,
                  letterSpacing: -0.2,
                }}
              >
                Simply Life
              </Text>
            ) : null}
          </View>
          {!collapsed ? (
            <WebHoverable
              onPress={toggleCollapsed}
              accessibilityLabel="Recolher menu"
              style={webStyle({ padding: 4, cursor: 'pointer' })}
            >
              <Ionicons name="chevron-back" size={14} color={inkMutedOnBrand} />
            </WebHoverable>
          ) : null}
        </View>

        <View style={{ gap: 2, alignItems: 'stretch' }}>
          {NAV.map((item) =>
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
                  borderLeftColor: active ? colors.axel : 'transparent',
                  backgroundColor: hovered && !active ? 'rgba(243, 230, 216, 0.04)' : 'transparent',
                  cursor: 'pointer',
                })}
              >
                <Ionicons
                  name={active ? (item.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap) : item.icon}
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
                      fontFamily: active ? 'Manrope_700Bold' : 'Manrope_500Medium',
                      color: active ? colors.axel : inkOnBrand,
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
              backgroundColor: colors.axel,
              cursor: 'pointer',
            })}
          >
            <Ionicons name="add" size={14} color="#FFFFFF" />
            {!collapsed ? (
              <Text style={{ fontSize: 12, fontFamily: 'Manrope_700Bold', color: '#FFFFFF' }}>
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
            backgroundColor: colors.axelMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Manrope_700Bold', color: colors.axel, fontSize: 11 }}>
            {name.slice(0, 1).toUpperCase()}
          </Text>
        </View>
        {!collapsed ? (
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ fontSize: 12, fontFamily: 'Manrope_600SemiBold', color: CREAM }}>
              {name}
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 10, fontFamily: 'Manrope_500Medium', color: inkMutedOnBrand }}>
              {isAdmin ? 'Admin' : 'Perfil'}
            </Text>
          </View>
        ) : null}
      </WebHoverable>
    </View>
  )
}
