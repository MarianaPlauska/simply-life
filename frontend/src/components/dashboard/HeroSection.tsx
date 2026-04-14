import { motion } from 'framer-motion';
import { Sun, Moon, Sunset, Bell } from 'lucide-react';
import { fadeUp } from './DashboardPrimitives';
import type { DashboardResumo } from '../../store/useTaskStore';

function getGreetIcon(): React.ElementType {
  const h = new Date().getHours();
  if (h < 12) return Sun;
  if (h < 18) return Sunset;
  return Moon;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function HeroSection({
  resumo,
  naoLidas,
}: {
  resumo: DashboardResumo | null;
  naoLidas: number;
}) {
  const GreetIcon = getGreetIcon();

  return (
    <motion.div {...fadeUp}>
      <div className="relative overflow-hidden bg-zinc-950/50 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-10 shadow-2xl">
        {/* Radial glow overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.12),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.06),transparent_60%)] pointer-events-none" />

        <div className="relative flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            {/* Greeting chip */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/10 mb-4">
              <GreetIcon className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-medium text-violet-300 tracking-wide uppercase">
                {getGreeting()}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter leading-[1.1]">
              {resumo?.saudacao_ia.split('.')[0] || 'Carregando...'}
            </h1>

            {resumo && (
              <p className="text-[14px] text-zinc-400 mt-3 leading-relaxed max-w-2xl">
                {resumo.saudacao_ia.split('.').slice(1).join('.').trim()}
              </p>
            )}

            {/* Quick stats row */}
            {resumo && (
              <div className="flex items-center gap-6 mt-6">
                <QuickStat value={resumo.tarefas_criticas} label="Criticas" accent={resumo.tarefas_criticas > 0 ? 'text-red-400' : 'text-emerald-400'} />
                <div className="w-px h-6 bg-white/5" />
                <QuickStat value={resumo.tarefas_pendentes} label="Pendentes" accent="text-violet-400" />
                <div className="w-px h-6 bg-white/5" />
                <QuickStat value={resumo.tarefas_concluidas} label="Concluidas" accent="text-emerald-400" />
              </div>
            )}
          </div>

          <button className="relative p-3 rounded-[1rem] bg-zinc-900/40 backdrop-blur-xl border border-white/5 hover:border-violet-500/20 transition-all duration-300 shrink-0 group">
            <Bell className="w-5 h-5 text-zinc-400 group-hover:text-zinc-300 transition-colors" />
            {naoLidas > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1 ring-2 ring-zinc-950">
                {naoLidas > 9 ? '9+' : naoLidas}
              </span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function QuickStat({ value, label, accent }: { value: number; label: string; accent: string }) {
  return (
    <div className="flex flex-col">
      <span className={`text-2xl font-black tabular-nums tracking-tighter ${accent}`}>{value}</span>
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}
