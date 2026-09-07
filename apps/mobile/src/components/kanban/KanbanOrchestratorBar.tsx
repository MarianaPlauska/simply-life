import { Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { buildOrchestrationHints, classifyDueBucket, type MobileTask } from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = { tasks: MobileTask[] }

/** Uma próxima ação — sem caixa de scores. */
export function KanbanOrchestratorBar({ tasks }: Props)
{
  const { colors } = useTheme()
  const router = useRouter()
  const top = buildOrchestrationHints(tasks)[0]
  if (!top) return null

  const overdue = tasks.filter(
    (t) => t.status !== 'done' && classifyDueBucket(t.dataVencimento, t.status) === 'vencido',
  ).length

  return (
    <Pressable
      onPress={() => router.push(`/task/${top.taskId}`)}
      accessibilityLabel="Próxima tarefa"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        minHeight: 44,
        paddingVertical: 4,
      }}
    >
      <Ionicons name="flash-outline" size={16} color={colors.axel} />
      <Text variant="caption" muted style={{ fontWeight: '700' }}>
        Agora
      </Text>
      <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1, fontSize: 15 }}>
        {top.titulo}
      </Text>
      {overdue > 0 ? (
        <Text variant="caption" color={colors.axel}>
          {overdue} atrasada{overdue === 1 ? '' : 's'}
        </Text>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
    </Pressable>
  )
}
