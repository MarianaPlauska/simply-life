import { useState } from 'react'
import { View } from 'react-native'
import {
  DEFAULT_ACADEMY_SESSION,
  academySessionProgress,
} from '@simply-life/shared'
import { Card, Text, SectionHeader, PrimaryButton, IconBadge, StatusPill, CheckRow } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useDataStore } from '../../../store/dataStore'
import { useAuthStore } from '../../../store/authStore'
import { findHabit } from '@simply-life/shared'
import { useGamificationStore } from '../../../store/gamificationStore'

export function AcademyPanel()
{
  const { colors, space } = useTheme()
  const habits = useDataStore((s) => s.habits)
  const toggleTreinoDone = useDataStore((s) => s.toggleTreinoDone)
  const isGuest = useAuthStore((s) => s.isGuest)
  const grantXp = useGamificationStore((s) => s.grantXp)
  const treino = findHabit(habits, 'treino')
  const sessionDone = Boolean(treino?.progressoAtual)
  const [doneIds, setDoneIds] = useState<string[]>([])
  const progress = academySessionProgress(doneIds)
  const pillBtn = { borderRadius: 999 as const }

  const toggleEx = (id: string) =>
  {
    setDoneIds((prev) =>
    {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      if (!prev.includes(id)) grantXp(4, 'Série de treino')
      return next
    })
  }

  return (
    <View style={{ gap: space.md }}>
      <Card tone="elevated" style={{ gap: space.md, borderRadius: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <IconBadge name="barbell" color={colors.health} size={44} iconSize={22} />
          <View style={{ flex: 1, gap: 6 }}>
            <SectionHeader title="Academy Mode" subtitle={`${progress.pct}% da sessão`} />
            <StatusPill
              label={sessionDone ? 'Treino do dia feito' : 'Sessão aberta'}
              color={sessionDone ? colors.health : colors.axel}
            />
          </View>
        </View>
        {DEFAULT_ACADEMY_SESSION.map((ex) => (
          <CheckRow
            key={ex.id}
            title={ex.name}
            subtitle={`${ex.sets}× ${ex.reps} · descanso ${ex.restSec}s`}
            done={doneIds.includes(ex.id)}
            onToggle={() => toggleEx(ex.id)}
          />
        ))}
        <PrimaryButton
          label={sessionDone ? 'Desmarcar sessão do dia' : 'Encerrar sessão'}
          onPress={() => void toggleTreinoDone(isGuest)}
          style={pillBtn}
        />
      </Card>
    </View>
  )
}
