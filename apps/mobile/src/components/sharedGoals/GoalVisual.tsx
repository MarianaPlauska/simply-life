import { View } from 'react-native'
import {
  SHARED_GOAL_FAIXA_LABELS,
  SHARED_GOAL_RITMO_LABELS,
  type SharedGoalMemberCard,
  type SharedGoalProgress,
  type SharedGoalRitmo,
} from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { PersonAvatar } from '../social/PersonAvatar'

/** Pote que enche em quartos. Sem número: só as partes cheias. */
export function GoalPot({ faixa, size = 'lg' }: { faixa: number; size?: 'sm' | 'lg' })
{
  const { colors, mode } = useTheme()
  const fill = mode === 'dark' ? colors.brandInk : colors.brand
  const w = size === 'lg' ? 104 : 44
  const h = size === 'lg' ? 128 : 54
  const gap = size === 'lg' ? 4 : 2
  const filled = Math.max(0, Math.min(4, faixa))
  return (
    <View
      accessible
      accessibilityLabel={SHARED_GOAL_FAIXA_LABELS[filled as 0 | 1 | 2 | 3 | 4]}
      style={{ alignItems: 'center' }}
    >
      {/* borda do pote */}
      <View
        style={{
          width: w * 0.6,
          height: size === 'lg' ? 10 : 5,
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          backgroundColor: colors.hairlineStrong,
        }}
      />
      <View
        style={{
          width: w,
          height: h,
          borderRadius: size === 'lg' ? 28 : 12,
          borderTopLeftRadius: size === 'lg' ? 18 : 8,
          borderTopRightRadius: size === 'lg' ? 18 : 8,
          borderWidth: 2,
          borderColor: colors.hairlineStrong,
          padding: gap + 2,
          gap,
          justifyContent: 'flex-end',
          overflow: 'hidden',
        }}
      >
        {[3, 2, 1, 0].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              borderRadius: size === 'lg' ? 12 : 5,
              backgroundColor: i < filled ? fill : 'transparent',
              opacity: i < filled ? 0.35 + 0.65 * ((i + 1) / 4) : 1,
            }}
          />
        ))}
      </View>
    </View>
  )
}

const RITMO_ORDER: SharedGoalRitmo[] = ['atras', 'no_ritmo', 'a_frente']

/** Três passos: atrás, no ritmo, à frente. Só o do grupo acende. */
export function GoalPace({ ritmo }: { ritmo: SharedGoalRitmo | null })
{
  const { colors, space, mode } = useTheme()
  const on = mode === 'dark' ? colors.brandInk : colors.brand
  return (
    <View style={{ flexDirection: 'row', gap: space.xs }}>
      {RITMO_ORDER.map((r) => (
        <View
          key={r}
          style={{
            flex: 1,
            minHeight: 36,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 6,
            backgroundColor: r === ritmo ? on : colors.elevated,
          }}
        >
          <Text variant="micro" color={r === ritmo ? colors.onBrand : colors.inkMuted} numberOfLines={1}>
            {SHARED_GOAL_RITMO_LABELS[r]}
          </Text>
        </View>
      ))}
    </View>
  )
}

/** Quem está na meta, sem número nenhum */
export function GoalMembersRow({ members, max = 5 }: { members: SharedGoalMemberCard[]; max?: number })
{
  return (
    <View style={{ flexDirection: 'row' }}>
      {members.slice(0, max).map((m, i) => (
        <View key={m.userId} style={{ marginLeft: i === 0 ? 0 : -10 }}>
          <PersonAvatar name={m.isMe ? 'Você' : m.displayName} accent={m.accent} avatarStyle={m.avatarStyle} size={36} ring />
        </View>
      ))}
    </View>
  )
}

/** Visual principal do progresso (faixas = pote; ritmo = três passos) */
export function GoalProgressVisual({ progress, compact }: { progress: SharedGoalProgress | null; compact?: boolean })
{
  if (!progress) return compact ? <GoalPot faixa={0} size="sm" /> : null
  if (progress.exibicao === 'faixas') return <GoalPot faixa={progress.faixa ?? 0} size={compact ? 'sm' : 'lg'} />
  if (compact) return null
  if (progress.modo === 'cada_um') return null
  return <GoalPace ritmo={progress.ritmo} />
}
