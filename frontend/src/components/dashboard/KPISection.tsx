import { motion } from 'framer-motion';
import {
  ListChecks, AlertTriangle, CheckCircle2, DollarSign, Sparkles,
} from 'lucide-react';
import {
  fmt,
  staggerContainer,
} from './DashboardPrimitives';
import type { DashboardResumo } from '../../store/useTaskStore';

interface KPISectionProps {
  resumo: DashboardResumo | null;
  tarefasIA?: number;  // tarefas com origem != 'manual'
}

export function KPISection({ resumo, tarefasIA = 0 }: KPISectionProps) {
  const tarefasTotal = resumo?.tarefas_total ?? 0;
  const tarefasConcluidas = resumo?.tarefas_concluidas ?? 0;
  const tarefasPct = tarefasTotal > 0
    ? Math.round((tarefasConcluidas / tarefasTotal) * 100) : 0;

  const despesaDia = resumo?.despesas_dia ?? 0;
  const saldoMes = resumo?.saldo_mes ?? 0;
  const inBudget = saldoMes >= 0;
  const hasCriticas = (resumo?.tarefas_criticas ?? 0) > 0;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      className="grid grid-cols-1 md:grid-cols-3 py-6 border-b border-white/5 gap-y-6 md:gap-y-0"
    >
      {/* ── Tarefas ──────────────────────────────────────────── */}
      <div className="flex flex-col pr-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <ListChecks className="w-4.5 h-4.5 text-violet-400" />
            <div>
              <p className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider">Tarefas</p>
              {tarefasTotal > 0 && (
                <p className="text-[11px] text-zinc-500 font-light mt-0.5">
                  {resumo?.tarefas_pendentes ?? 0} pendente{(resumo?.tarefas_pendentes ?? 0) !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <span className="text-[12px] font-bold text-violet-400 tabular-nums bg-violet-500/10 px-2 py-0.5 rounded">
            {tarefasPct}%
          </span>
        </div>
        {tarefasTotal > 0 ? (
          <div>
            <p className="text-3xl font-extrabold text-white tracking-tight tabular-nums leading-none">
              {tarefasConcluidas}
              <span className="text-lg text-zinc-500 font-normal ml-1.5">/ {tarefasTotal}</span>
            </p>
            <p className="text-[11px] text-zinc-500 mt-2 font-light">Progresso geral concluído</p>
          </div>
        ) : (
          <div>
            <p className="text-3xl font-extrabold text-white tracking-tight tabular-nums leading-none">—</p>
            <p className="text-[11px] text-zinc-500 mt-2 font-light">Crie sua primeira tarefa</p>
          </div>
        )}
      </div>

      {/* ── Foco Critico ─────────────────────────────────────── */}
      <div className="flex flex-col px-0 md:px-6 md:border-l md:border-r border-white/5 relative">
        {/* Badge IA */}
        {tarefasIA > 0 && (
          <div className="absolute top-0 right-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-600/20 border border-violet-500/30">
            <Sparkles className="w-2.5 h-2.5 text-violet-300" />
            <span className="text-[10px] font-bold text-violet-300">{tarefasIA} IA</span>
          </div>
        )}

        <div className="flex items-center gap-2.5 mb-4">
          {hasCriticas
            ? <AlertTriangle className="w-4.5 h-4.5 text-red-400" />
            : <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />}
          <div>
            <p className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider">Foco Crítico</p>
            <p className="text-[11px] text-zinc-500 font-light mt-0.5">Prioridades para hoje</p>
          </div>
        </div>
        <div>
          <p className={`text-3xl font-extrabold tabular-nums tracking-tight leading-none ${
            hasCriticas ? 'text-red-400' : 'text-emerald-400'
          }`}>
            {resumo?.tarefas_criticas ?? 0}
          </p>
          <p className="text-[11px] text-zinc-500 mt-2 font-light">
            {hasCriticas ? 'Score >= 100 — ação imediata' : 'Nenhuma tarefa crítica'}
          </p>
        </div>
      </div>

      {/* ── Financas ─────────────────────────────────────────── */}
      <div className="flex flex-col pl-0 md:pl-6">
        <div className="flex items-center gap-2.5 mb-4">
          <DollarSign className={`w-4.5 h-4.5 ${inBudget ? 'text-emerald-400' : 'text-red-400'}`} />
          <div>
            <p className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider">Gastos Hoje</p>
            <p className="text-[11px] text-zinc-500 font-light mt-0.5">Mensal: {fmt(resumo?.despesas_mes ?? 0)}</p>
          </div>
        </div>
        <div>
          <p className={`text-3xl font-extrabold tabular-nums tracking-tight leading-none ${
            inBudget ? 'text-white' : 'text-red-400'
          }`}>
            {fmt(despesaDia)}
          </p>
          <p className={`text-[11px] mt-2 font-medium ${
            inBudget ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {inBudget ? '+' : ''}{fmt(saldoMes)} de saldo
          </p>
        </div>
      </div>
    </motion.div>
  );
}
