import { useEffect, useMemo } from 'react'
import { View } from 'react-native'
import {
  buildLifeScopeSnapshots,
  buildUserScopeSnapshots,
  type MobileTask,
} from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useKanbanListsStore } from '../../store/kanbanListsStore'
import { LifeSummaryReport } from '../metrics/LifeSummaryReport'
import { KanbanFolderCard } from './KanbanFolderCard'
import { useRouter } from 'expo-router'

type Props = { tasks: MobileTask[] }

/** Desempenho das tarefas no mesmo framework do resumo geral. */
export function KanbanReportsPane({ tasks }: Props)
{
  const { space } = useTheme()
  const router = useRouter()
  const lists = useKanbanListsStore((s) => s.lists)
  const hydrate = useKanbanListsStore((s) => s.hydrate)

  useEffect(() =>
  {
    hydrate()
  }, [hydrate])

  const snapshots = useMemo(() =>
  {
    const user = buildUserScopeSnapshots(tasks, lists)
    const life = buildLifeScopeSnapshots(tasks).filter((s) => s.total > 0)
    return [...user, ...life]
  }, [tasks, lists])

  const open = snapshots.filter((s) => s.open > 0).slice(0, 6)

  return (
    <View style={{ gap: space.md }}>
      <View style={{ gap: 4 }}>
        <Text variant="hero" style={{ fontSize: 26, letterSpacing: -0.6 }}>
          Desempenho
        </Text>
        <Text variant="caption" muted>
          O que foi feito, o que ficou e o ritmo da semana.
        </Text>
      </View>
      <LifeSummaryReport variant="tasks" snapshots={snapshots} />
      {open.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Text variant="section" style={{ fontSize: 16 }}>
            Pastas em andamento
          </Text>
          {open.map((scope) => (
            <KanbanFolderCard
              key={scope.id}
              scope={scope}
              onPress={() => router.push(`/pasta/${scope.id}` as never)}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
}
