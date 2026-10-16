import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { View } from 'react-native'
import { Redirect } from 'expo-router'
import {
  addDaysIso,
  aguaMetaMl,
  aguaMlPorCopo,
  buildPeriodReport,
  findHabit,
  formatBRL,
  localTodayIso,
  periodReportToHtml,
  reportDatePt,
  reportPeriodLabel,
  type PeriodReport,
} from '@simply-life/shared'
import { Screen, Text, Card, PrimaryButton, Chip } from '../src/ui'
import { DateField } from '../src/ui/DateField'
import { StackHeader } from '../src/components/layout/StackHeader'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { useDataStore } from '../src/store/dataStore'
import { useFoodLogStore } from '../src/store/foodLogStore'
import { useWaterLogStore } from '../src/store/waterLogStore'
import { useBodyWeekStore } from '../src/store/bodyWeekStore'
import { useWorkoutStore } from '../src/store/workoutStore'
import { usePrefsStore } from '../src/store/prefsStore'
import { shareReportPdf } from '../src/lib/shareReport'

type Preset = '7d' | '30d' | 'mes' | 'mes_passado' | 'datas'

const PRESETS: { id: Preset; label: string }[] = [
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
  { id: 'mes', label: 'Este mês' },
  { id: 'mes_passado', label: 'Mês passado' },
  { id: 'datas', label: 'Escolher datas' },
]

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/

function presetRange(p: Preset, today = localTodayIso()): { from: string; to: string }
{
  const [y, m] = today.split('-').map(Number)
  if (p === '7d') return { from: addDaysIso(today, -6), to: today }
  if (p === '30d') return { from: addDaysIso(today, -29), to: today }
  if (p === 'mes') return { from: `${today.slice(0, 7)}-01`, to: today }
  const py = m === 1 ? y - 1 : y
  const pm = m === 1 ? 12 : m - 1
  const last = new Date(py, pm, 0).getDate()
  const ym = `${py}-${String(pm).padStart(2, '0')}`
  return { from: `${ym}-01`, to: `${ym}-${String(last).padStart(2, '0')}` }
}

