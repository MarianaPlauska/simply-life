import { View, Pressable } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '../../ui'
import { BrandMark } from '../BrandMark'
import { useTheme } from '../../theme/ThemeProvider'
import { useCaptureStore } from '../../store/captureStore'
import { useAuthStore } from '../../store/authStore'

const NAV = [
  { href: '/(tabs)', match: '/(tabs)', exact: true, label: 'Início', icon: 'home-outline' as const },
  { href: '/(tabs)/kanban', match: 'kanban', label: 'Tarefas', icon: 'list-outline' as const },
  { href: '/(tabs)/saude', match: 'saude', label: 'Saúde', icon: 'heart-outline' as const },
  { href: '/(tabs)/financeiro', match: 'financeiro', label: 'Finanças', icon: 'wallet-outline' as const },
]

/** Largura rail desktop — labels + ícone */
export const DESKTOP_SIDEBAR_WIDTH = 220

/** Raio das curvas que “mordem” a borda da sidebar (efeito SoftTech / CodePen) */
const NOTCH = 22

/**
 * Sidebar desktop com item ativo em entalhe:
 * pill do canvas + curvas côncavas em cima/baixo, fundindo com o conteúdo.
 */
export function DesktopSidebar()
{
  const { colors, space, mode } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const openCapture = useCaptureStore((s) => s.openCapture)
  const email = useAuthStore((s) => s.sessionEmail)
  const name = email?.split('@')[0] ?? 'Você'

  // Rail Drive: navy black no escuro; Chinese Black no claro
  const sidebarBg = mode === 'dark' ? '#0D1020' : '#0C1519'
  const contentBg = colors.canvas
  const inkOnBrand = 'rgba(245, 241, 236, 0.92)'
  const inkMutedOnBrand = 'rgba(245, 241, 236, 0.62)'
  const activeFg = colors.ink
  const pressedBg = 'rgba(245, 241, 236, 0.12)'
  const divider = 'rgba(245, 241, 236, 0.18)'
  const avatarBg = 'rgba(245, 241, 236, 0.14)'
  const ctaBg = 'rgba(245, 241, 236, 0.14)'
  const ctaFg = '#F5F1EC'

  const isActive = (item: (typeof NAV)[0]) =>
  {
    if (item.exact)
    {
      return pathname === '/' || pathname === '/(tabs)' || pathname.endsWith('/index')
    }
    return pathname.includes(item.match)
  }

  return (
    <View
      style={{
        width: DESKTOP_SIDEBAR_WIDTH,
        alignSelf: 'stretch',
        backgroundColor: sidebarBg,
        paddingTop: space.lg,
        paddingBottom: space.lg,
        // Sem padding à direita: o entalhe encosta no canvas
        paddingLeft: space.md,
        justifyContent: 'space-between',
      }}
    >
      <View style={{ gap: space.md }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: space.sm,
            paddingBottom: space.sm,
          }}
        >
          <BrandMark size={32} onFill />
          <Text
            variant="bodyStrong"
            style={{ color: '#F5F1EC', letterSpacing: -0.2, fontSize: 15 }}
            numberOfLines={1}
          >
            Simply Life
          </Text>
        </View>

        <Text
          variant="micro"
          style={{
            color: inkMutedOnBrand,
            paddingHorizontal: space.md,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            fontSize: 10,
          }}
        >
          Menu
        </Text>

        <View style={{ gap: 0 }}>
          {NAV.map((item) =>
          {
            const active = isActive(item)
            return (
              <View
                key={item.href}
                style={{
                  position: 'relative',
                  zIndex: active ? 2 : 1,
                }}
              >
                {active ? (
                  <>
                    {/* Curva superior — “mordida” no rail */}
                    <View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        top: -NOTCH,
                        right: 0,
                        width: NOTCH,
                        height: NOTCH,
                        backgroundColor: contentBg,
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
                    {/* Curva inferior */}
                    <View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        bottom: -NOTCH,
                        right: 0,
                        width: NOTCH,
                        height: NOTCH,
                        backgroundColor: contentBg,
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
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: 48,
                    paddingLeft: 16,
                    paddingRight: 18,
                    borderTopLeftRadius: active ? NOTCH + 6 : 0,
                    borderBottomLeftRadius: active ? NOTCH + 6 : 0,
                    backgroundColor: active
                      ? contentBg
                      : pressed
                        ? pressedBg
                        : 'transparent',
                  })}
                >
                  <Ionicons
                    name={
                      active
                        ? (item.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap)
                        : item.icon
                    }
                    size={18}
                    color={active ? activeFg : inkOnBrand}
                  />
                  <Text
                    variant="label"
                    style={{
                      color: active ? activeFg : inkOnBrand,
                      fontSize: 14,
                      fontWeight: active ? '700' : '500',
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              </View>
            )
          })}
        </View>

        <Pressable
          onPress={() => openCapture('dump')}
          accessibilityRole="button"
          accessibilityLabel="Capturar"
          style={({ pressed }) => ({
            marginTop: space.sm,
            marginRight: space.md,
            minHeight: 44,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: ctaBg,
            borderWidth: 1,
            borderColor: divider,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text variant="label" style={{ color: ctaFg, fontSize: 13, fontWeight: '700' }}>
            + Capturar
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push('/preferencias')}
        accessibilityRole="button"
        accessibilityLabel="Abrir preferências"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: space.sm,
          paddingTop: space.md,
          marginRight: space.md,
          borderTopWidth: 1,
          borderTopColor: divider,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            backgroundColor: avatarBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="label" style={{ color: '#F5F1EC', fontSize: 13 }}>
            {name.slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="label" numberOfLines={1} style={{ color: '#F5F1EC', fontSize: 13 }}>
            {name}
          </Text>
          <Text variant="micro" numberOfLines={1} style={{ color: inkMutedOnBrand, fontSize: 11 }}>
            Preferências
          </Text>
        </View>
      </Pressable>
    </View>
  )
}
