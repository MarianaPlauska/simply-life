import { View } from 'react-native'
import { buildOrchestrationHints, type MobileTask } from '@simply-life/shared'
import { Card, Text, StatusPill } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = { tasks: MobileTask[] }

export function KanbanOrchestratorBar({ tasks }: Props)
{
  const { space, colors } = useTheme()
  const hints = buildOrchestrationHints(tasks).slice(0, 3)
  const open = tasks.filter((t) => t.status !== 'done').length
  if (hints.length === 0) return null

  return (
    <Card tone="elevated" style={{ gap: space.sm, borderRadius: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="section">Orquestrador</Text>
        <StatusPill label={`${open} abertas`} color={colors.axel} />
      </View>
      {hints.map((h) => (
        <View key={h.taskId} style={{ gap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {h.titulo}
          </Text>
          <Text variant="caption" muted>
            {h.rationale} · score {h.score}
          </Text>
        </View>
      ))}
    </Card>
  )
}
