import { useEffect, useMemo } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  WORKDAY_END_MIN,
  WORKDAY_START_MIN,
  agendaLoad,
  deadlinesAtRisk,
  localTodayIso,
  minutesLabel,
  type MobileTask,
} from '@simply-life/shared'
import { PaneTitle, PrimaryButton, Text, StatusPill } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useAccents } from '../../../theme/useAccents'
import { useCalendarStore } from '../../../store/calendarStore'
import { ReportCard, ReportRow, dayLabel, shortDate } from './ReportBits'

/** 2 e 3. Carga da agenda nos próximos 7 dias e prazos que não cabem no tempo livre. */
export function AgendaLoadPane({ tasks, embedded }: { tasks: MobileTask[]; embedded?: boolean })
{
  const { colors, space, radius } = useTheme()
  const accents = useAccents()
  const router = useRouter()
  const events = useCalendarStore((s) => s.events)
  const hydrate = useCalendarStore((s) => s.hydrate)

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  const today = localTodayIso()
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const days = useMemo(() => agendaLoad({ tasks, events, today, nowMin }), [tasks, events, today, nowMin])
  const risks = useMemo(() => deadlinesAtRisk({ tasks, events, today, nowMin }), [tasks, events, today, nowMin])
  const hasAgenda = events.length > 0
  const windowMin = WORKDAY_END_MIN - WORKDAY_START_MIN
  const heavy = days.filter((d) => d.overloaded).length

  return (
    <View style={{ gap: space.md }}>
      {embedded ? null : (
        <PaneTitle
          title="Agenda da semana"
          subtitle="Compromissos e tarefas contra o tempo livre, das 8h às 18h."
        />
      )}

      {!hasAgenda ? (
        <ReportCard title="Conecte sua agenda" hint="Sem compromissos, o app considera o dia todo livre. Com a agenda, a conta fica real.">
          <PrimaryButton label="Conectar agenda" variant="secondary" size="sm" icon="calendar-outline" onPress={() => router.push('/agenda')} />
        </ReportCard>
      ) : null}

      <ReportCard
        title="Próximos 7 dias"
        hint={heavy ? `${heavy} dia${heavy === 1 ? '' : 's'} com mais tarefa do que tempo livre.` : 'Todos os dias cabem no tempo livre.'}
      >
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Legend color={accents.data2} label="Compromissos" />
          <Legend color={accents.data} label="Tarefas" />
        </View>
        {days.map((d, i) =>
        {
          const busyPct = Math.min(100, (d.busyMin / windowMin) * 100)
          const taskPct = Math.min(100 - busyPct, (d.taskMin / windowMin) * 100)
          return (
            <View
              key={d.iso}
              style={{
                gap: 6,
                paddingVertical: 8,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: colors.hairline,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm }}>
                <Text variant="bodyStrong">{dayLabel(d.iso, today)}</Text>
                {d.overloaded ? <StatusPill label="Não cabe" color={colors.attention} /> : null}
              </View>
              <View style={{ flexDirection: 'row', height: 10, borderRadius: radius.pill, overflow: 'hidden', backgroundColor: colors.hairline }}>
                <View style={{ width: `${busyPct}%`, backgroundColor: accents.data2 }} />
                <View style={{ width: `${taskPct}%`, backgroundColor: accents.data }} />
              </View>
              <Text variant="caption" muted>
                {[
                  d.allDayBusy ? 'Dia ocupado' : d.meetings ? `${d.meetings} compromisso${d.meetings === 1 ? '' : 's'}, ${minutesLabel(d.busyMin)}` : 'Sem compromissos',
                  d.tasksDue ? `${d.tasksDue} tarefa${d.tasksDue === 1 ? '' : 's'}, ${minutesLabel(d.taskMin)}` : null,
                  d.focusBlocks ? `${d.focusBlocks} bloco${d.focusBlocks === 1 ? '' : 's'} de foco` : 'sem bloco de foco',
                ].filter(Boolean).join(' · ')}.
              </Text>
            </View>
          )
        })}
      </ReportCard>

      <ReportCard
        title="Prazos em risco"
        hint="Somando as estimativas até cada prazo, o tempo livre não chega. Tarefa sem estimativa conta como 30 min."
      >
        {risks.length ? (
          risks.slice(0, 8).map((r, i, arr) => (
            <ReportRow
              key={r.task.id}
              icon="alert-circle-outline"
              tint={colors.attention}
              title={r.task.titulo}
              detail={`Vence ${dayLabel(r.due, today).toLowerCase()}. Faltam ${minutesLabel(r.shortMin)} de tempo livre.`}
              right={shortDate(r.due)}
              last={i === arr.length - 1}
            />
          ))
        ) : (
          <Text variant="caption" muted>Nenhum prazo em risco nos próximos 14 dias.</Text>
        )}
        {risks.length ? (
          <Text variant="caption" muted>
            Para aliviar: mover um prazo, dividir a tarefa ou liberar um compromisso.
          </Text>
        ) : null}
      </ReportCard>
    </View>
  )
}

function Legend({ color, label }: { color: string; label: string })
{
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <Text variant="micro" muted>{label}</Text>
    </View>
  )
}