/** Relatório de um período: tudo o que foi registrado nas datas escolhidas, na tela e em PDF. */
export default function RelatorioScreen()
{
  const { colors, space } = useTheme()
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const humor = useDataStore((s) => s.humor)
  const finance = useDataStore((s) => s.finance)
  const tasks = useDataStore((s) => s.tasks)
  const habits = useDataStore((s) => s.habits)
  const waterWeekDays = useDataStore((s) => s.waterWeekDays)
  const meals = useFoodLogStore((s) => s.meals)
  const hydrateFood = useFoodLogStore((s) => s.hydrate)
  const waterDays = useWaterLogStore((s) => s.days)
  const hydrateWater = useWaterLogStore((s) => s.hydrate)
  const sleepHours = useBodyWeekStore((s) => s.sleepHours)
  const hydrateBody = useBodyWeekStore((s) => s.hydrate)
  const sessions = useWorkoutStore((s) => s.sessions)
  const hydrateWorkout = useWorkoutStore((s) => s.hydrate)
  const nome = usePrefsStore((s) => s.prefs.axel_calls_you || s.prefs.display_name)

  const [preset, setPreset] = useState<Preset>('7d')
  const [from, setFrom] = useState(() => presetRange('7d').from)
  const [to, setTo] = useState(() => presetRange('7d').to)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() =>
  {
    void hydrateFood({ userId, isGuest })
    hydrateWater()
    hydrateBody()
    void hydrateWorkout(isGuest)
  }, [hydrateFood, hydrateWater, hydrateBody, hydrateWorkout, userId, isGuest])

  const rangeError = !ISO_RE.test(from) || !ISO_RE.test(to)
    ? 'Escolha o dia de início e o dia final.'
    : from > to ? 'A data inicial vem depois da final.' : null

  const report = useMemo<PeriodReport | null>(() =>
  {
    if (rangeError) return null
    const agua = findHabit(habits ?? [], 'agua')
    return buildPeriodReport({
      from,
      to,
      humor,
      finance,
      meals,
      // histórico local + semana do banco + o contador de hoje
      waterCups: { ...waterDays, ...waterWeekDays, ...(agua ? { [localTodayIso()]: agua.progressoAtual } : {}) },
      mlPorCopo: aguaMlPorCopo(agua),
      metaMl: aguaMetaMl(agua),
      sleepHours,
      workouts: sessions.filter((s) => s.finishedAt).map((s) => ({ data: s.startedAt.slice(0, 10), titulo: s.title })),
      tasksDone: tasks.filter((t) => t.concluidoEm).map((t) => ({ titulo: t.titulo, concluidoEm: t.concluidoEm! })),
    })
  }, [rangeError, from, to, humor, finance, meals, waterDays, waterWeekDays, habits, sleepHours, sessions, tasks])

  if (!userId) return <Redirect href="/login" />

  const pick = (p: Preset) =>
  {
    setPreset(p)
    setMsg(null)
    if (p !== 'datas')
    {
      const r = presetRange(p)
      setFrom(r.from)
      setTo(r.to)
    }
  }

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Relatório" subtitle="Tudo o que você registrou num período" />
      <View style={{ gap: space.lg, paddingBottom: space.xl }}>
        <View style={{ gap: space.sm }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {PRESETS.map((p) => (
              <Chip key={p.id} label={p.label} active={preset === p.id} onPress={() => pick(p.id)} />
            ))}
          </View>
          {preset === 'datas' ? (
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <View style={{ flex: 1 }}>
                <DateField label="De" value={from} onChange={setFrom} />
              </View>
              <View style={{ flex: 1 }}>
                <DateField label="Até" value={to} min={from || undefined} onChange={setTo} />
              </View>
            </View>
          ) : null}
          {rangeError ? <Text variant="caption" color={colors.danger}>{rangeError}</Text> : null}
        </View>

        {report ? (
          <>
            <View style={{ gap: 4 }}>
              <Text variant="section">{reportPeriodLabel(report)}</Text>
              <Text variant="caption" muted>{report.dias} dia{report.dias === 1 ? '' : 's'}</Text>
            </View>

            <ReportCard title="Humor">
              {report.humor.registros ? (
                <>
                  <Row label="Dias com registro" value={String(report.humor.registros)} />
                  <Row label="Média" value={`${String(report.humor.media).replace('.', ',')} de 5`} />
                  {report.humor.porHumor.map((h) => <Row key={h.humor} label={h.label} value={`${h.dias} dia${h.dias === 1 ? '' : 's'}`} />)}
                  {report.humor.notas.length ? (
                    <Text variant="caption" muted>{report.humor.notas.length} nota{report.humor.notas.length === 1 ? '' : 's'} no período (vão no PDF).</Text>
                  ) : null}
                </>
              ) : <Empty />}
            </ReportCard>

            <ReportCard title="Gastos">
              {report.financas.lancamentos ? (
                <>
                  <Row label="Gastos" value={formatBRL(report.financas.despesas)} strong />
                  <Row label="Receitas" value={formatBRL(report.financas.receitas)} />
                  <Row label="Saldo do período" value={formatBRL(report.financas.saldo)} />
                  {report.financas.porCategoria.slice(0, 5).map((c) => <Row key={c.categoria} label={c.categoria} value={formatBRL(c.total)} />)}
                  {report.financas.maiores[0] ? (
                    <Text variant="caption" muted>
                      Maior gasto: {report.financas.maiores[0].titulo}, {formatBRL(report.financas.maiores[0].valor)} em {reportDatePt(report.financas.maiores[0].data)}.
                    </Text>
                  ) : null}
                </>
              ) : <Empty />}
            </ReportCard>

            <ReportCard title="Alimentação">
              {report.alimentacao.refeicoes ? (
                <>
                  <Row label="Refeições anotadas" value={String(report.alimentacao.refeicoes)} />
                  <Row label="Dias com registro" value={String(report.alimentacao.diasComRegistro)} />
                  {report.alimentacao.kcalMediaDia != null ? <Row label="Calorias por dia" value={`${report.alimentacao.kcalMediaDia} kcal`} /> : null}
                  {report.alimentacao.proteinaMediaDia != null ? <Row label="Proteína por dia" value={`${report.alimentacao.proteinaMediaDia} g`} /> : null}
                </>
              ) : <Empty />}
            </ReportCard>

            <ReportCard title="Água, sono e treino">
              <Row label="Água: dias com registro" value={String(report.agua.diasComRegistro)} />
              {report.agua.mediaMlDia != null ? <Row label="Água por dia" value={`${report.agua.mediaMlDia} ml`} /> : null}
              <Row label="Dias na meta de água" value={String(report.agua.diasNaMeta)} />
              <Row label="Noites de sono anotadas" value={String(report.sono.noites)} />
              {report.sono.mediaHoras != null ? <Row label="Sono por noite" value={`${String(report.sono.mediaHoras).replace('.', ',')} h`} /> : null}
              <Row label="Treinos" value={String(report.treino.sessoes)} />
            </ReportCard>

            <ReportCard title="Tarefas concluídas">
              {report.tarefas.concluidas ? (
                <>
                  <Row label="Concluídas" value={String(report.tarefas.concluidas)} strong />
                  {report.tarefas.lista.slice(0, 5).map((t, i) => (
                    <Text key={`${t}-${i}`} variant="body" style={{ fontSize: 14 }} numberOfLines={1}>{t}</Text>
                  ))}
                  {report.tarefas.lista.length > 5 ? <Text variant="caption" muted>E mais {report.tarefas.lista.length - 5} no PDF.</Text> : null}
                </>
              ) : <Empty />}
            </ReportCard>

            <View style={{ gap: space.sm }}>
              <PrimaryButton
                label="Baixar PDF"
                icon="download-outline"
                onPress={() => void shareReportPdf(periodReportToHtml(report, { nome: nome || undefined })).then(setMsg)}
              />
              {msg ? <Text variant="caption" muted>{msg}</Text> : null}
              <Text variant="micro" muted>
                O relatório usa o que está salvo no app. Água, sono e treino de antes de você começar a anotar não aparecem.
              </Text>
            </View>
          </>
        ) : null}
      </View>
    </Screen>
  )
}

function ReportCard({ title, children }: { title: string; children: ReactNode })
{
  const { space } = useTheme()
  return (
    <Card tone="elevated" style={{ gap: space.sm }}>
      <Text variant="section">{title}</Text>
      {children}
    </Card>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean })
{
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 28 }}>
      <Text variant="body" style={{ flex: 1, fontSize: 14 }} numberOfLines={2}>{label}</Text>
      <Text variant={strong ? 'bodyStrong' : 'body'} style={{ fontSize: 14 }}>{value}</Text>
    </View>
  )
}

function Empty()
{
  return <Text variant="caption" muted>Nada registrado no período.</Text>
}
