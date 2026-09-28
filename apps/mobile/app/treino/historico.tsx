import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { formatWorkoutKg, workoutSessionVolume, type WorkoutSession } from '@simply-life/shared'
import { PrimaryButton, Screen, Text } from '../../src/ui'
import { StackHeader } from '../../src/components/layout/StackHeader'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useAuthStore } from '../../src/store/authStore'
import { useWorkoutStore } from '../../src/store/workoutStore'
import { confirmDestructive } from '../../src/lib/confirmDestructive'
import { useWorkoutHydrate } from '../../src/components/health/workout/useWorkoutHydrate'
import { WorkoutSessionItem } from '../../src/components/health/workout/WorkoutSessionItem'

const PAGE = 30

function monthKey(iso: string): string
{
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso.slice(0, 7) : d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

/** Histórico completo: sem teto, paginado só na tela para ficar leve. */
export default function TreinoHistoricoScreen()
{
  useWorkoutHydrate()
  const { space } = useTheme()
  const isGuest = useAuthStore((s) => s.isGuest)
  const sessions = useWorkoutStore((s) => s.sessions)
  const deleteSession = useWorkoutStore((s) => s.deleteSession)
  const [shown, setShown] = useState(PAGE)

  const groups = useMemo(() =>
  {
    const out: { key: string; items: WorkoutSession[]; volume: number }[] = []
    for (const s of sessions.slice(0, shown))
    {
      const key = monthKey(s.startedAt)
      let g = out[out.length - 1]
      if (!g || g.key !== key)
      {
        g = { key, items: [], volume: 0 }
        out.push(g)
      }
      g.items.push(s)
      g.volume += workoutSessionVolume(s)
    }
    return out
  }, [sessions, shown])

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Histórico de treinos" subtitle={`${sessions.length} ${sessions.length === 1 ? 'treino' : 'treinos'} no total`} />
      <View style={{ gap: space.lg }}>
        {sessions.length === 0 ? (
          <Text variant="caption" muted>Nenhum treino ainda. O primeiro vai aparecer aqui.</Text>
        ) : null}
        {groups.map((g) => (
          <View key={g.key} style={{ gap: space.sm }}>
            <Text variant="label" muted style={{ textTransform: 'capitalize' }}>
              {g.key} · {g.items.length} {g.items.length === 1 ? 'treino' : 'treinos'}
              {g.volume > 0 ? ` · ${formatWorkoutKg(g.volume)}` : ''}
            </Text>
            {g.items.map((s) => (
              <WorkoutSessionItem
                key={s.id}
                session={s}
                onDelete={() =>
                  confirmDestructive('Apagar treino?', 'Ele sai do histórico e dos recordes.', () => void deleteSession(s.id, isGuest), 'Apagar')}
              />
            ))}
          </View>
        ))}
        {sessions.length > shown ? (
          <PrimaryButton label="Mostrar mais" variant="ghost" onPress={() => setShown((n) => n + PAGE)} />
        ) : null}
      </View>
    </Screen>
  )
}
