import { useEffect, useMemo } from 'react'
import { View } from 'react-native'
import {
  buildLifeScopeSnapshots,
  buildUserScopeSnapshots,
  type MobileTask,
} from '@simply-life/shared'
import { Text, PaneTitle } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useKanbanListsStore } from '../../store/kanbanListsStore'
import { LifeSummaryReport } from '../metrics/LifeSummaryReport'
import { KanbanFolderCard } from './KanbanFolderCard'
import { useRouter } from 'expo-router'

type Props = { tasks: MobileTask[] }

/** Desempenho das tarefas no mesmo framework do resumo geral. */
export function KanbanReportsPane({ tasks }: Props)
{
  const { space, chart } = useTheme()
  const router = useRouter()
  const lists = useKanbanListsStore((s) => s.lists)
  const hydrate = useKanbanListsStore((s) => s.hydrate)

  useEffect(() =>
  {
    hydrate()
  }, [hydrate])

  const snapshots = useMemo(() =>
  {
    const user = buildUserScopeSnapshots(tasks, lists, chart)
    const life = buildLifeScopeSnapshots(tasks, chart).filter((s) => s.total > 0)
    return [...user, ...life]
  }, [tasks, lists, chart])

  const open = snapshots.filter((s) => s.open > 0).slice(0, 6)

  return (
    <View style={{ gap: space.md }}>
      <PaneTitle title="Desempenho" subtitle="O que foi feito, o que ficou e o ritmo da semana." />
      <LifeSummaryReport variant="tasks" snapshots={snapshots} />
      {open.length > 0 ? (
        <View style={{ gap: 12 }}>
          <Text variant="section">
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
