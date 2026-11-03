import { useEffect } from 'react'
import { Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Icon } from '../../ui/Icon'
import { DAY_PLAN_MODE_COPY, addDaysIso, firstTinyStep, localTodayIso } from '@simply-life/shared'
import { GroupedList, GroupedRow, RowGlyph } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { usePlanLogStore } from '../../store/planLogStore'

const EVENING_HOUR = 18

/**
 * Home: à noite convida para planejar amanhã; de dia mostra o plano de hoje
 * (essenciais + o primeiro passo do próximo). Some quando não tem nada a dizer.
 */
export function DayPlanHomeCard()
{
  const { colors } = useTheme()
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const tasks = useDataStore((s) => s.tasks) ?? []
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const hydrate = usePlanLogStore((s) => s.hydrate)
  const plans = usePlanLogStore((s) => s.plans)
  const dismissed = usePlanLogStore((s) => s.eveningDismissed)
  const dismissEvening = usePlanLogStore((s) => s.dismissEvening)

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  const now = new Date()
  const today = localTodayIso(now)
  const tomorrow = addDaysIso(today, 1)
  const evening = now.getHours() >= EVENING_HOUR
  const planToday = plans.find((p) => p.date === today) ?? null
  const planTomorrow = plans.find((p) => p.date === tomorrow) ?? null

  if (evening)
  {
    if (planTomorrow)
    {
      return (
        <GroupedList>
          <GroupedRow
            leading={<RowGlyph name="moon" color={colors.tasks} />}
            title="Amanhã já está planejado"
            subtitle={`${DAY_PLAN_MODE_COPY[planTomorrow.mode].label}. Bom descanso.`}
            onPress={() => router.push('/planejar-amanha')}
          />
        </GroupedList>
      )
    }
    if (dismissed === today) return null
    return (
      <GroupedList>
        <GroupedRow
          leading={<RowGlyph name="moon" color={colors.tasks} />}
          title="Planejar amanhã"
          subtitle="Uns 3 minutos com o Axel"
          onPress={() => router.push('/planejar-amanha')}
          chevron={false}
          trailing={(
            <Pressable
              onPress={() => dismissEvening(today)}
              accessibilityLabel="Agora não"
              hitSlop={8}
              style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="close" size={18} color={colors.inkFaint} />
            </Pressable>
          )}
        />
      </GroupedList>
    )
  }

  if (!planToday || planToday.essentialIds.length === 0) return null
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const essentials = planToday.essentialIds.map((id) => byId.get(id)).filter(Boolean) as typeof tasks
  if (!essentials.length) return null
  const next = essentials.find((t) => t.status !== 'done')
  const doneCount = essentials.filter((t) => t.status === 'done').length

  return (
    <GroupedList>
      <GroupedRow
        leading={<RowGlyph name="today" color={colors.axelFill} />}
        title="Seu plano de hoje"
        subtitle={
          next
            ? `Próximo passo: ${firstTinyStep(next.titulo, next.checklist).toLowerCase()}`
            : doneCount === essentials.length
              ? 'Essenciais feitos. O resto é bônus.'
              : undefined
        }
        value={DAY_PLAN_MODE_COPY[planToday.mode].label}
        onPress={() => router.push('/ritmo')}
      />
      {essentials.map((t) => (
        <GroupedRow
          key={t.id}
          leading={(
            <RowGlyph color="transparent">
              <Icon
                name={t.status === 'done' ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={t.status === 'done' ? colors.health : colors.inkMuted}
              />
            </RowGlyph>
          )}
          title={t.titulo}
          muted={t.status === 'done'}
          chevron={false}
          accessibilityLabel={`${t.titulo}, ${t.status === 'done' ? 'feita' : 'a fazer'}`}
          onPress={() => void toggleTaskDone(t.id, isGuest)}
        />
      ))}
    </GroupedList>
  )
}
