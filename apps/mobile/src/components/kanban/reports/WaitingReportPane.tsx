import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  buildWaitReport,
  formatDuration,
  formatWaitAge,
  waitHeadline,
  type MobileTask,
} from '@simply-life/shared'
import { Chip, EmptyState, PaneTitle, PrimaryButton, Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useTaskWaitStore } from '../../../store/taskWaitStore'
import { ReportCard, ReportRow, ReportStat } from './ReportBits'

type Props = { tasks: MobileTask[] }

const WINDOWS = [7, 30, 90] as const

/** Por que demorou: quanto do tempo foi espera por outras pessoas, e por quem. */
export function WaitingReportPane({ tasks }: Props)
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const waits = useTaskWaitStore((s) => s.waits)
  const hydrate = useTaskWaitStore((s) => s.hydrate)
  const nudge = useTaskWaitStore((s) => s.nudge)
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(30)

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  const report = useMemo(() => buildWaitReport(tasks, waits, new Date(), days), [tasks, waits, days])

  const pct = report.fracaoEspera == null ? null : Math.round(report.fracaoEspera * 100)

  return (
    <View style={{ gap: space.md }}>
      <PaneTitle
        title="Esperas"
        subtitle="O que dependia de outra pessoa e quanto isso pesou no tempo das tarefas."
      />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        {WINDOWS.map((d) => (
          <Chip key={d} label={`${d} dias`} active={days === d} onPress={() => setDays(d)} />
        ))}
      </View>

      {report.tarefas.length === 0 ? (
        <EmptyState
          title="Nenhuma espera no período"
          body="Na tarefa, toque em Estou esperando alguém quando ela depender de outra pessoa."
          icon="people-outline"
        />
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            <ReportStat
              value={pct == null ? '0%' : `${pct}%`}
              label="do tempo foi espera"
              hint={`${report.tarefas.length} tarefa${report.tarefas.length === 1 ? '' : 's'}`}
            />
            <ReportStat
              value={formatDuration(report.esperaTotalMs)}
              label="parado esperando"
              hint={`${formatDuration(report.ativoTotalMs)} com você`}
            />
            <ReportStat
              value={String(report.abertas.length)}
              label="paradas agora"
              hint={`${report.cobrancasTotal} cobrança${report.cobrancasTotal === 1 ? '' : 's'}`}
            />
          </View>

          {report.abertas.length > 0 ? (
            <ReportCard title="Esperando agora" hint="Das mais antigas para as mais novas.">
              <View>
                {report.abertas.map(({ wait, task, days: d, nudge: late }, i) => (
                  <View
                    key={wait.id}
                    style={{
                      gap: 8,
                      paddingVertical: 10,
                      borderBottomWidth: i === report.abertas.length - 1 ? 0 : 1,
                      borderBottomColor: colors.hairline,
                    }}
                  >
                    <View style={{ gap: 2 }}>
                      <Text variant="body" numberOfLines={2}>
                        {task?.titulo ?? 'Tarefa'}
                      </Text>
                      <Text variant="caption" style={{ color: late ? colors.attention : colors.inkMuted }}>
                        {waitHeadline(wait)} · {formatWaitAge(d)}
                        {wait.cobrancas.length ? ` · ${wait.cobrancas.length}x cobrado` : ''}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: space.md }}>
                      <PrimaryButton label="Cobrei agora" variant="link" size="sm" onPress={() => nudge(wait.id)} />
                      {task ? (
                        <PrimaryButton
                          label="Abrir"
                          variant="link"
                          size="sm"
                          onPress={() => router.push(`/task/${task.id}?aba=espera`)}
                        />
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            </ReportCard>
          ) : null}

          <ReportCard title="Por pessoa" hint="Tempo total de espera e média por pedido.">
            <View>
              {report.pessoas.map((p, i) => (
                <ReportRow
                  key={p.pessoa}
                  icon="person-outline"
                  tint={colors.attention}
                  title={p.pessoa}
                  detail={`${p.esperas} pedido${p.esperas === 1 ? '' : 's'} · média ${formatDuration(p.mediaMs)}${p.cobrancas ? ` · ${p.cobrancas}x cobrado` : ''}${p.abertas ? ` · ${p.abertas} em aberto` : ''}`}
                  right={formatDuration(p.totalMs)}
                  last={i === report.pessoas.length - 1}
                />
              ))}
            </View>
          </ReportCard>

          <ReportCard title="Por que demorou" hint="Tempo total da tarefa e quanto foi espera.">
            <View style={{ gap: space.md }}>
              {report.tarefas.slice(0, 8).map((t) =>
              {
                const share = t.totalMs > 0 ? Math.min(1, t.esperaMs / t.totalMs) : 0
                return (
                  <View key={t.task.id} style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'baseline' }}>
                      <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
                        {t.task.titulo}
                      </Text>
                      <Text variant="caption" muted>
                        {t.task.status === 'done' ? 'feita' : 'aberta'}
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: colors.tasksMuted,
                        overflow: 'hidden',
                        flexDirection: 'row',
                      }}
                    >
                      <View style={{ width: `${Math.round(share * 100)}%`, backgroundColor: colors.attention }} />
                    </View>
                    <Text variant="caption" muted>
                      {formatDuration(t.ativoMs)} com você · {formatDuration(t.esperaMs)} esperando {t.pessoas.join(', ')} · {formatDuration(t.totalMs)} no total
                    </Text>
                  </View>
                )
              })}
              <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: colors.attention }} />
                  <Text variant="micro" muted>Espera</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: colors.tasksMuted }} />
                  <Text variant="micro" muted>Com você</Text>
                </View>
              </View>
            </View>
          </ReportCard>
        </>
      )}
    </View>
  )
}
