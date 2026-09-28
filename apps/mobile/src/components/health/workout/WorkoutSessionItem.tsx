import { useState } from 'react'
import { Pressable, View } from 'react-native'
import {
  formatWorkoutKg,
  workoutDurationMin,
  workoutSessionTotals,
  type WorkoutSession,
} from '@simply-life/shared'
import { Card, Icon, Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'

export function formatWorkoutDate(iso: string): string
{
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const day = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${day.replace('.', '')} · ${time}`
}

/** Um treino do histórico; toque abre as séries. */
export function WorkoutSessionItem({
  session,
  onDelete,
}: {
  session: WorkoutSession
  onDelete?: () => void
})
{
  const { colors, space } = useTheme()
  const [open, setOpen] = useState(false)
  const t = workoutSessionTotals(session)
  const dur = workoutDurationMin(session)

  return (
    <Card tone="elevated" style={{ padding: space.md, gap: space.sm }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44 }}
      >
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text variant="bodyStrong" numberOfLines={1}>{session.title}</Text>
          <Text variant="caption" muted numberOfLines={1}>{formatWorkoutDate(session.startedAt)}</Text>
          <Text variant="micro" muted>
            {dur} min · {t.sets} {t.sets === 1 ? 'série' : 'séries'}
            {t.volumeKg > 0 ? ` · ${formatWorkoutKg(t.volumeKg)}` : ''}
          </Text>
        </View>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.inkMuted} />
      </Pressable>
      {open ? (
        <View style={{ gap: space.sm }}>
          {session.exercises.length === 0 ? (
            <Text variant="caption" muted>Sem séries detalhadas neste registro.</Text>
          ) : null}
          {session.exercises.map((e) => (
            <View key={e.id} style={{ gap: 4 }}>
              <Text variant="label">{e.name}</Text>
              <Text variant="caption" muted>
                {e.sets
                  .map((s) => `${s.cargaKg ? `${String(s.cargaKg).replace('.', ',')} kg × ` : ''}${s.reps}${s.rpe ? ` (RPE ${s.rpe})` : ''}`)
                  .join(' · ')}
              </Text>
            </View>
          ))}
          {onDelete ? (
            <Pressable onPress={onDelete} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text variant="label" color={colors.danger}>Apagar este treino</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Card>
  )
}
