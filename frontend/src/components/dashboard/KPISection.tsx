import { motion } from 'framer-motion';
import {
  ListChecks, AlertTriangle, CheckCircle2, DollarSign,
} from 'lucide-react';
import {
  GlassCard, ProgressBar, CircularProgress, fmt,
  staggerContainer,
} from './DashboardPrimitives';
import type { DashboardResumo } from '../../store/useTaskStore';

export function KPISection({ resumo }: { resumo: DashboardResumo | null }) {
  const tarefasTotal = resumo?.tarefas_total ?? 0;
  const tarefasConcluidas = resumo?.tarefas_concluidas ?? 0;
  const tarefasPct = tarefasTotal > 0
    ? Math.round((tarefasConcluidas / tarefasTotal) * 100) : 0;

  const despesaDia = resumo?.despesas_dia ?? 0;
  const saldoMes = resumo?.saldo_mes ?? 0;
  const inBudget = saldoMes >= 0;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      {/* ── Tarefas ──────────────────────────────────────────── */}
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <ListChecks className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-zinc-400">Tarefas</p>
              {tarefasTotal > 0 && (
                <p className="text-[11px] text-zinc-600">
                  {resumo?.tarefas_pendentes ?? 0} pendente{(resumo?.tarefas_pendentes ?? 0) !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <CircularProgress
            pct={tarefasPct}
            size={52}
            strokeWidth={4}
            color="stroke-violet-500"
          >
            <span className="text-[10px] font-bold text-violet-400 tabular-nums">{tarefasPct}%</span>
          </CircularProgress>
        </div>
        {tarefasTotal > 0 ? (
          <>
            <p className="text-5xl font-extrabold text-white tracking-tighter tabular-nums">
              {tarefasConcluidas}
              <span className="text-xl text-zinc-600 font-normal ml-1">/{tarefasTotal}</span>
            </p>
            <ProgressBar pct={tarefasPct} label="Progresso" color="bg-gradient-to-r from-violet-500 to-indigo-500" />
          </>
        ) : (
          <>
            <p className="text-5xl font-extrabold text-white tracking-tighter">—</p>
            <ProgressBar pct={0} label="Progresso" color="bg-gradient-to-r from-violet-500 to-indigo-500" />
            <p className="text-[10px] text-zinc-500 mt-2">Crie sua primeira tarefa</p>
          </>
        )}
      </GlassCard>

      {/* ── Foco Critico ─────────────────────────────────────── */}
      <GlassCard className={(resumo?.tarefas_criticas ?? 0) > 0 ? '!border-red-500/15' : ''}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              (resumo?.tarefas_criticas ?? 0) > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'
            }`}>
              {(resumo?.tarefas_criticas ?? 0) > 0
                ? <AlertTriangle className="w-5 h-5 text-red-400" />
                : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            </div>
            <p className="text-[13px] font-medium text-zinc-400">Foco Critico</p>
          </div>
          <CircularProgress
            pct={(resumo?.tarefas_criticas ?? 0) > 0 ? 100 : 0}
            size={52}
            strokeWidth={4}
            color={(resumo?.tarefas_criticas ?? 0) > 0 ? 'stroke-red-500' : 'stroke-emerald-500'}
          >
            <span className={`text-[10px] font-bold tabular-nums ${
              (resumo?.tarefas_criticas ?? 0) > 0 ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {resumo?.tarefas_criticas ?? 0}
            </span>
          </CircularProgress>
        </div>
        <p className={`text-5xl font-extrabold tabular-nums tracking-tighter ${
          (resumo?.tarefas_criticas ?? 0) > 0 ? 'text-red-400' : 'text-emerald-400'
        }`}>
          {resumo?.tarefas_criticas ?? 0}
        </p>
        <p className="text-[11px] text-zinc-500 mt-3">
          {(resumo?.tarefas_criticas ?? 0) > 0
            ? 'Score >= 100 — acao imediata'
            : 'Nenhuma tarefa critica'}
        </p>
      </GlassCard>

      {/* ── Financas ─────────────────────────────────────────── */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            inBudget ? 'bg-emerald-500/10' : 'bg-red-500/10'
          }`}>
            <DollarSign className={`w-5 h-5 ${inBudget ? 'text-emerald-400' : 'text-red-400'}`} />
          </div>
          <div>
            <p className="text-[13px] font-medium text-zinc-400">Gastos Hoje</p>
            <p className="text-[11px] text-zinc-600">Mensal: {fmt(resumo?.despesas_mes ?? 0)}</p>
          </div>
        </div>
        <p className={`text-5xl font-extrabold tabular-nums tracking-tighter ${
          inBudget ? 'text-white' : 'text-red-400'
        }`}>
          {fmt(despesaDia)}
        </p>
        <p className={`text-[11px] mt-3 tabular-nums font-medium ${
          inBudget ? 'text-emerald-500' : 'text-red-400'
        }`}>
          {inBudget ? '+' : ''}{fmt(saldoMes)} saldo mensal
        </p>
      </GlassCard>
    </motion.div>
  );
}
