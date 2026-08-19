import { motion } from 'framer-motion';
import { Coffee, Flame, Sprout, TrendingUp, Trophy, Zap, Star, type LucideIcon } from 'lucide-react';
import { CircularProgress, fadeUp } from './DashboardPrimitives';
import type { DashboardResumo } from '../../store/useTaskStore';

/* ══════════════════════════════════════════════════════════════
   FocusScoreSection — Gamification Hub
   Computes a 0-100 "Focus Score" from the user's day:
     • 35% — Tarefas concluídas / total
     • 25% — Hábitos progresso
     • 20% — Medicamentos tomados / total
     • 20% — Zero tarefas críticas (bônus)
   Shows XP earned today + streak context.
   ══════════════════════════════════════════════════════════════ */

interface FocusScoreProps {
  resumo: DashboardResumo | null;
  scoreDiario: number;
}

function computeFocusScore(r: DashboardResumo | null): {
  score: number;
  tarefasPct: number;
  habitosPct: number;
  medsPct: number;
  criticalBonus: boolean;
} {
  if (!r) return { score: 0, tarefasPct: 0, habitosPct: 0, medsPct: 0, criticalBonus: false };

  const tarefasPct = r.tarefas_total > 0
    ? Math.round((r.tarefas_concluidas / r.tarefas_total) * 100) : 0;
  const habitosPct = Math.min(r.habitos_progresso_pct, 100);
  const medsPct = r.medicamentos_total > 0
    ? Math.round((r.medicamentos_tomados / r.medicamentos_total) * 100) : 100; // no meds = full credit
  const criticalBonus = r.tarefas_criticas === 0;

  const score = Math.round(
    tarefasPct * 0.35 +
    habitosPct * 0.25 +
    medsPct * 0.20 +
    (criticalBonus ? 20 : 0)
  );

  return { score: Math.min(score, 100), tarefasPct, habitosPct, medsPct, criticalBonus };
}

function getScoreLabel(score: number): { label: string; color: string; Icon: LucideIcon; iconColor: string }
{
  if (score >= 90) return { label: 'Excepcional', color: 'text-amber-400', Icon: Flame, iconColor: 'text-amber-400' };
  if (score >= 70) return { label: 'Otimo', color: 'text-emerald-400', Icon: Zap, iconColor: 'text-emerald-400' };
  if (score >= 50) return { label: 'Bom Ritmo', color: 'text-cyan-400', Icon: TrendingUp, iconColor: 'text-cyan-400' };
  if (score >= 25) return { label: 'Aquecendo', color: 'text-zinc-400', Icon: Sprout, iconColor: 'text-zinc-400' };
  return { label: 'Comecando', color: 'text-zinc-500', Icon: Coffee, iconColor: 'text-zinc-500' };
}

function getScoreStrokeColor(score: number): string {
  if (score >= 90) return 'stroke-amber-500';
  if (score >= 70) return 'stroke-emerald-500';
  if (score >= 50) return 'stroke-cyan-500';
  if (score >= 25) return 'stroke-violet-500';
  return 'stroke-zinc-600';
}

function getScoreBarGradient(score: number): string {
  if (score >= 90) return 'from-amber-500 to-orange-500';
  if (score >= 70) return 'from-emerald-500 to-teal-400';
  if (score >= 50) return 'from-cyan-500 to-blue-500';
  if (score >= 25) return 'from-violet-500 to-indigo-500';
  return 'from-zinc-600 to-zinc-500';
}

export function FocusScoreSection({ resumo, scoreDiario }: FocusScoreProps) {
  const { score, tarefasPct, habitosPct, medsPct, criticalBonus } = computeFocusScore(resumo);
  const { label, color, Icon, iconColor } = getScoreLabel(score);
  const strokeColor = getScoreStrokeColor(score);
  const barGradient = getScoreBarGradient(score);

  const breakdown = [
    { name: 'Tarefas', pct: tarefasPct, weight: '35%', icon: Zap },
    { name: 'Habitos', pct: habitosPct, weight: '25%', icon: Flame },
    { name: 'Medicamentos', pct: medsPct, weight: '20%', icon: Star },
  ];

  return (
    <motion.div {...fadeUp}>
      <div className="relative overflow-hidden bg-zinc-950/50 backdrop-blur-2xl border border-white/5 rounded-[2rem] shadow-2xl transition-all duration-300 hover:border-amber-500/20">
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.04),transparent_60%)] pointer-events-none" />

        <div className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* ── Big Score Ring ──────────────────────────────── */}
            <div className="relative shrink-0">
              <CircularProgress
                pct={score}
                size={160}
                strokeWidth={10}
                color={strokeColor}
              />
              {/* Inner content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[12px] text-zinc-500 font-medium uppercase tracking-wider mb-0.5">Focus</span>
                <span className="text-4xl font-black text-white tracking-tighter tabular-nums">{score}</span>
                <span className={`text-[12px] font-semibold ${color} mt-0.5 inline-flex items-center gap-1`}>
                  <Icon size={14} strokeWidth={1.5} className={iconColor} aria-hidden />
                  {label}
                </span>
              </div>
            </div>

            {/* ── Right side: breakdown + XP ──────────────────── */}
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-[14px] font-semibold text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Score de Foco
                  </h3>
                  <p className="text-[12px] text-zinc-600 mt-0.5">Performance consolidada do dia</p>
                </div>
                {scoreDiario > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/10">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span className="text-[12px] font-bold text-amber-400 tabular-nums">+{scoreDiario} XP</span>
                  </div>
                )}
              </div>

              {/* Breakdown bars */}
              <div className="space-y-3">
                {breakdown.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-[12px] font-medium text-zinc-400">{item.name}</span>
                          <span className="text-[10px] text-zinc-600">({item.weight})</span>
                        </div>
                        <span className="text-[12px] font-semibold text-zinc-300 tabular-nums">{item.pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-900/80 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${barGradient}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Critical bonus row */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${criticalBonus ? 'bg-emerald-500/20' : 'bg-zinc-800'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${criticalBonus ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                    </div>
                    <span className="text-[12px] font-medium text-zinc-400">Zero Criticas</span>
                    <span className="text-[10px] text-zinc-600">(20%)</span>
                  </div>
                  <span className={`text-[12px] font-semibold tabular-nums ${criticalBonus ? 'text-emerald-400' : 'text-zinc-600'}`}>
                    {criticalBonus ? '+20' : '0'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
