import { View, Pressable } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { MARBLE } from '@simply-life/ui-tokens'
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

/**
 * Sidebar desktop (≥1024) — ref dashboard com rail lateral.
 * Mobile continua com TabBarWithFab (não alterar).
 */
export function DesktopSidebar()
{
  const { colors, space, mode } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const openCapture = useCaptureStore((s) => s.openCapture)
  const email = useAuthStore((s) => s.sessionEmail)
  const name = email?.split('@')[0] ?? 'Você'

  const bg = mode === 'dark' ? '#24181A' : MARBLE.rose
  const ink = '#FFF8F0'
  const inkMuted = 'rgba(255,248,240,0.72)'
  const activeBg = mode === 'dark' ? 'rgba(255,103,102,0.22)' : 'rgba(255,255,255,0.18)'

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
        width: 248,
        backgroundColor: bg,
        paddingTop: space.xl,
        paddingBottom: space.lg,
        paddingHorizontal: space.md,
        justifyContent: 'space-between',
      }}
    >
      <View style={{ gap: space.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8 }}>
          <BrandMark size={40} onFill />
          <Text variant="section" style={{ color: ink, letterSpacing: -0.3 }}>
            Simply Life
          </Text>
        </View>

        <View style={{ gap: 4 }}>
          {NAV.map((item) =>
          {
            const active = isActive(item)
            return (
              <Pressable
                key={item.href}
                onPress={() => router.push(item.href as never)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 48,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  backgroundColor: active ? activeBg : pressed ? 'rgba(255,255,255,0.08)' : 'transparent',
                })}
              >
                <Ionicons
                  name={active ? (item.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap) : item.icon}
                  size={20}
                  color={active ? MARBLE.cream : inkMuted}
                />
                <Text
                  variant="bodyStrong"
                  style={{ color: active ? ink : inkMuted }}
                >
                  {item.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <Pressable
          onPress={() => openCapture('dump')}
          style={({ pressed }) => ({
            marginTop: space.sm,
            minHeight: 48,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: mode === 'dark' ? MARBLE.coral : 'rgba(255,255,255,0.95)',
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text
            variant="bodyStrong"
            color={mode === 'dark' ? '#1A1214' : MARBLE.rose}
          >
            + Capturar
          </Text>
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 10,
          paddingTop: space.md,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.15)',
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="bodyStrong" style={{ color: ink }}>
            {name.slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ color: ink }}>
            {name}
          </Text>
          <Text variant="caption" numberOfLines={1} style={{ color: inkMuted }}>
            Conta
          </Text>
        </View>
      </View>
    </View>
  )
}
