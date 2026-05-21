import { useEffect } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Minus,
  Brain, CheckCircle2, Flame, DollarSign, Timer, Sparkles,
} from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';

/* kpi card com tamanhos flexíveis para o layout bento interno */
function KPI ({ icon: Icon, label, value, sub, color, span2 = false }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string; span2?: boolean;
})
{
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40 hover:border-indigo-500/20 transition-colors duration-200 ${span2 ? 'col-span-2' : ''}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[15px] font-bold text-white tabular-nums">{value}</p>
        <p className="text-[10px] text-zinc-500">{label}</p>
      </div>
      {sub && <span className="ml-auto text-[10px] text-zinc-600">{sub}</span>}
    </div>
  );
}


export function WeeklyReviewCard ()
{
  const weeklyReview = useTaskStore((s) => s.weeklyReview);
  const correlacao = useTaskStore((s) => s.correlacao);
  const fetchWeeklyReview = useTaskStore((s) => s.fetchWeeklyReview);
  const fetchCorrelacao = useTaskStore((s) => s.fetchCorrelacao);

  useEffect(() =>
  {
    fetchWeeklyReview();
    fetchCorrelacao();
  }, [fetchWeeklyReview, fetchCorrelacao]);

  if ( !weeklyReview ) return null;

  const {
    humor_medio, registros_humor, tarefas_concluidas, tarefas_criadas,
    habitos_pct, despesas_total, foco_minutos, insight_ia, semana,
  } = weeklyReview;

  /* boa, ruim ou assim assim — define a cor e o texto do badge */
  const HumorTrend = humor_medio >= 4 ? TrendingUp : humor_medio >= 3 ? Minus : TrendingDown;
  const humorColor = humor_medio >= 4 ? 'text-emerald-400' : humor_medio >= 3 ? 'text-amber-400' : 'text-red-400';
  const humorBg    = humor_medio >= 4 ? 'bg-emerald-500/10 border-emerald-500/20' : humor_medio >= 3 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';
  const humorLabel = humor_medio >= 4 ? 'Semana positiva' : humor_medio >= 3 ? 'Semana estável' : 'Semana desafiadora';

  return (
    <section className="h-full rounded-xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-md p-5 space-y-4
                        shadow-[0_-1px_0_rgba(99,102,241,0.15),0_0_30px_rgba(99,102,241,0.04)]
                        hover:border-indigo-500/20 transition-colors duration-300">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <h2 className="text-[13px] font-semibold bg-gradient-to-r from-indigo-300 to-indigo-500 bg-clip-text text-transparent">
            Review da Semana
          </h2>
        </div>
        <span className="text-[10px] text-zinc-600">{semana}</span>
      </div>

      {/* bento interno — kpis com spans variados criando hierarquia visual */}
      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-2">
          <KPI
            icon={Brain} label="Humor Médio"
            value={humor_medio > 0 ? `${humor_medio}/5` : '—'}
            sub={`${registros_humor} registros`}
            color="bg-indigo-500/10 text-indigo-400"
          />
        </div>
        <div className="col-span-2">
          <KPI
            icon={CheckCircle2} label="Tarefas"
            value={`${tarefas_concluidas}/${tarefas_criadas}`}
            sub={tarefas_criadas > 0 ? `${Math.round(tarefas_concluidas / tarefas_criadas * 100)}%` : ''}
            color="bg-emerald-500/10 text-emerald-400"
          />
        </div>
        <div className="col-span-1">
          <KPI icon={Flame} label="Hábitos" value={`${habitos_pct}%`} color="bg-amber-500/10 text-amber-400" />
        </div>
        <div className="col-span-1">
          <KPI icon={Timer} label="Foco" value={`${foco_minutos}min`} color="bg-blue-500/10 text-blue-400" />
        </div>
        <div className="col-span-2">
          <KPI
            icon={DollarSign} label="Gastos"
            value={despesas_total > 0 ? `R$${(despesas_total / 100).toFixed(0)}` : 'R$0'}
            color="bg-rose-500/10 text-rose-400"
          />
        </div>
      </div>

      {/* badge de tendência com animação na seta */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${humorBg}`}>
        <HumorTrend className={`w-4 h-4 ${humorColor} animate-bounce-subtle`} />
        <span className={`text-[12px] font-medium ${humorColor}`}>{humorLabel}</span>
      </div>

      {/* insight da ia — borda com animação gradient */}
      <div className="rounded-lg p-[1px] bg-gradient-to-r from-indigo-500/40 via-violet-500/40 to-indigo-500/40 bg-[length:200%_100%] animate-gradient-shift">
        <div className="rounded-[7px] bg-zinc-900/90 p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">Insight da IA</span>
          </div>
          <p className="text-[12px] text-zinc-300 leading-relaxed">{insight_ia}</p>
        </div>
      </div>

      {/* correlações encontradas */}
      {correlacao && correlacao.insights.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-zinc-800/30">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Correlações encontradas</span>
          {correlacao.insights.map((insight, i) => (
            <p key={i} className="text-[11px] text-zinc-400 leading-relaxed flex items-start gap-2">
              <span className="text-indigo-400 mt-0.5">•</span>
              {insight}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
