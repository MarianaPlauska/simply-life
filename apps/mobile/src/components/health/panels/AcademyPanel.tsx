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
import { Text, PrimaryButton, CheckRow } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useDataStore } from '../../../store/dataStore'
import { useAuthStore } from '../../../store/authStore'
import { useGamificationStore } from '../../../store/gamificationStore'
import { AcademyPlanSheet } from '../academy/AcademyPlanSheet'
import { HealthPanelHero } from '../HealthPanelHero'
import { HealthScreenSection } from '../HealthScreenSection'

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

  const subtitle = restDay
    ? 'Folga neste padrão. Edite os dias se quiser treinar.'
    : `${todayPlan.length} exercício${todayPlan.length === 1 ? '' : 's'} hoje`

  return (
    <View style={{ gap: space.md }}>
      <HealthPanelHero
        icon="barbell"
        kicker={academyDayLabel(todayKey)}
        headline={restDay ? 'Dia de folga' : 'Treino de hoje'}
        detail={subtitle}
        pillLabel={
          sessionDone ? 'Treino do dia feito' : restDay ? 'Descanso' : 'Pronto para começar'
        }
        pillColor={sessionDone ? colors.health : restDay ? colors.inkMuted : colors.axel}
      />
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
      <HealthScreenSection dividerTop>
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
      </HealthScreenSection>
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
