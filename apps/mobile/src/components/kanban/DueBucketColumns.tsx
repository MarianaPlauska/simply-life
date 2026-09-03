import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  groupTasksByDueBucket,
  minutesToLabel,
  type DueBucket,
  type MobileTask,
} from '@simply-life/shared'
import { Card, Text, CheckRow } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useWorkspace } from '../../layout/useWorkspace'
import { MoveTaskSheet } from './MoveTaskSheet'

type Props = {
  tasks: MobileTask[]
}

/** Colunas por prazo: Passou da data … Intenções */
export function DueBucketColumns({ tasks }: Props)
{
  const { space } = useTheme()
  const { showRail } = useWorkspace()
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const moveTaskBucket = useDataStore((s) => s.moveTaskBucket)
  const groups = groupTasksByDueBucket(tasks)
  const [moveId, setMoveId] = useState<string | null>(null)

  const columns = groups.map((g) => (
    <Card
      key={g.id}
      tone="elevated"
      style={{
        width: showRail ? 260 : undefined,
        minWidth: showRail ? 240 : undefined,
        flex: showRail ? undefined : 1,
        borderRadius: 16,
        gap: space.sm,
        paddingVertical: space.sm,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: space.sm,
          paddingTop: space.sm,
        }}
      >
        <Text variant="section" style={{ fontSize: 14 }} numberOfLines={1}>
          {g.label}
        </Text>
        <Text variant="caption" muted>
          {g.tasks.length}
        </Text>
      </View>
      {g.tasks.length === 0 ? (
        <Text variant="caption" muted style={{ padding: space.md }}>
          Vazio
        </Text>
      ) : (
        g.tasks.map((t, i) => (
          <CheckRow
            key={t.id}
            dense
            title={t.titulo}
            subtitle={
              t.horaMinutos != null
                ? minutesToLabel(t.horaMinutos)
                : t.dataVencimento ?? undefined
            }
            done={t.status === 'done'}
            onPress={() => router.push(`/task/${t.id}`)}
            onToggle={() => void toggleTaskDone(t.id, isGuest)}
            onLongPress={() => setMoveId(t.id)}
            showSeparator={i < g.tasks.length - 1}
          />
        ))
      )}
    </Card>
  ))

  const sheet = (
    <MoveTaskSheet
      visible={Boolean(moveId)}
      onClose={() => setMoveId(null)}
      onPick={(bucket: DueBucket) =>
      {
        if (moveId) void moveTaskBucket(moveId, bucket, isGuest)
      }}
    />
  )

  if (!showRail)
  {
    return (
      <>
        <View style={{ gap: space.md }}>{columns}</View>
        {sheet}
      </>
    )
  }

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, paddingBottom: 8 }}
      >
        {columns}
      </ScrollView>
      {sheet}
    </>
  )
}
