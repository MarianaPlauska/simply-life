import { motion } from 'framer-motion';
import {
  Pill, Activity, Sparkles, TrendingDown,
  Droplets, Dumbbell, Brain, BookOpen,
} from 'lucide-react';
import {
  GlassCard, ProgressBar, CircularProgress, StatusRow,
  staggerContainer,
} from './DashboardPrimitives';
import { fadeUp } from './DashboardPrimitives';
import type { DashboardResumo } from '../../store/useTaskStore';

const HABIT_ICONS: Record<string, React.ElementType> = {
  agua: Droplets, exercicio: Dumbbell, meditacao: Brain, leitura: BookOpen,
};

export function HealthSection({ resumo }: { resumo: DashboardResumo | null }) {
  const medsTotal = resumo?.medicamentos_total ?? 0;
  const medsTomados = resumo?.medicamentos_tomados ?? 0;
  const medsPct = medsTotal > 0 ? Math.round((medsTomados / medsTotal) * 100) : 0;

  const habitosPct = resumo?.habitos_progresso_pct ?? 0;

  const allGood = resumo
    ? resumo.tarefas_criticas === 0 && medsTomados === medsTotal && habitosPct >= 100
    : false;

  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* ── Medicamentos ───────────────────────────────────── */}
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Pill className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-[13px] font-medium text-zinc-400">Medicamentos</p>
            </div>
            <CircularProgress
              pct={medsPct}
              size={52}
              strokeWidth={4}
              color={medsPct === 100 ? 'stroke-emerald-400' : 'stroke-emerald-600'}
            >
              <span className={`text-[10px] font-bold tabular-nums ${medsPct === 100 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                {medsPct}%
              </span>
            </CircularProgress>
          </div>
          {medsTotal > 0 ? (
            <>
              <p className="text-5xl font-extrabold text-white tracking-tighter tabular-nums">
                {medsTomados}
                <span className="text-xl text-zinc-600 font-normal ml-1">/{medsTotal}</span>
              </p>
              <ProgressBar
                pct={medsPct}
                label={medsPct === 100 ? 'Completo ✓' : 'Progresso'}
                color={medsPct === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}
              />
            </>
          ) : (
            <>
              <p className="text-5xl font-extrabold text-white tracking-tighter">—</p>
              <ProgressBar pct={0} label="Progresso" color="bg-gradient-to-r from-emerald-600 to-emerald-400" />
              <p className="text-[10px] text-zinc-500 mt-2">Nenhum medicamento cadastrado</p>
            </>
          )}
        </GlassCard>

        {/* ── Habitos ────────────────────────────────────────── */}
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-[13px] font-medium text-zinc-400">Habitos Diarios</p>
            </div>
            <CircularProgress
              pct={habitosPct}
              size={52}
              strokeWidth={4}
              color={habitosPct >= 100 ? 'stroke-emerald-400' : habitosPct >= 50 ? 'stroke-cyan-500' : 'stroke-zinc-600'}
            >
              <span className={`text-[10px] font-bold tabular-nums ${
                habitosPct >= 100 ? 'text-emerald-400' : 'text-zinc-400'
              }`}>
                {habitosPct.toFixed(0)}%
              </span>
            </CircularProgress>
          </div>
          {(resumo?.habitos.length ?? 0) > 0 ? (
            <>
              <p className={`text-5xl font-extrabold tabular-nums tracking-tighter ${
                habitosPct >= 100 ? 'text-emerald-400' : habitosPct >= 50 ? 'text-white' : 'text-zinc-500'
              }`}>
                {habitosPct.toFixed(0)}%
              </p>
              <ProgressBar
                pct={habitosPct}
                label={`${resumo?.habitos.length} rastreador${(resumo?.habitos.length ?? 0) > 1 ? 'es' : ''}`}
                color={habitosPct >= 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : habitosPct >= 50
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-400'
                    : 'bg-zinc-600'}
              />
            </>
          ) : (
            <>
              <p className="text-5xl font-extrabold text-white tracking-tighter">0%</p>
              <ProgressBar pct={0} label="Progresso" color="bg-gradient-to-r from-cyan-500 to-blue-400" />
              <p className="text-[10px] text-zinc-500 mt-2">Configure seus habitos</p>
            </>
          )}
        </GlassCard>

        {/* ── Status do Dia ──────────────────────────────────── */}
        <GlassCard className={allGood ? '!border-emerald-500/15' : ''}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              allGood ? 'bg-emerald-500/10' : 'bg-zinc-800/40'
            }`}>
              {allGood
                ? <Sparkles className="w-5 h-5 text-amber-400" />
                : <TrendingDown className="w-5 h-5 text-zinc-500" />}
            </div>
            <p className="text-[13px] font-medium text-zinc-400">Status do Dia</p>
          </div>
          <p className={`text-xl font-bold ${allGood ? 'text-emerald-400' : 'text-zinc-300'}`}>
            {allGood ? 'Dia Perfeito' : 'Em progresso'}
          </p>
          <div className="mt-4 space-y-2">
            <StatusRow
              label="Criticas"
              ok={(resumo?.tarefas_criticas ?? 1) === 0}
              detail={`${resumo?.tarefas_criticas ?? 0} pendente${(resumo?.tarefas_criticas ?? 0) !== 1 ? 's' : ''}`}
            />
            <StatusRow
              label="Medicamentos"
              ok={medsTotal > 0 && medsTomados === medsTotal}
              detail={medsTotal > 0 ? `${medsTomados}/${medsTotal}` : 'N/A'}
            />
            <StatusRow
              label="Habitos"
              ok={habitosPct >= 100}
              detail={(resumo?.habitos.length ?? 0) > 0 ? `${habitosPct.toFixed(0)}%` : 'N/A'}
            />
          </div>
        </GlassCard>
      </motion.div>

      {/* ── Detalhamento de Habitos ───────────────────────────── */}
      {resumo && resumo.habitos.length > 0 && (
        <motion.div {...fadeUp}>
          <div className="relative overflow-hidden bg-zinc-950/50 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 shadow-2xl transition-all duration-300 hover:border-violet-500/20">
            <h3 className="text-[14px] font-semibold text-white mb-5">Progresso dos Habitos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {resumo.habitos.map((h) => {
                const pct = h.meta_diaria > 0
                  ? Math.min((h.progresso_atual / h.meta_diaria) * 100, 100) : 0;
                const done = pct >= 100;
                const HIcon = HABIT_ICONS[h.nome_exibicao.toLowerCase()] || Activity;
                return (
                  <div
                    key={h.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 ${
                      done
                        ? 'border-emerald-500/15 bg-emerald-500/[0.04]'
                        : 'border-white/5 bg-zinc-900/20 hover:bg-zinc-800/30'
                    }`}
                  >
                    <HIcon className={`w-4 h-4 shrink-0 ${done ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-zinc-300 truncate">{h.nome_exibicao}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 rounded-full bg-zinc-800/60 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`text-[10px] tabular-nums shrink-0 ${done ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {h.progresso_atual}/{h.meta_diaria}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
