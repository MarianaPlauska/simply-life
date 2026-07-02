// frontend/src/components/Relatorios/RelatoriosView.tsx
// Relatórios de Produtividade — estilo Last.fm weekly/monthly reports
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Zap, Flame, Clock, Target,
  BarChart3, Calendar, ArrowUpRight, ArrowDownRight,
  Star, CheckCircle2, Brain,
} from 'lucide-react';
import { AXEL_PAGE_SHELL } from '../../constants/axelSurfaces';
import type { AnalyticsReport, TrendPoint, RankingItem } from '../../store/useTaskStore';
import { PrintButton } from '../ui/PrintButton';

const fadeUp = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-40px' }, transition: { duration: 0.5 } };



/* ── Bar Chart (SVG) ─────────────────────────────────────── */
function BarChart({ data, color = '#10b981', height = 120 }: {
  data: TrendPoint[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data.map(d => d.valor), 1);

  return (
    <div className="flex items-end gap-1 justify-between" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.valor / max) * (height - 20);
        const isLast = i === data.length - 1;
        return (
          <div key={d.label} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[9px] text-zinc-500 font-medium">{Math.round(d.valor)}</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: Math.max(h, 2) }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="rounded-t-md w-full max-w-[32px]"
              style={{
                backgroundColor: isLast ? color : `${color}66`,
                minWidth: 8,
              }}
            />
            <span className="text-[9px] text-zinc-600">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Donut Chart (SVG) ───────────────────────────────────── */
function DonutChart({ items, size = 120 }: { items: RankingItem[]; size?: number })
{
  const total = items.reduce((s, i) => s + i.valor, 0) || 1;
  const r = size / 2 - 8;
  const circumference = 2 * Math.PI * r;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {items.map((item, idx) =>
      {
        const pct = item.valor / total;
        const dashLen = pct * circumference;
        const prevSum = items.slice(0, idx).reduce((s, i) => s + i.valor, 0);
        const currentOffset = (prevSum / total) * circumference;
        return (
          <circle
            key={item.nome}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={item.cor}
            strokeWidth="16"
            strokeDasharray={`${dashLen} ${circumference - dashLen}`}
            strokeDashoffset={-currentOffset}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

/* ── Variação Badge ──────────────────────────────────────── */
function VariacaoBadge({ valor }: { valor: number }) {
  if (valor > 0) return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-400">
      <ArrowUpRight className="w-3 h-3" />{valor}%
    </span>
  );
  if (valor < 0) return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-rose-400">
      <ArrowDownRight className="w-3 h-3" />{Math.abs(valor)}%
    </span>
  );
  return <span className="text-[11px] text-zinc-500">—</span>;
}

/* ── Score Ring ───────────────────────────────────────────── */
function ScoreRing({ score, label, size = 120 }: { score: number; label: string; size?: number }) {
  const r = (size - 12) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDash = (score / 100) * circumference;

  const color = score >= 80 ? '#f59e0b' : score >= 60 ? '#10b981' : score >= 40 ? '#3b82f6' : '#8b5cf6';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(39 39 42 / 0.4)" strokeWidth="8" />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${strokeDash} ${circumference - strokeDash}` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black tracking-tighter text-zinc-100">{score}</span>
        </div>
      </div>
      <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-medium">{label}</span>
    </div>
  );
}

/* ── Ranking Bar ─────────────────────────────────────────── */
function RankingBar({ items, maxVal, unit = '' }: { items: RankingItem[]; maxVal?: number; unit?: string }) {
  const mx = maxVal || Math.max(...items.map(i => i.valor), 1);
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.nome} className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white/80"
            style={{ backgroundColor: item.cor + '33' }}>
            #{item.posicao}
          </span>
          <span className="text-sm text-zinc-300 w-12 font-medium">{item.nome}</span>
          <div className="flex-1 h-2 bg-zinc-800/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: item.cor }}
              initial={{ width: 0 }}
              animate={{ width: `${(item.valor / mx) * 100}%` }}
              transition={{ duration: 0.6, delay: item.posicao * 0.1 }}
            />
          </div>
          <span className="text-[11px] text-zinc-500 w-10 text-right">{Math.round(item.valor)}{unit}</span>
        </div>
      ))}
    </div>
  );
}

