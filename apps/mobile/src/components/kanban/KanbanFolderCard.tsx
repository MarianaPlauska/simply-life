import { View, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { daysUntilDue, formatCountdown, type ScopeSnapshot } from '@simply-life/shared'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { MetricTrack } from '../metrics/MetricTrack'

type Props = {
  scope: ScopeSnapshot
  onPress: () => void
  onToggle?: () => void
}

function formatDue(iso: string | null): string
{
  if (!iso) return 'Sem prazo'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** Card de pasta no estilo metas: checkbox, prazo, barra e percentual. */
export function KanbanFolderCard({ scope, onPress, onToggle }: Props)
{
  const { colors, mode } = useTheme()
  const complete = scope.total > 0 && scope.open === 0
  const days = daysUntilDue(scope.latestDue)
  const cardBg = mode === 'dark' ? 'rgba(28, 28, 30, 0.72)' : colors.elevated

  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: 18,
        backgroundColor: cardBg,
        padding: 14,
        gap: 10,
        minHeight: 88,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <PressableScale
          accessibilityRole="checkbox"
          accessibilityState={{ checked: complete }}
          accessibilityLabel={complete ? 'Pasta concluída' : 'Pasta em andamento'}
          onPress={onToggle ?? onPress}
          style={{
            width: 26,
            height: 26,
            borderRadius: 999,
            borderWidth: complete ? 0 : 1.5,
            borderColor: colors.ink,
            backgroundColor: complete ? colors.done : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {complete ? <Ionicons name="checkmark" size={14} color={colors.axelOnFill} /> : null}
        </PressableScale>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ fontSize: 16 }}>
            {scope.name}
          </Text>
          <Text variant="micro" muted>
            {scope.kind === 'life' ? 'Pilar' : scope.kind === 'loose' ? 'Soltas' : 'Pasta'}
            {' · '}
            {scope.open} aberta{scope.open === 1 ? '' : 's'}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text variant="caption" muted>
            {formatDue(scope.latestDue)}
          </Text>
          <Text variant="micro" color={days != null && days < 0 ? colors.danger : colors.inkMuted}>
            {formatCountdown(days)}
          </Text>
        </View>
      </View>
      <MetricTrack
        pct={scope.pct}
        currentLabel={`${scope.done}`}
        targetLabel={`${scope.total} (${scope.pct}%)`}
        fill={scope.color}
      />
    </Pressable>
  )
}
