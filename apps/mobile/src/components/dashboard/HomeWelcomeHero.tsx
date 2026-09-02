import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, PressableScale, Card } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { SyncHint } from '../SyncHint'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWorkspace } from '../../layout/useWorkspace'

type Props = {
  greet: string
  name: string
  /** Nível 1 — saldo disponível (hero) */
  saldoLabel: string
  openTasks: number
  doneToday: number
  onMenu: () => void
}

/**
 * Hero Home:
 * - Mobile: bloco wallet com gradiente de marca
 * - Desktop: superfície neutra + cobre só no saldo (legível ao lado do rail)
 */
export function HomeWelcomeHero({
  greet,
  name,
  saldoLabel,
  openTasks,
  doneToday,
  onMenu,
}: Props)
{
  const { colors, space, mode } = useTheme()
  const { showRail } = useWorkspace()
  const insets = useSafeAreaInsets()

  if (showRail)
  {
    // Desktop Drive: banner de boas-vindas + KPIs compactos
    const bannerColors =
      mode === 'dark'
        ? (['#1A1430', '#2A1848', '#3D2060'] as const)
        : (['#EDE4FF', '#F3E8FF', '#E8D5F5'] as const)

    return (
      <View style={{ gap: space.md, marginBottom: space.sm }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: space.sm,
          }}
        >
          <SyncHint />
          <PressableScale
            onPress={onMenu}
            accessibilityLabel="Menu"
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.elevated,
              borderWidth: 1,
              borderColor: colors.hairline,
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.ink} />
          </PressableScale>
        </View>

        <LinearGradient
          colors={[...bannerColors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 22,
            paddingVertical: space.xl,
            paddingHorizontal: space.xl,
            minHeight: 148,
            overflow: 'hidden',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: space.lg,
          }}
        >
          <View style={{ flex: 1, gap: 8, minWidth: 200 }}>
            <Text
              variant="title"
              style={{
                fontSize: 28,
                letterSpacing: -0.4,
                color: mode === 'dark' ? '#F5F5F7' : '#1A1430',
              }}
            >
              {greet}, {name}
            </Text>
            <Text
              variant="body"
              style={{
                color: mode === 'dark' ? 'rgba(245,245,247,0.72)' : 'rgba(26,20,48,0.72)',
                maxWidth: 420,
              }}
            >
              Saldo {saldoLabel} · {openTasks} tarefas em aberto. O essencial do dia, no seu ritmo.
            </Text>
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: 4, flexWrap: 'wrap' }}>
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: colors.axel,
                }}
              >
                <Text variant="label" style={{ color: colors.axelOnFill, fontWeight: '700' }}>
                  {String(doneToday).padStart(2, '0')} feitas hoje
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor:
                    mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.55)',
                }}
              >
                <Text
                  variant="label"
                  style={{
                    color: mode === 'dark' ? '#F5F5F7' : '#1A1430',
                    fontWeight: '600',
                  }}
                >
                  {String(openTasks).padStart(2, '0')} em aberto
                </Text>
              </View>
            </View>
          </View>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 28,
              backgroundColor:
                mode === 'dark' ? 'rgba(255,106,43,0.22)' : 'rgba(160,92,61,0.18)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name="sparkles"
              size={40}
              color={mode === 'dark' ? colors.axel : colors.axel}
            />
          </View>
        </LinearGradient>
      </View>
    )
  }

  const topPad = Math.max(insets.top, 8)
  const g0 = colors.axel
  const g1 = colors.axelHover

  return (
    <View
      style={{
        marginHorizontal: -COMPONENT_PAD,
        marginTop: -space.sm,
        marginBottom: space.md,
      }}
    >
      <LinearGradient
        colors={[g0, g1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: topPad + space.md,
          paddingBottom: space.xl + 28,
          paddingHorizontal: COMPONENT_PAD + 4,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: space.lg,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                backgroundColor: 'rgba(247,246,242,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(247,246,242,0.35)',
              }}
            >
              <Text variant="section" style={{ color: colors.axelOnFill }}>
                {name.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="caption" style={{ color: 'rgba(247,246,242,0.75)' }}>
                {greet}
              </Text>
              <Text
                variant="title"
                numberOfLines={1}
                style={{ color: colors.axelOnFill, letterSpacing: -0.3 }}
              >
                {name}
              </Text>
              <SyncHint color="rgba(247,246,242,0.72)" />
            </View>
          </View>
          <PressableScale
            onPress={onMenu}
            accessibilityLabel="Menu"
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(247,246,242,0.16)',
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.axelOnFill} />
          </PressableScale>
        </View>

        <Text
          variant="caption"
          style={{
            color: 'rgba(247,246,242,0.72)',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 6,
          }}
        >
          Saldo disponível
        </Text>
        <Text
          variant="hero"
          style={{
            color: colors.axelOnFill,
            fontSize: 36,
            letterSpacing: -0.8,
            marginBottom: space.md,
          }}
        >
          {saldoLabel}
        </Text>

        <View style={{ flexDirection: 'row', gap: space.lg }}>
          <View style={{ gap: 2 }}>
            <Text variant="micro" style={{ color: 'rgba(247,246,242,0.65)' }}>
              Em aberto
            </Text>
            <Text variant="title" style={{ color: colors.axelOnFill, fontSize: 20 }}>
              {String(openTasks).padStart(2, '0')}
            </Text>
          </View>
          <View style={{ gap: 2 }}>
            <Text variant="micro" style={{ color: 'rgba(247,246,242,0.65)' }}>
              Feitas hoje
            </Text>
            <Text variant="title" style={{ color: colors.axelOnFill, fontSize: 20 }}>
              {String(doneToday).padStart(2, '0')}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  )
}

/** Alinha com padding do Screen no mobile */
const COMPONENT_PAD = 16
