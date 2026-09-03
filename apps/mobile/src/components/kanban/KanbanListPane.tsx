import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { minutesToLabel, type MobileTask } from '@simply-life/shared'
import { Card, Text, CheckRow, EmptyState } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'

type Props = { tasks: MobileTask[] }

export function KanbanListPane({ tasks }: Props)
{
  const { space } = useTheme()
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const open = tasks.filter((t) => t.status !== 'done')
  const done = tasks.filter((t) => t.status === 'done')

  if (tasks.length === 0)
  {
    return <EmptyState title="Sem tarefas" body="Capture uma intenção." icon="list-outline" />
  }

  return (
    <View style={{ gap: space.md }}>
      <Card tone="elevated" style={{ gap: space.xs }}>
        <Text variant="section">Lista AXEL</Text>
        {open.map((t, i) => (
          <CheckRow
            key={t.id}
            title={t.titulo}
            subtitle={
              t.horaMinutos != null
                ? minutesToLabel(t.horaMinutos)
                : t.dataVencimento ?? 'Sem prazo'
            }
            done={false}
            onPress={() => router.push(`/task/${t.id}`)}
            onToggle={() => void toggleTaskDone(t.id, isGuest)}
            showSeparator={i < open.length - 1}
          />
        ))}
      </Card>
      {done.length > 0 ? (
        <Card tone="elevated" style={{ gap: space.xs }}>
          <Text variant="caption" muted>
            Concluídas ({done.length})
          </Text>
          {done.slice(0, 8).map((t) => (
            <CheckRow
              key={t.id}
              title={t.titulo}
              done
              onPress={() => router.push(`/task/${t.id}`)}
              onToggle={() => void toggleTaskDone(t.id, isGuest)}
            />
          ))}
        </Card>
      ) : null}
    </View>
  )
}
