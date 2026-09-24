import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { buildOrchestrationHints, classifyDueBucket, type MobileTask } from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useBoardReplanStore } from '../../store/boardReplanStore'
import { useOrchestratorPrefsStore } from '../../store/orchestratorPrefsStore'

type Props = { tasks: MobileTask[] }

/** Uma próxima ação + reorganizar o quadro com o Axel. */
export function KanbanOrchestratorBar({ tasks }: Props)
{
  const { colors } = useTheme()
  const router = useRouter()
  const running = useBoardReplanStore((s) => s.running)
  const run = useBoardReplanStore((s) => s.run)
  const autoReplan = useOrchestratorPrefsStore((s) => s.autoReplan)
  const patchPrefs = useOrchestratorPrefsStore((s) => s.patch)
  const top = buildOrchestrationHints(tasks)[0]
  const hasOpen = tasks.some((t) => t.status !== 'done')
  if (!top && !hasOpen) return null

  const overdue = tasks.filter(
    (t) => t.status !== 'done' && classifyDueBucket(t.dataVencimento, t.status) === 'vencido',
  ).length

  return (
    <View style={{ gap: 2 }}>
      {top ? (
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
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Pressable
          onPress={() => void run('manual')}
          disabled={running}
          accessibilityRole="button"
          accessibilityLabel="Reorganizar o quadro com o Axel"
          hitSlop={6}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, opacity: running ? 0.5 : 1 }}
        >
          <Ionicons name="sparkles-outline" size={15} color={colors.axel} />
          <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
            {running ? 'Reorganizando…' : 'Reorganizar quadro'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/planejar-amanha')}
          accessibilityRole="button"
          accessibilityLabel="Planejar amanhã"
          hitSlop={6}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36 }}
        >
          <Ionicons name="moon-outline" size={15} color={colors.axel} />
          <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
            Planejar amanhã
          </Text>
        </Pressable>
        <Pressable
          onPress={() => patchPrefs({ autoReplan: !autoReplan })}
          accessibilityRole="switch"
          accessibilityState={{ checked: autoReplan }}
          accessibilityLabel="Reorganizar automaticamente"
          hitSlop={6}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36 }}
        >
          <Ionicons
            name={autoReplan ? 'checkmark-circle' : 'ellipse-outline'}
            size={15}
            color={autoReplan ? colors.axel : colors.inkMuted}
          />
          <Text variant="caption" muted>
            Automático
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
