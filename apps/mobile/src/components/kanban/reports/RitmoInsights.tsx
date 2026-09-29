import { useEffect, useMemo } from 'react'
import { View } from 'react-native'
import {
  DAY_PERIOD_LABEL,
  bestHours,
  completionTimes,
  energyDelivery,
  formatSleepHours,
  localTodayIso,
  type DayPeriod,
  type MobileTask,
} from '@simply-life/shared'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useAccents } from '../../../theme/useAccents'
import { usePlanLogStore } from '../../../store/planLogStore'
import { useFocusLogStore } from '../../../store/focusLogStore'
import { useBodyWeekStore } from '../../../store/bodyWeekStore'
import { useDataStore } from '../../../store/dataStore'
import { ReportCard } from './ReportBits'

const PERIODS: DayPeriod[] = ['manha', 'tarde', 'noite', 'madrugada']
const PERIOD_HINT: Record<DayPeriod, string> = {
  manha: '5h às 12h',
  tarde: '12h às 18h',
  noite: '18h às 24h',
  madrugada: '0h às 5h',
}

/** 7 e 8. Quando você rende mais, e como sono e humor andam com o que você entrega. */
export function RitmoInsights({ tasks }: { tasks: MobileTask[] })
{
  const { colors, space, radius } = useTheme()
  const accents = useAccents()
  const completions = usePlanLogStore((s) => s.completions)
  const hydrateLog = usePlanLogStore((s) => s.hydrate)
  const sessions = useFocusLogStore((s) => s.sessions)
  const hydrateFocus = useFocusLogStore((s) => s.hydrate)
  const sleepHours = useBodyWeekStore((s) => s.sleepHours)
  const hydrateBody = useBodyWeekStore((s) => s.hydrate)
  const humor = useDataStore((s) => s.humor) ?? []

  useEffect(() =>
  {
    void hydrateLog()
    void hydrateFocus()
    hydrateBody()
  }, [hydrateLog, hydrateFocus, hydrateBody])

  const times = useMemo(() => completionTimes(tasks, completions), [tasks, completions])
  const hours = useMemo(() => bestHours({ completions: times, focus: sessions }), [times, sessions])
  const energy = useMemo(
    () => energyDelivery({ humor, sleepHours, completions: times, today: localTodayIso() }),
    [humor, sleepHours, times],
  )

  const periodMax = Math.max(1, ...PERIODS.map((p) => hours.byPeriod[p]))
  const hourScores = hours.doneByHour.map((n, h) => n + hours.focusByHour[h] / 50)
  const shownHours = Array.from({ length: 18 }, (_, i) => i + 6)
  const hourMax = Math.max(1, ...shownHours.map((h) => hourScores[h]))
  const doneMax = Math.max(1, ...energy.days.map((d) => d.done))

  return (
    <View style={{ gap: space.md }}>
      <ReportCard
        title="Seu melhor horário"
        hint="Quando você conclui tarefas e faz sessões de foco, nos últimos 28 dias."
      >
        {hours.bestPeriod ? (
          <Text variant="body">
            Você rende mais {hours.bestPeriod === 'manha' ? 'de manhã' : hours.bestPeriod === 'tarde' ? 'à tarde' : hours.bestPeriod === 'noite' ? 'à noite' : 'de madrugada'}
            {hours.peakHour != null ? `, por volta das ${hours.peakHour}h` : ''}. Guarde esse horário para o que pede mais cabeça.
          </Text>
        ) : (
          <Text variant="caption" muted>
            Conclua algumas tarefas ou use o timer de foco por uns dias para o horário aparecer.
          </Text>
        )}
        <View style={{ gap: space.sm }}>
          {PERIODS.map((p) =>
          {
            const best = hours.bestPeriod === p
            return (
              <View key={p} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <View style={{ width: 96 }}>
                  <Text variant="label" color={best ? colors.ink : colors.inkMuted}>{DAY_PERIOD_LABEL[p]}</Text>
                  <Text variant="micro" muted>{PERIOD_HINT[p]}</Text>
                </View>
                <View style={{ flex: 1, height: 10, borderRadius: radius.pill, backgroundColor: colors.hairline, overflow: 'hidden' }}>
                  <View
                    style={{
                      width: `${(hours.byPeriod[p] / periodMax) * 100}%`,
                      height: '100%',
                      borderRadius: radius.pill,
                      backgroundColor: best ? accents.data : accents.dataMuted,
                    }}
                  />
                </View>
              </View>
            )
          })}
        </View>
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 48 }}>
            {shownHours.map((h) => (
              <View
                key={h}
                style={{
                  flex: 1,
                  height: 4 + (hourScores[h] / hourMax) * 44,
                  borderRadius: 3,
                  backgroundColor: h === hours.peakHour ? accents.data : accents.dataMuted,
                }}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {['6h', '12h', '18h', '23h'].map((l) => (
              <Text key={l} variant="micro" muted>{l}</Text>
            ))}
          </View>
        </View>
      </ReportCard>

      <ReportCard
        title="Energia e entrega"
        hint="Sono, humor e tarefas concluídas nos últimos 14 dias. Não é diagnóstico, são padrões dos seus registros."
      >
        {energy.insights.map((t) => (
          <Text key={t} variant="body">{t}</Text>
        ))}
        <View style={{ gap: space.sm }}>
          <Row label="Sono" color={accents.data2}>
            {energy.days.map((d) => (
              <Bar key={d.iso} value={d.sleep ?? 0} max={10} color={accents.data2} title={d.sleep ? formatSleepHours(d.sleep) : 'sem registro'} />
            ))}
          </Row>
          <Row label="Humor" color={accents.data4}>
            {energy.days.map((d) => (
              <Bar key={d.iso} value={d.mood ?? 0} max={5} color={accents.data4} title={d.mood ? String(d.mood) : 'sem registro'} />
            ))}
          </Row>
          <Row label="Entregas" color={accents.data}>
            {energy.days.map((d) => (
              <Bar key={d.iso} value={d.done} max={doneMax} color={accents.data} title={`${d.done} concluída(s)`} />
            ))}
          </Row>
          <View style={{ flexDirection: 'row', paddingLeft: 72, gap: 2 }}>
            {energy.days.map((d, i) => (
              <Text key={d.iso} variant="micro" muted style={{ flex: 1, textAlign: 'center' }}>
                {i % 2 === (energy.days.length - 1) % 2 ? new Date(`${d.iso}T12:00:00`).getDate() : ''}
              </Text>
            ))}
          </View>
        </View>
      </ReportCard>
    </View>
  )
}

function Row({ label, color, children }: { label: string; color: string; children: React.ReactNode })
{
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
      <View style={{ width: 64, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text variant="micro" muted>{label}</Text>
      </View>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 32 }}>{children}</View>
    </View>
  )
}

function Bar({ value, max, color, title }: { value: number; max: number; color: string; title: string })
{
  const { colors } = useTheme()
  const h = value > 0 ? 4 + (Math.min(value, max) / max) * 28 : 3
  return (
    <View
      accessible
      accessibilityLabel={title}
      style={{ flex: 1, height: h, borderRadius: 3, backgroundColor: value > 0 ? color : colors.hairline }}
    />
  )
}
