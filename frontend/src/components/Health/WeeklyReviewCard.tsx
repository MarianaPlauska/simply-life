import { useEffect } from 'react'
import {
  BarChart3, TrendingUp, TrendingDown, Minus,
  Brain, CheckCircle2, Flame, DollarSign, Timer, Sparkles,
} from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

function KPI({ icon: Icon, label, value, sub, color, span2 = false }: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  color: string
  span2?: boolean
})
{
  return (
    <div className={`flex items-center gap-3 p-3 rounded-sl bg-chrome/40 border border-line hover:border-accent/20 transition-colors ${span2 ? 'col-span-2' : ''}`}>
      <div className={`w-8 h-8 rounded-sl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className={`text-[15px] font-bold tabular-nums ${AXEL_TEXT_PRIMARY}`}>{value}</p>
        <p className={`text-[10px] ${AXEL_TEXT_SECONDARY}`}>{label}</p>
      </div>
      {sub && <span className={`ml-auto text-[10px] ${AXEL_TEXT_SECONDARY}`}>{sub}</span>}
    </div>
  )
}

export function WeeklyReviewCard()
{
  const weeklyReview = useTaskStore((s) => s.weeklyReview)
  const correlacao = useTaskStore((s) => s.correlacao)
  const fetchWeeklyReview = useTaskStore((s) => s.fetchWeeklyReview)
  const fetchCorrelacao = useTaskStore((s) => s.fetchCorrelacao)

  useEffect(() =>
  {
    fetchWeeklyReview()
    fetchCorrelacao()
  }, [fetchWeeklyReview, fetchCorrelacao])

  if (!weeklyReview)
  {
    return null
  }

  const {
    humor_medio, registros_humor, tarefas_concluidas, tarefas_criadas,
    habitos_pct, despesas_total, foco_minutos, insight_ia, semana,
  } = weeklyReview

  const HumorTrend = humor_medio >= 4 ? TrendingUp : humor_medio >= 3 ? Minus : TrendingDown
  const humorColor = humor_medio >= 4 ? 'text-emerald-400' : humor_medio >= 3 ? 'text-amber-400' : 'text-red-400'
  const humorBg = humor_medio >= 4 ? 'bg-emerald-500/10 border-emerald-500/20' : humor_medio >= 3 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'
  const humorLabel = humor_medio >= 4 ? 'Semana positiva' : humor_medio >= 3 ? 'Semana estável' : 'Semana desafiadora'

  return (
    <section className="h-full rounded-sl border border-line bg-card p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-4 h-4 text-accent" />
          <h2 className="text-[13px] font-semibold text-ink">
            Review da Semana
          </h2>
        </div>
        <span className={`text-[10px] font-mono ${AXEL_TEXT_SECONDARY}`}>{semana}</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-2">
          <KPI
            icon={Brain}
            label="Humor Médio"
            value={humor_medio > 0 ? `${humor_medio}/5` : '—'}
            sub={`${registros_humor} registros`}
            color="bg-accent-muted text-accent"
          />
        </div>
        <div className="col-span-2">
          <KPI
            icon={CheckCircle2}
            label="Tarefas"
            value={`${tarefas_concluidas}/${tarefas_criadas}`}
            sub={tarefas_criadas > 0 ? `${Math.round(tarefas_concluidas / tarefas_criadas * 100)}%` : ''}
            color="bg-emerald-500/10 text-emerald-400"
          />
        </div>
        <div className="col-span-1">
          <KPI icon={Flame} label="Hábitos" value={`${habitos_pct}%`} color="bg-amber-500/10 text-amber-400" />
        </div>
        <div className="col-span-1">
          <KPI icon={Timer} label="Foco" value={`${foco_minutos}min`} color="bg-sky-500/10 text-sky-400" />
        </div>
        <div className="col-span-2">
          <KPI
            icon={DollarSign}
            label="Gastos"
            value={despesas_total > 0 ? `R$${(despesas_total / 100).toFixed(0)}` : 'R$0'}
            color="bg-rose-500/10 text-rose-400"
          />
        </div>
      </div>

      <div className={`flex items-center gap-2 px-3 py-2 rounded-sl border ${humorBg}`}>
        <HumorTrend className={`w-4 h-4 ${humorColor}`} />
        <span className={`text-[12px] font-medium ${humorColor}`}>{humorLabel}</span>
      </div>

      <div className="rounded-sl border border-accent/25 bg-accent-muted/30 p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">Insight da IA</span>
        </div>
        <p className={`text-[12px] leading-relaxed ${AXEL_TEXT_PRIMARY}`}>{insight_ia}</p>
      </div>

      {correlacao && correlacao.insights.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-line">
          <span className={`text-[10px] font-mono uppercase tracking-wider ${AXEL_TEXT_SECONDARY}`}>
            Correlações encontradas
          </span>
          {correlacao.insights.map((insight, i) => (
            <p key={i} className={`text-[11px] leading-relaxed flex items-start gap-2 ${AXEL_TEXT_SECONDARY}`}>
              <span className="text-accent mt-0.5">•</span>
              {insight}
            </p>
          ))}
        </div>
      )}
    </section>
  )
}
