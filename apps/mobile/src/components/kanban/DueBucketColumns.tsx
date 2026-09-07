import { useMemo, useState } from 'react'
import { ScrollView, View, useWindowDimensions } from 'react-native'
import {
  groupTasksByDueBucket,
  type DueBucket,
  type MobileTask,
  type TaskStatus,
} from '@simply-life/shared'
import { Text, Chip, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useWorkspace } from '../../layout/useWorkspace'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useCaptureStore } from '../../store/captureStore'
import { MoveTaskSheet } from './MoveTaskSheet'
import { MoveStatusSheet } from './MoveStatusSheet'
import { KanbanBoardCard } from './KanbanBoardCard'

type Props = {
  tasks: MobileTask[]
}

type BoardKind = 'prazo' | 'status'

const STATUS_COLS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'A fazer' },
  { id: 'doing', label: 'Fazendo' },
  { id: 'done', label: 'Feito' },
]

type Group = { id: string; label: string; tasks: MobileTask[] }

function BoardColumn({
  group,
  width,
  onToggle,
  onLongPress,
  onAdd,
}: {
  group: Group
  width?: number
  onToggle: (id: string) => void
  onLongPress: (id: string) => void
  onAdd: () => void
})
{
  return (
    <View style={width ? { width, gap: 10 } : { gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="section" style={{ fontSize: 16 }}>
          {group.label}
        </Text>
        <Text variant="caption" muted>
          {group.tasks.length}
        </Text>
      </View>
      {group.tasks.map((t) => (
        <KanbanBoardCard
          key={t.id}
          task={t}
          onToggle={() => onToggle(t.id)}
          onLongPress={() => onLongPress(t.id)}
        />
      ))}
      <PrimaryButton
        label="Nova tarefa"
        variant="link"
        size="sm"
        icon="add"
        onPress={onAdd}
      />
    </View>
  )
}

export function DueBucketColumns({ tasks }: Props)
{
  const { space } = useTheme()
  const { isMobile } = useWorkspace()
  const { width: winW } = useWindowDimensions()
  const isGuest = useAuthStore((s) => s.isGuest)
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const moveTaskBucket = useDataStore((s) => s.moveTaskBucket)
  const setTaskStatus = useDataStore((s) => s.setTaskStatus)
  const openCapture = useCaptureStore((s) => s.openCapture)
  const [kind, setKind] = useState<BoardKind>('prazo')
  const [moveId, setMoveId] = useState<string | null>(null)

  const prazoGroups = useMemo(() => groupTasksByDueBucket(tasks), [tasks])
  const statusGroups = useMemo(
    () =>
      STATUS_COLS.map((col) => ({
        id: col.id,
        label: col.label,
        tasks: tasks.filter((t) => t.status === col.id),
      })),
    [tasks],
  )
  const groups = (kind === 'prazo' ? prazoGroups : statusGroups) as Group[]
  const filled = groups.filter((g) => g.tasks.length > 0)
  const empty = groups.filter((g) => g.tasks.length === 0)
  const colW = Math.min(winW - 48, 340)
  const pageW = colW + 16

  const toggle = (id: string) => void toggleTaskDone(id, isGuest)
  const add = () => openCapture('task')

  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label="Prazo" active={kind === 'prazo'} onPress={() => setKind('prazo')} />
        <Chip label="Status" active={kind === 'status'} onPress={() => setKind('status')} />
      </View>

      {isMobile ? (
        <View style={{ gap: 22 }}>
          {filled.map((g) => (
            <BoardColumn
              key={g.id}
              group={g}
              onToggle={toggle}
              onLongPress={setMoveId}
              onAdd={add}
            />
          ))}
          {empty.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {empty.map((g) => (
                <Chip key={g.id} label={`${g.label} · 0`} onPress={add} />
              ))}
            </View>
          ) : null}
        </View>
      ) : (
        <ScrollView
          horizontal
          nestedScrollEnabled
          pagingEnabled={false}
          decelerationRate="fast"
          snapToInterval={pageW}
          snapToAlignment="start"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 16, paddingRight: 8 }}
        >
          {groups.map((g) => (
            <BoardColumn
              key={g.id}
              group={g}
              width={colW}
              onToggle={toggle}
              onLongPress={setMoveId}
              onAdd={add}
            />
          ))}
        </ScrollView>
      )}

      {kind === 'prazo' ? (
        <MoveTaskSheet
          visible={Boolean(moveId)}
          onClose={() => setMoveId(null)}
          onPick={(bucket: DueBucket) =>
          {
            if (moveId) void moveTaskBucket(moveId, bucket, isGuest)
          }}
        />
      ) : (
        <MoveStatusSheet
          visible={Boolean(moveId)}
          onClose={() => setMoveId(null)}
          onPick={(status) =>
          {
            if (moveId) void setTaskStatus(moveId, status, isGuest)
          }}
        />
      )}
    </View>
  )
}