/* ══ MAIN VIEW ═══════════════════════════════════════════════ */
export function RelatoriosView() {
  const periodo = useTaskStore((s) => s.relatoriosPeriodo);
  const setPeriodo = useTaskStore((s) => s.setRelatoriosPeriodo);
  const semanal = useTaskStore((s) => s.relatorioSemanal);
  const mensal = useTaskStore((s) => s.relatorioMensal);
  const loading = useTaskStore((s) => s.relatoriosLoading);
  const fetchSemanal = useTaskStore((s) => s.fetchRelatorioSemanal);
  const fetchMensal = useTaskStore((s) => s.fetchRelatorioMensal);
  const hasFetched = useRef(false);

  useEffect(() =>
  {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchSemanal();
    fetchMensal();
  }, [fetchSemanal, fetchMensal]);

  const report: AnalyticsReport | null = periodo === 'semanal' ? semanal : mensal;
  const p = report?.periodo_atual;
  const ant = report?.periodo_anterior;
  const v = report?.variacao_pct ?? {};

  /* ── Loading ───── */
  if (loading && !report) {
    return (
      <div className={`${AXEL_PAGE_SHELL} p-6 space-y-8`}>
        <div className="h-10 w-72 bg-zinc-800/40 rounded-xl animate-pulse" />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-zinc-800/30 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className={`${AXEL_PAGE_SHELL} p-6 space-y-12 pb-24 text-zinc-50`}>
      {/* ── Header ──────────────────────────────────────── */}
      <motion.div {...fadeUp} className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
            Relatório de Performance
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            {p ? `${p.inicio} — ${p.fim}` : 'Carregando...'}
          </p>
        </div>

        {/* Toggle Semanal / Mensal */}
        <div className="flex gap-1 bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-xl p-1">
          {(['semanal', 'mensal'] as const).map(per => (
            <button
              key={per}
              onClick={() => setPeriodo(per)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                periodo === per
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {per === 'semanal' ? 'Semanal' : 'Mensal'}
            </button>
          ))}
        </div>

        <PrintButton />
      </motion.div>

      {/* ── KPI Cards (3) ───────────────────────────────── */}
      <motion.div {...fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tarefas */}
        <div className="bg-zinc-900/30 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider">Tarefas Concluídas</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black tracking-tighter">{p?.tarefas_concluidas ?? 0}</span>
            <VariacaoBadge valor={v.tarefas_concluidas ?? 0} />
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            vs {ant?.periodo_label ?? 'anterior'}
          </p>
        </div>

        {/* Foco */}
        <div className="bg-zinc-900/30 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider">Minutos de Foco</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black tracking-tighter">{p?.minutos_foco_total ?? 0}</span>
            <VariacaoBadge valor={v.minutos_foco ?? 0} />
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {p?.sessoes_foco ?? 0} sessões · {p?.media_minutos_por_sessao ?? 0} min/sessão
          </p>
        </div>

        {/* XP */}
        <div className="bg-zinc-900/30 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider">XP Ganho</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black tracking-tighter">{p?.xp_ganho ?? 0}</span>
            <VariacaoBadge valor={v.xp_ganho ?? 0} />
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Total all-time: {report?.total_xp?.toLocaleString() ?? 0} XP
          </p>
        </div>
      </motion.div>

      {/* ── Score de Eficiência + Tendência ──────────────── */}
      <motion.div {...fadeUp} className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Score Ring */}
        <div className="md:col-span-2 bg-zinc-900/30 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-2xl flex flex-col items-center justify-center gap-4">
          <ScoreRing score={p?.score_eficiencia ?? 0} label="Score de Eficiência" size={160} />
          <div className="flex items-center gap-2 text-xs">
            <VariacaoBadge valor={v.score_eficiencia ?? 0} />
            <span className="text-zinc-500">vs {ant?.periodo_label ?? 'anterior'}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full mt-2">
            <div className="text-center">
              <p className="text-lg font-bold text-zinc-200">{p?.taxa_conclusao_pct ?? 0}%</p>
              <p className="text-[10px] text-zinc-500">Taxa Conclusão</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-zinc-200">{p?.habitos_taxa_pct ?? 0}%</p>
              <p className="text-[10px] text-zinc-500">Hábitos</p>
            </div>
          </div>
        </div>

        {/* Tendência de Score — últimas 8 semanas */}
        <div className="md:col-span-3 bg-zinc-900/30 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider">Tendência — Últimas 8 Semanas</span>
          </div>
          {report?.tendencia_score && (
            <BarChart data={report.tendencia_score} color="#8b5cf6" height={140} />
          )}
        </div>
      </motion.div>

      {/* ── Gráficos de Tarefas e Foco ──────────────────── */}
      <motion.div {...fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarefas trend */}
        <div className="bg-zinc-900/30 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider">Tarefas Concluídas</span>
          </div>
          {report?.tendencia_tarefas && (
            <BarChart data={report.tendencia_tarefas} color="#10b981" height={100} />
          )}
        </div>

        {/* Foco trend */}
        <div className="bg-zinc-900/30 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider">Minutos de Foco</span>
          </div>
          {report?.tendencia_foco && (
            <BarChart data={report.tendencia_foco} color="#06b6d4" height={100} />
          )}
        </div>
      </motion.div>

      {/* ── Rankings ─────────────────────────────────────── */}
      <motion.div {...fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dias mais produtivos */}
        <div className="bg-zinc-900/30 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider">Top Dias Produtivos</span>
          </div>
          {report?.ranking_dias_semana && report.ranking_dias_semana.length > 0 ? (
            <RankingBar items={report.ranking_dias_semana} unit=" tarefas" />
          ) : (
            <p className="text-zinc-600 text-sm">Sem dados suficientes</p>
          )}
        </div>

        {/* Mix de Origens (como Traffic Mix do Last.fm) */}
        <div className="bg-zinc-900/30 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-violet-400" />
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider">Mix de Origens</span>
          </div>
          {report?.top_categorias_tarefa && report.top_categorias_tarefa.length > 0 ? (
            <div className="flex items-center gap-6">
              <DonutChart items={report.top_categorias_tarefa} size={100} />
              <div className="space-y-1.5 flex-1">
                {report.top_categorias_tarefa.map(item => (
                  <div key={item.nome} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.cor }} />
                    <span className="text-zinc-300">{item.nome}</span>
                    <span className="text-zinc-500 ml-auto">
                      {Math.round(item.valor / (report.top_categorias_tarefa.reduce((s, i) => s + i.valor, 0) || 1) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-zinc-600 text-sm">Sem dados suficientes</p>
          )}
        </div>
      </motion.div>

      {/* ── Distribuição da semana (heat map style) ──────── */}
      {p?.tarefas_por_dia && (
        <motion.div {...fadeUp} className="bg-zinc-900/30 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider">Atividade por Dia da Semana</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map(dia => {
              const tarefas = p.tarefas_por_dia[dia] ?? 0;
              const foco = p.foco_por_dia[dia] ?? 0;
              const maxT = Math.max(...Object.values(p.tarefas_por_dia), 1);
              const intensity = tarefas / maxT;
              return (
                <div key={dia} className="flex flex-col items-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-medium">{dia}</span>
                  <div
                    className="w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 border border-white/5 transition-colors"
                    style={{
                      backgroundColor: intensity > 0
                        ? `rgba(16, 185, 129, ${0.1 + intensity * 0.5})`
                        : 'rgba(39, 39, 42, 0.3)',
                    }}
                  >
                    <span className="text-lg font-bold text-zinc-200">{tarefas}</span>
                    <span className="text-[9px] text-zinc-500">{foco}min</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── All-time Stats Footer ───────────────────────── */}
      <motion.div {...fadeUp} className="bg-zinc-900/30 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-[11px] text-zinc-400 uppercase tracking-wider">Estatísticas All-Time</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-2xl font-black tracking-tighter text-zinc-100">{report?.total_tarefas_concluidas ?? 0}</p>
            <p className="text-[10px] text-zinc-500 mt-1">Tarefas Concluídas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black tracking-tighter text-zinc-100">{report?.total_minutos_foco ?? 0}</p>
            <p className="text-[10px] text-zinc-500 mt-1">Minutos de Foco</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black tracking-tighter text-zinc-100">{(report?.total_xp ?? 0).toLocaleString()}</p>
            <p className="text-[10px] text-zinc-500 mt-1">XP Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black tracking-tighter text-zinc-100">{p?.streak_atual ?? 0}</p>
            <p className="text-[10px] text-zinc-500 mt-1">Streak Atual</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
