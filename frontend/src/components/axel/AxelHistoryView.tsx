import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  AXEL_KIND_LABEL,
  countByKind,
  fetchAxelDecisions,
  periodCopy,
  stackByDay,
  startIsoForPeriod,
  type AxelDecisionKind,
} from '../../lib/axelDecisionLog'
import { AXEL_PAGE_SHELL, AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

type Period = 'hoje' | 'semana' | 'mes'

const PERIOD_LABEL: Record<Period, string> = {
  hoje: 'Hoje',
  semana: 'Essa semana',
  mes: 'Este mês',
}

const STACK_COLORS: Record<AxelDecisionKind, string> = {
  promoted_hoje: '#D98F7A',
  deferred_load: '#C9A96E',
  decay_backlog: '#7A8499',
  manual_override: '#7DB89A',
  email_ingest: '#8B9DC3',
}

export function AxelHistoryView()
{
  const [period, setPeriod] = useState<Period>('semana')
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<Awaited<ReturnType<typeof fetchAxelDecisions>>>([])

  useEffect(() =>
  {
    let cancelled = false
    setLoading(true)
    void fetchAxelDecisions(startIsoForPeriod(period)).then((rows) =>
    {
      if (!cancelled)
      {
        setEvents(rows)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [period])

  const counts = useMemo(() => countByKind(events), [events])
  const chart = useMemo(() => stackByDay(events), [events])
  const copy = useMemo(() => periodCopy(counts, PERIOD_LABEL[period]), [counts, period])

  return (
    <div className={`${AXEL_PAGE_SHELL} max-w-4xl mx-auto px-4 py-6 sm:py-8`}>
      <header className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">AXEL · log explicável</p>
        <h1 className={`text-2xl font-semibold mt-1 ${AXEL_TEXT_PRIMARY}`}>Histórico de decisões</h1>
        <p className={`text-[14px] mt-2 max-w-xl ${AXEL_TEXT_SECONDARY}`}>{copy}</p>
      </header>

      <div className="flex gap-1.5 mb-6" role="tablist" aria-label="Período">
        {(['hoje', 'semana', 'mes'] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={period === p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-2 min-h-[44px] rounded-sl font-mono text-[11px] uppercase tracking-wide border ${
              period === p
                ? 'border-accent/50 bg-accent/15 text-accent'
                : 'border-line text-ink-muted hover:text-ink'
            }`}
          >
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {(Object.keys(AXEL_KIND_LABEL) as AxelDecisionKind[]).map((kind) => (
          <div key={kind} className="rounded-sl border border-line bg-card px-3 py-3">
            <dt className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>{AXEL_KIND_LABEL[kind]}</dt>
            <dd className={`text-xl font-semibold mt-1 ${AXEL_TEXT_PRIMARY}`}>{counts[kind]}</dd>
          </div>
        ))}
      </dl>

      <div className="rounded-sl border border-line bg-card p-3 sm:p-4 h-64">
        {loading ? (
          <p className={`text-[13px] ${AXEL_TEXT_SECONDARY}`}>Carregando…</p>
        ) : chart.length === 0 ? (
          <p className={`text-[13px] ${AXEL_TEXT_SECONDARY}`}>
            Sem eventos neste período. Use o Kanban (reorganizar ou arrastar) para gerar o log.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--sl-text-muted)' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--sl-text-muted)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--sl-surface)', border: '1px solid var(--sl-border)', fontSize: 12 }}
              />
              {(Object.keys(STACK_COLORS) as AxelDecisionKind[]).map((kind) => (
                <Bar key={kind} dataKey={kind} name={AXEL_KIND_LABEL[kind]} stackId="a" fill={STACK_COLORS[kind]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
