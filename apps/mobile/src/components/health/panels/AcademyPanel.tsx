import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  academyDayLabel,
  academySessionProgress,
  academyWeekKey,
  findHabit,
  resolveAcademyDay,
  weekPlanFromConfig,
} from '@simply-life/shared'
import { Card, Text, SectionHeader, PrimaryButton, IconBadge, StatusPill, CheckRow } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useDataStore } from '../../../store/dataStore'
import { useAuthStore } from '../../../store/authStore'
import { useGamificationStore } from '../../../store/gamificationStore'
import { AcademyPlanSheet } from '../academy/AcademyPlanSheet'

export function AcademyPanel()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const habits = useDataStore((s) => s.habits)
  const toggleTreinoDone = useDataStore((s) => s.toggleTreinoDone)
  const patchTreinoConfig = useDataStore((s) => s.patchTreinoConfig)
  const isGuest = useAuthStore((s) => s.isGuest)
  const grantXp = useGamificationStore((s) => s.grantXp)
  const treino = findHabit(habits, 'treino')
  const weekPlan = useMemo(() => weekPlanFromConfig(treino?.config), [treino?.config])
  const todayKey = academyWeekKey()
  const todayPlan = resolveAcademyDay(weekPlan, todayKey)
  const restDay = todayPlan.length === 0
  const sessionDone = Boolean(treino?.progressoAtual)
  const [doneIds, setDoneIds] = useState<string[]>([])
  const [editorOpen, setEditorOpen] = useState(false)
  const progress = academySessionProgress(doneIds, todayPlan)
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
            <SectionHeader
              title={`${academyDayLabel(todayKey)} no calendário`}
              subtitle={restDay ? 'Folga neste padrão. Edite os dias se quiser treinar.' : `${todayPlan.length} exercício${todayPlan.length === 1 ? '' : 's'} hoje`}
            />
            <StatusPill
              label={sessionDone ? 'Treino do dia feito' : restDay ? 'Dia de folga' : 'Pronto para começar'}
              color={sessionDone ? colors.health : restDay ? colors.inkMuted : colors.axel}
            />
          </View>
        </View>
        {!restDay ? (
          <Text variant="caption" muted>
            {progress.pct}% marcado à mão, se treinar fora do modo.
          </Text>
        ) : null}
        {!restDay ? (
          <PrimaryButton
            label="Entrar no treino"
            onPress={() => router.push('/academia/sessao')}
            style={pillBtn}
          />
        ) : null}
        {todayPlan.map((ex) => (
          <CheckRow
            key={ex.id}
            title={ex.name}
            subtitle={`${ex.sets}× ${ex.reps} · descanso ${ex.restSec}s`}
            done={doneIds.includes(ex.id)}
            onToggle={() => toggleEx(ex.id)}
          />
        ))}
        <PrimaryButton
          label="Editar exercícios da semana"
          variant="secondary"
          onPress={() => setEditorOpen(true)}
          style={pillBtn}
        />
        <PrimaryButton
          label={sessionDone ? 'Desmarcar sessão do dia' : 'Encerrar sessão'}
          variant="ghost"
          onPress={() => void toggleTreinoDone(isGuest)}
          style={pillBtn}
        />
      </Card>
      <AcademyPlanSheet
        visible={editorOpen}
        plan={weekPlan}
        savedConfig={treino?.config}
        onClose={() => setEditorOpen(false)}
        onSave={(config) => void patchTreinoConfig(config, isGuest)}
      />
    </View>
  )
}
