import { useMemo } from 'react'
import { Flame, Droplets, HeartPulse, ListChecks } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { buildHealthRitual, isAguaRitualComplete } from '../../lib/healthRitual'
import { countDoseProgress } from '../../lib/medicamentosSchedule'
import { totalMlHoje, metaMl, registrosMl } from '../../lib/waterHydration'
import { MoodWeekGrid } from '../wellbeing/MoodWeekGrid'
import { DashboardPerformanceCharts } from './DashboardPerformanceCharts'

export function DashboardAnalyticsPanel()
{
  const humorHojeLista = useTaskStore((s) => s.humorHojeLista)
  const humorSemanaAgregado = useTaskStore((s) => s.humorSemanaAgregado)
  const habitos = useTaskStore((s) => s.habitos)
  const medicamentos = useTaskStore((s) => s.medicamentos)
  const medicamentoTomadas = useTaskStore((s) => s.medicamentoTomadas)
  const streakCount = useTaskStore((s) => s.streakCount)
  const tarefas = useTaskStore((s) => s.tarefas)
  const userStats = useTaskStore((s) => s.userStats)

  const agua = habitos.find((h) => h.tipo === 'agua')
  const waterToday = totalMlHoje(agua)
  const waterGoalMl = metaMl(agua)
  const waterPct = waterGoalMl > 0 ? Math.min(100, Math.round((waterToday / waterGoalMl) * 100)) : 0
  const waterCups = registrosMl(agua).length
  const aguaMeta = agua?.meta_diaria ?? 8

  const ritual = useMemo(() =>
  {
    const dose = countDoseProgress(medicamentos, medicamentoTomadas)
    return buildHealthRitual({
      humorHojeCount: humorHojeLista.length,
      aguaCopos: waterCups,
      aguaMeta,
      medicamentosTotal: dose.total || medicamentos.length,
      medicamentosTomados: dose.tomados,
    })
  }, [humorHojeLista.length, waterCups, aguaMeta, medicamentos, medicamentoTomadas])

  const humorMedia7 = humorSemanaAgregado.length > 0
    ? (humorSemanaAgregado.reduce((a, d) => a + d.humor, 0) / humorSemanaAgregado.length).toFixed(1)
    : null

  const diasComHumor = humorSemanaAgregado.length

  const tarefasHoje = useMemo(() =>
  {
    const hoje = new Date().toISOString().slice(0, 10)
    const doDia = tarefas.filter((t) =>
    {
      const d = (t.data_vencimento || t.created_at || '').slice(0, 10)
      return d === hoje || t.status !== 'concluida'
    })
    const concluidas = doDia.filter((t) => t.status === 'concluida').length
    return { total: doDia.length, concluidas }
  }, [tarefas])

  const ritualItems = ritual.items.filter((i) => i.applies)

  return (
    <section className="sl-panel p-4 sm:p-5 space-y-4" aria-label="Painel de análise">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent">Hoje</p>
        <h2 className="font-sans font-semibold tracking-tight text-lg md:text-xl text-zinc-900 dark:text-zinc-100 mt-1">
          Resumo do dia
        </h2>
        <p className="text-[11px] mt-1 text-zinc-500 dark:text-zinc-400">
          O essencial — ritual, hábitos e progresso. Detalhes nas páginas de cada módulo.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-sl border border-line bg-chrome/40 p-3">
          <p className="font-mono text-[9px] uppercase text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <HeartPulse size={10} className="text-accent" />
            Ritual
          </p>
          <p className="font-sans font-semibold tracking-tight text-lg tabular-nums text-ink">{ritual.percent}%</p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{ritual.doneCount}/{ritual.totalApplicable}</p>
        </div>
        <div className="rounded-sl border border-line bg-chrome/40 p-3">
          <p className="font-mono text-[9px] uppercase text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <Flame size={10} className="text-atencao" />
            Ofensiva
          </p>
          <p className="font-sans font-semibold tracking-tight text-lg tabular-nums text-ink">{streakCount}</p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Nv {userStats?.level ?? 1}</p>
        </div>
        <div className="rounded-sl border border-line bg-chrome/40 p-3">
          <p className="font-mono text-[9px] uppercase text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <Droplets size={10} className="text-accent" />
            Água
          </p>
          <p className="font-sans font-semibold tracking-tight text-lg tabular-nums text-ink">{waterPct}%</p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{waterToday} ml</p>
        </div>
        <div className="rounded-sl border border-line bg-chrome/40 p-3">
          <p className="font-mono text-[9px] uppercase text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <ListChecks size={10} className="text-accent" />
            Tarefas
          </p>
          <p className="font-sans font-semibold tracking-tight text-lg tabular-nums text-ink">{tarefasHoje.concluidas}</p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">de {tarefasHoje.total} ativas</p>
        </div>
      </div>

      <article className="rounded-sl border border-line p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-medium text-ink">Ritual de saúde</p>
          <span className="font-mono text-[10px] text-ink-muted tabular-nums">{ritual.percent}%</span>
        </div>
        <div className="h-2 rounded-sl bg-chrome overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${ritual.percent}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {ritualItems.map((item) => (
            <span
              key={item.id}
              className={`px-2 py-1 rounded-sl font-mono text-[9px] uppercase border ${
                item.done
                  ? 'border-concluido/30 bg-concluido/10 text-concluido'
                  : 'border-line text-ink-muted'
              }`}
            >
              {item.label}
            </span>
          ))}
        </div>
      </article>

      <article className="rounded-sl border border-line p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-medium text-ink">Humor · 7 dias</p>
          {humorMedia7 && (
            <span className="font-mono text-[10px] text-ink-muted">
              média {humorMedia7} · {diasComHumor} dia{diasComHumor !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {humorSemanaAgregado.length === 0 ? (
          <p className="text-[11px] text-ink-muted">Registre humor no atalho acima para ver a semana.</p>
        ) : (
          <MoodWeekGrid dias={humorSemanaAgregado} />
        )}
      </article>

      <article className="rounded-sl border border-line p-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-[12px] font-medium text-ink">Hidratação</p>
          <span className="font-mono text-[10px] text-ink-muted tabular-nums">
            {waterToday} / {waterGoalMl} ml
          </span>
        </div>
        <div className="h-2 rounded-sl bg-chrome overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isAguaRitualComplete(waterCups, aguaMeta) ? 'bg-concluido' : 'bg-accent'
            }`}
            style={{ width: `${waterPct}%` }}
          />
        </div>
        <p className="text-[10px] text-ink-muted mt-2">
          {waterPct >= 100
            ? 'Meta do dia atingida.'
            : waterPct >= 80
              ? 'Ritual ok (80%) — siga no seu ritmo.'
              : `${Math.max(0, aguaMeta - waterCups)} copo(s) para a meta.`}
        </p>
      </article>

      <DashboardPerformanceCharts />
    </section>
  )
}
