import { useState } from 'react'
import { View, Pressable, Platform } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '../../ui'
import { BrandMark } from '../BrandMark'
import { useTheme } from '../../theme/ThemeProvider'
import { useWorkspace } from '../../layout/useWorkspace'
import { useCaptureStore } from '../../store/captureStore'
import { useAuthStore } from '../../store/authStore'
import { usePrefsStore } from '../../store/prefsStore'

const NAV = [
  { href: '/(tabs)', match: '/(tabs)', exact: true, label: 'Início', icon: 'home-outline' as const },
  { href: '/(tabs)/kanban', match: 'kanban', label: 'Tarefas', icon: 'list-outline' as const },
  { href: '/(tabs)/saude', match: 'saude', label: 'Saúde', icon: 'heart-outline' as const },
  { href: '/(tabs)/financeiro', match: 'financeiro', label: 'Finanças', icon: 'wallet-outline' as const },
]

export const DESKTOP_SIDEBAR_WIDTH = 220
export const DESKTOP_SIDEBAR_COLLAPSED = 68
const NOTCH = 14

/**
 * Sidebar colapsável. Expandida: labels. Colapsada: ícones + tooltip.
 * Estado persistido em workspace prefs.
 */
export function DesktopSidebar()
{
  const { space, colors } = useTheme()
  const { isTablet, isDesktop } = useWorkspace()
  const router = useRouter()
  const pathname = usePathname()
  const openCapture = useCaptureStore((s) => s.openCapture)
  const email = useAuthStore((s) => s.sessionEmail)
  const name = email?.split('@')[0] ?? 'Você'
  const prefsCollapsed = Boolean(usePrefsStore((s) => s.prefs.sidebar_collapsed))
  const patchPrefs = usePrefsStore((s) => s.patch)
  /** Tablet: começa colapsada; expansível só nesta sessão */
  const [tabletExpanded, setTabletExpanded] = useState(false)
  const collapsed = isTablet && !isDesktop ? !tabletExpanded : prefsCollapsed

  const width = collapsed ? DESKTOP_SIDEBAR_COLLAPSED : DESKTOP_SIDEBAR_WIDTH
  const ORANGE = colors.axel
  const CREAM = colors.ink
  const sidebarBg = colors.canvas
  const activePill = CREAM
  const inkOnBrand = 'rgba(243, 230, 216, 0.88)'
  const inkMutedOnBrand = 'rgba(243, 230, 216, 0.55)'
  const pressedBg = colors.axelMuted
  const divider = 'rgba(243, 230, 216, 0.14)'
  const avatarBg = colors.axelMuted
  const ctaBg = colors.axelMuted

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
        backgroundColor: sidebarBg,
        paddingTop: space.lg,
        paddingBottom: space.lg,
        paddingLeft: collapsed ? 0 : 12,
        justifyContent: 'space-between',
        // Transição suave (web)
        ...(Platform.OS === 'web'
          ? ({ transitionProperty: 'width', transitionDuration: '220ms' } as object)
          : null),
      }}
    >
      <View style={{ gap: space.md }}>
        <View
          style={{
            flexDirection: collapsed ? 'column' : 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: collapsed ? 0 : 8,
            paddingBottom: space.sm,
            justifyContent: 'center',
          }}
        >
          <BrandMark size={collapsed ? 28 : 28} onFill />
          {!collapsed ? (
            <Text
              variant="bodyStrong"
              style={{ color: CREAM, letterSpacing: -0.2, fontSize: 14, flex: 1 }}
              numberOfLines={1}
            >
              Simply Life
            </Text>
          ) : null}
          <Pressable
            onPress={toggleCollapsed}
            accessibilityRole="button"
            accessibilityLabel={collapsed ? 'Expandir menu' : 'Recolher menu'}
            {...(Platform.OS === 'web'
              ? { title: collapsed ? 'Expandir' : 'Recolher' }
              : null)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressedBg,
            }}
          >
            <Ionicons
              name={collapsed ? 'chevron-forward' : 'chevron-back'}
              size={16}
              color={CREAM}
            />
          </Pressable>
        </View>

        {!collapsed ? (
          <Text
            variant="micro"
            style={{
              color: inkMutedOnBrand,
              paddingHorizontal: 14,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              fontSize: 10,
            }}
          >
            Menu
          </Text>
        ) : null}

        <View style={{ gap: 4, alignItems: collapsed ? 'center' : 'stretch' }}>
          {NAV.map((item) =>
          {
            const active = isActive(item)
            return (
              <View
                key={item.href}
                style={{
                  position: 'relative',
                  zIndex: active ? 2 : 1,
                  marginVertical: active && !collapsed ? 2 : 0,
                  width: collapsed ? 48 : '100%',
                }}
              >
                {active && !collapsed ? (
                  <>
                    <View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        top: -NOTCH,
                        right: 0,
                        width: NOTCH,
                        height: NOTCH,
                        backgroundColor: activePill,
                        zIndex: 3,
                      }}
                    >
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: sidebarBg,
                          borderBottomRightRadius: NOTCH,
                        }}
                      />
                    </View>
                    <View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        bottom: -NOTCH,
                        right: 0,
                        width: NOTCH,
                        height: NOTCH,
                        backgroundColor: activePill,
                        zIndex: 3,
                      }}
                    >
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: sidebarBg,
                          borderTopRightRadius: NOTCH,
                        }}
                      />
                    </View>
                  </>
                ) : null}

                <Pressable
                  onPress={() => router.push(item.href as never)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={item.label}
                  {...(Platform.OS === 'web' ? { title: item.label } : null)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: 10,
                    minHeight: active ? 36 : 40,
                    paddingVertical: active ? 6 : 8,
                    paddingLeft: collapsed ? 0 : 12,
                    paddingRight: collapsed ? 0 : 14,
                    borderTopLeftRadius: active ? (collapsed ? 999 : 999) : 0,
                    borderBottomLeftRadius: active ? 999 : 0,
                    borderTopRightRadius: collapsed && active ? 999 : 0,
                    borderBottomRightRadius: collapsed && active ? 999 : 0,
                    backgroundColor: active
                      ? activePill
                      : pressed
                        ? pressedBg
                        : 'transparent',
                    borderLeftWidth: active && !collapsed ? 3 : 0,
                    borderLeftColor: active ? ORANGE : 'transparent',
                  })}
                >
                  <Ionicons
                    name={
                      active
                        ? (item.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap)
                        : item.icon
                    }
                    size={18}
                    color={active ? ORANGE : inkOnBrand}
                  />
                  {!collapsed ? (
                    <Text
                      variant="label"
                      style={{
                        color: active ? ORANGE : inkOnBrand,
                        fontSize: 13,
                        fontWeight: active ? '700' : '500',
                      }}
                    >
                      {item.label}
                    </Text>
                  ) : null}
                </Pressable>
              </View>
            )
          })}
        </View>

        <Pressable
          onPress={() => openCapture('dump')}
          accessibilityRole="button"
          accessibilityLabel="Capturar"
          {...(Platform.OS === 'web' ? { title: 'Capturar' } : null)}
          style={({ pressed }) => ({
            marginTop: space.sm,
            marginRight: collapsed ? 0 : 12,
            marginHorizontal: collapsed ? 10 : undefined,
            minHeight: 40,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: ctaBg,
            borderWidth: 1,
            borderColor: divider,
            opacity: pressed ? 0.9 : 1,
            paddingHorizontal: collapsed ? 0 : 12,
          })}
        >
          {collapsed ? (
            <Ionicons name="add" size={20} color={CREAM} />
          ) : (
            <Text variant="label" style={{ color: CREAM, fontSize: 12, fontWeight: '700' }}>
              + Capturar
            </Text>
          )}
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push('/perfil')}
        accessibilityRole="button"
        accessibilityLabel="Abrir perfil"
        {...(Platform.OS === 'web' ? { title: 'Perfil' } : null)}
        style={{
          flexDirection: collapsed ? 'column' : 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: collapsed ? 0 : 8,
          paddingTop: space.md,
          marginRight: collapsed ? 0 : 12,
          borderTopWidth: 1,
          borderTopColor: divider,
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            backgroundColor: avatarBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="label" style={{ color: CREAM, fontSize: 12 }}>
            {name.slice(0, 1).toUpperCase()}
          </Text>
        </View>
        {!collapsed ? (
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="label" numberOfLines={1} style={{ color: CREAM, fontSize: 12 }}>
              {name}
            </Text>
            <Text variant="micro" numberOfLines={1} style={{ color: inkMutedOnBrand, fontSize: 10 }}>
              Perfil
            </Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  )
}
