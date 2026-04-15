import { useEffect } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Minus,
  Brain, CheckCircle2, Flame, DollarSign, Timer, Sparkles,
} from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';

/* ── KPI card interno ────────────────────────────────────── */
function KPI({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string;
})
{
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
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


export function WeeklyReviewCard()
{
  const weeklyReview = useTaskStore((s) => s.weeklyReview);
  const correlacao = useTaskStore((s) => s.correlacao);
  const fetchWeeklyReview = useTaskStore((s) => s.fetchWeeklyReview);
  const fetchCorrelacao = useTaskStore((s) => s.fetchCorrelacao);

  useEffect(() =>
  {
    fetchWeeklyReview();
    fetchCorrelacao();
  }, []);

  if ( !weeklyReview ) return null;

  const {
    humor_medio, registros_humor, tarefas_concluidas, tarefas_criadas,
    habitos_pct, despesas_total, foco_minutos, insight_ia, semana,
  } = weeklyReview;

  // ícone de tendência para humor
  const HumorTrend = humor_medio >= 4 ? TrendingUp : humor_medio >= 3 ? Minus : TrendingDown;
  const humorColor = humor_medio >= 4 ? 'text-emerald-400' : humor_medio >= 3 ? 'text-amber-400' : 'text-red-400';

  return (
    <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5 space-y-4 shadow-[0_0_30px_rgba(139,92,246,0.03)]">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-4 h-4 text-violet-400" />
          <h2 className="text-[13px] font-semibold text-white">Review da Semana</h2>
        </div>
        <span className="text-[10px] text-zinc-600">{semana}</span>
      </div>

      {/* KPIs grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        <KPI
          icon={Brain} label="Humor Médio"
          value={humor_medio > 0 ? `${humor_medio}/5` : '—'}
          sub={`${registros_humor} registros`}
          color="bg-violet-500/10 text-violet-400"
        />
        <KPI
          icon={CheckCircle2} label="Tarefas Concluídas"
          value={`${tarefas_concluidas}/${tarefas_criadas}`}
          sub={tarefas_criadas > 0 ? `${Math.round(tarefas_concluidas / tarefas_criadas * 100)}%` : ''}
          color="bg-emerald-500/10 text-emerald-400"
        />
        <KPI
          icon={Flame} label="Hábitos"
          value={`${habitos_pct}%`}
          color="bg-amber-500/10 text-amber-400"
        />
        <KPI
          icon={Timer} label="Foco"
          value={`${foco_minutos}min`}
          color="bg-blue-500/10 text-blue-400"
        />
        <KPI
          icon={DollarSign} label="Gastos"
          value={despesas_total > 0 ? `R$${(despesas_total / 100).toFixed(0)}` : 'R$0'}
          color="bg-rose-500/10 text-rose-400"
        />
        <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
          <HumorTrend className={`w-5 h-5 ${humorColor}`} />
          <span className={`text-[12px] font-medium ${humorColor}`}>
            {humor_medio >= 4 ? 'Semana positiva' : humor_medio >= 3 ? 'Semana estável' : 'Semana desafiadora'}
          </span>
        </div>
      </div>

      {/* insight IA */}
      <div className="rounded-lg bg-violet-500/5 border border-violet-500/10 p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[11px] font-semibold text-violet-300 uppercase tracking-wider">Insight da IA</span>
        </div>
        <p className="text-[12px] text-zinc-300 leading-relaxed">{insight_ia}</p>
      </div>

      {/* correlações (se houver) */}
      {correlacao && correlacao.insights.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-zinc-800/30">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Correlações encontradas</span>
          {correlacao.insights.map((insight, i) => (
            <p key={i} className="text-[11px] text-zinc-400 leading-relaxed flex items-start gap-2">
              <span className="text-violet-400 mt-0.5">•</span>
              {insight}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
