import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import {
  AXEL_RAIL_BLOCK,
  AXEL_SECTION_TITLE,
  AXEL_LINE,
  AXEL_PROGRESS,
  AXEL_TEXT_PRIMARY,
} from '../../constants/axelSurfaces'
import { NutricaoProteinaBlock } from './NutricaoProteinaBlock'

// Métricas diárias — hidratação, foco e bloco visual de nutrição

const META_PROTEINA = 100

interface MetricRowProps
{
  label: string
  detail: string
  pct: number
  onClick: () => void
}

function MetricRow({ label, detail, pct, onClick }: MetricRowProps)
{
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left py-2.5 ${AXEL_LINE}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className={`text-[13px] font-medium tracking-tight ${AXEL_TEXT_PRIMARY}`}>{label}</span>
        <span className="text-[13px] text-zinc-500 tabular-nums shrink-0">{detail}</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-900 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${AXEL_PROGRESS}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </button>
  )
}

export function MetricasDiariasCard()
{
  const navigate = useNavigate()
  const habitos = useTaskStore((s) => s.habitos)
  const fetchHabitos = useTaskStore((s) => s.fetchHabitos)
  const focusState = useTaskStore((s) => s.focusState)

  useEffect(() =>
  {
    fetchHabitos()
  }, [fetchHabitos])

  const metricas = useMemo(() =>
  {
    const agua = habitos.find((h) => h.tipo === 'agua')
    const aguaCopos = agua?.progresso_atual ?? 0
    const aguaMeta = agua?.meta_diaria ?? 8
    const aguaPct = aguaMeta > 0 ? Math.round((aguaCopos / aguaMeta) * 100) : 0

    const proteina = habitos.find((h) => h.tipo === 'proteina')
    const proteinaAtual = proteina?.progresso_atual ?? 0
    const proteinaMeta = proteina?.meta_diaria ?? META_PROTEINA
    const proteinaPct = proteinaMeta > 0
      ? Math.min(100, Math.round((proteinaAtual / proteinaMeta) * 100))
      : 0

    const deepWork = focusState?.sessionsCompleted ?? 0
    const deepWorkMeta = 3
    const deepWorkPct = Math.round((deepWork / deepWorkMeta) * 100)

    return {
      aguaPct,
      aguaCopos,
      aguaMeta,
      proteinaPct,
      proteinaAtual,
      proteinaMeta,
      deepWork,
      deepWorkMeta,
      deepWorkPct,
    }
  }, [habitos, focusState])

  return (
    <section aria-labelledby="metricas-diarias" className={AXEL_RAIL_BLOCK}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 id="metricas-diarias" className={AXEL_SECTION_TITLE}>
          Saúde e nutrição
        </h2>
        <button
          type="button"
          onClick={() => navigate('/saude')}
          className="flex items-center gap-1 text-[13px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 py-1"
        >
          Saúde
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div role="list">
        <MetricRow
          label="Hidratação (Água)"
          detail={`${metricas.aguaCopos}/${metricas.aguaMeta} copos`}
          pct={metricas.aguaPct}
          onClick={() => navigate('/saude#hidratacao')}
        />
        <MetricRow
          label="Foco profundo (Deep Work)"
          detail={`${metricas.deepWork}/${metricas.deepWorkMeta} sessões`}
          pct={metricas.deepWorkPct}
          onClick={() => navigate('/superhuman')}
        />
      </div>

      <NutricaoProteinaBlock
        atual={metricas.proteinaAtual}
        meta={metricas.proteinaMeta}
        pct={metricas.proteinaPct}
        onNavigate={() => navigate('/saude#alimentacao')}
      />
    </section>
  )
}
