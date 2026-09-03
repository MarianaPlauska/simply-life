/**
 * Preview dev-only - donut, heatmap e altura de abas (sem auth).
 * Rota: /__dev/health-diary-charts
 */
import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Sun } from 'lucide-react'
import { useTaskStore } from '../store/useTaskStore'
import type { HumorRegistro } from '../store/slices/bemEstarSlice'
import { aggregateHumorByDay } from '../lib/moodInsights'
import { MoodDiarySection } from '../components/wellbeing/MoodDiarySection'
import {
  AXEL_HEALTH_TAB_BODY,
  AXEL_NAV_SUB_ACTIVE,
  AXEL_NAV_SUB_IDLE,
  AXEL_PAGE_SHELL_DIARY,
} from '../constants/axelSurfaces'

function buildPreviewHumor(): HumorRegistro[]
{
  const rows: HumorRegistro[] = []
  const today = new Date()
  const moods = [5, 4, 3, 2, 1, 4, 5, 3, 2, 4, 5, 3, 1, 2, 4, 5, 3, 4, 2, 5, 4, 3, 5, 2, 4]

  for (let i = 0; i < moods.length; i++)
  {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const data = d.toISOString().slice(0, 10)
    rows.push({
      id: i + 1,
      data,
      humor: moods[i],
      emoji: null,
      nota: i % 4 === 0 ? 'Registro de preview' : null,
      created_at: `${data}T12:00:00.000Z`,
    })
  }

  return rows
}

function HealthTabHeightDemo({ rows }: { rows: HumorRegistro[] })
{
  const [tab, setTab] = useState<'hoje' | 'diario'>('hoje')

  useEffect(() =>
  {
    useTaskStore.setState({
      humorMes: rows,
      humorMesAgregado: aggregateHumorByDay(rows),
      humorSemanaAgregado: aggregateHumorByDay(rows.slice(0, 7)),
      entradasRecentes: [],
    })
  }, [rows])

  return (
    <div className="sl-panel border border-line/80 overflow-hidden">
      <div className="px-4 pt-3 border-b border-line/60">
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-2">
          Comparação de altura - container com min-height
        </p>
        <nav aria-label="Abas demo" className="flex gap-0.5 overflow-x-auto scrollbar-none -mx-0.5">
          {([
            { id: 'hoje' as const, label: 'Hoje', Icon: Sun },
            { id: 'diario' as const, label: 'Diário', Icon: BookOpen },
          ]).map(({ id, label, Icon }) =>
          {
            const active = tab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`${active ? AXEL_NAV_SUB_ACTIVE : AXEL_NAV_SUB_IDLE} min-h-[40px] py-1.5`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-health' : ''}`} />
                {label}
              </button>
            )
          })}
        </nav>
      </div>

      <div
        data-testid="health-tab-body"
        className={`${AXEL_HEALTH_TAB_BODY} min-w-0 outline outline-1 outline-dashed outline-health/25 -outline-offset-1`}
      >
        {tab === 'hoje' ? (
          <div className="space-y-4">
            <div className="sl-panel p-4 border border-health/15">
              <p className="text-[13px] text-ink-muted">Conteúdo resumido da aba Hoje (cuidados)</p>
            </div>
          </div>
        ) : (
          <div className={AXEL_PAGE_SHELL_DIARY}>
            <MoodDiarySection defaultView="historico" />
          </div>
        )}
      </div>
    </div>
  )
}

export function HealthDiaryChartsPreview()
{
  const rows = useMemo(() => buildPreviewHumor(), [])

  useEffect(() =>
  {
    useTaskStore.setState({
      humorMes: rows,
      humorMesAgregado: aggregateHumorByDay(rows),
      humorSemanaAgregado: aggregateHumorByDay(rows.slice(0, 7)),
      entradasRecentes: [],
    })
  }, [rows])

  return (
    <div className="min-h-screen bg-canvas text-ink px-4 py-6 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="space-y-1">
          <h1 className="font-display text-xl">Saúde → Diário - preview dev</h1>
          <p className="text-[13px] text-ink-muted">
            Donut + heatmap mensal com dados de exemplo
          </p>
        </header>

        <section id="donut-heatmap" className={AXEL_PAGE_SHELL_DIARY}>
          <MoodDiarySection defaultView="historico" />
        </section>

        <section id="tab-height">
          <HealthTabHeightDemo rows={rows} />
        </section>
      </div>
    </div>
  )
}
