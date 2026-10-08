import { useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Icon } from '../../../ui/Icon'
import { DAY_PLAN_MODE_COPY, completionDays, localTodayIso } from '@simply-life/shared'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useDataStore } from '../../../store/dataStore'
import { useCalendarStore } from '../../../store/calendarStore'
import { useAgendaPromptStore, useShowAgendaPrompt } from '../../../store/agendaPromptStore'
import { usePlanLogStore } from '../../../store/planLogStore'
import { useWebDesk } from '../../dashboard/web/webBox'

const hhmm = (m: number | null) => (m == null ? 'dia inteiro' : `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`)

/**
 * Diário → "Seu dia": o que estava na agenda e o que você concluiu hoje.
 * Ajuda a lembrar o que aconteceu antes de escrever (sem cobrar o que faltou).
 */
export function DiaryDaySummary()
{
  const { colors } = useTheme()
  const router = useRouter()
  const showAgendaPrompt = useShowAgendaPrompt()
  const snoozeAgenda = useAgendaPromptStore((s) => s.snooze)
  const tasks = useDataStore((s) => s.tasks) ?? []
  const events = useCalendarStore((s) => s.events)
  const source = useCalendarStore((s) => s.source)
  const completions = usePlanLogStore((s) => s.completions)
  const plans = usePlanLogStore((s) => s.plans)
  const today = localTodayIso()
  const desk = useWebDesk()

  const todayEvents = useMemo(() => events.filter((e) => e.date === today), [events, today])
  const doneToday = useMemo(() =>
  {
    const days = completionDays(tasks, completions)
    return tasks.filter((t) => t.status === 'done' && days.get(t.id) === today)
  }, [tasks, completions, today])
  const plan = plans.find((p) => p.date === today)

  return (
    <View style={{ gap: 12 }}>
      {plan ? (
        <Text variant="caption" muted>
          Plano de hoje: {DAY_PLAN_MODE_COPY[plan.mode].label.toLowerCase()}, feito ontem à noite.
        </Text>
      ) : null}

      {todayEvents.length ? (
        <View style={{ gap: 6 }}>
          <Text variant="caption" muted style={{ fontWeight: '600' }}>Na agenda</Text>
          {todayEvents.map((e) => (
            <View key={e.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Icon name="calendar-outline" size={14} color={colors.inkMuted} />
              <Text variant="body" style={{ flex: 1, fontSize: 14 }}>
                {hhmm(e.inicio)} · {e.titulo}
              </Text>
            </View>
          ))}
        </View>
      ) : source ? (
        <Text variant="caption" muted>Nada na agenda hoje.</Text>
      ) : showAgendaPrompt ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Pressable onPress={() => router.push('/agenda')} accessibilityRole="button" hitSlop={6} style={desk ? { flexShrink: 1 } : undefined}>
            <Text variant="caption" color={colors.axel} style={{ fontWeight: '600' }}>
              {desk ? 'Conectar agenda' : 'Conectar agenda para ver seus compromissos aqui.'}
            </Text>
          </Pressable>
          <Pressable onPress={snoozeAgenda} accessibilityRole="button" accessibilityLabel="Conectar agenda depois" hitSlop={6}>
            <Text variant="caption" muted style={{ fontWeight: '600' }}>
              Depois
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={{ gap: 6 }}>
        <Text variant="caption" muted style={{ fontWeight: '600' }}>
          {doneToday.length ? `Você concluiu ${doneToday.length === 1 ? '1 coisa' : `${doneToday.length} coisas`}` : 'Concluídas hoje'}
        </Text>
        {doneToday.length ? (
          doneToday.slice(0, 8).map((t) => (
            <View key={t.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Icon name="checkmark-circle" size={14} color={colors.axel} />
              <Text variant="body" style={{ flex: 1, fontSize: 14 }}>{t.titulo}</Text>
            </View>
          ))
        ) : (
          <Text variant="caption" muted>Nenhuma ainda, e está tudo bem. Registrar como você está já conta.</Text>
        )}
      </View>
    </View>
  )
}
