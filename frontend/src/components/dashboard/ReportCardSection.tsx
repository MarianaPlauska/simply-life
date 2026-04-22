// frontend/src/components/dashboard/ReportCardSection.tsx
// Card resumido de performance para o Dashboard Home
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, ArrowUpRight, ArrowDownRight, Trophy, Flame } from 'lucide-react';
import { fadeUp } from './DashboardPrimitives';
import { useTaskStore } from '../../store/useTaskStore';
import { useNavigate } from 'react-router-dom';

export function ReportCardSection() {
  const resumo = useTaskStore((s) => s.relatorioResumo);
  const fetchResumo = useTaskStore((s) => s.fetchRelatorioResumo);
  const navigate = useNavigate();
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchResumo();
  }, []);

  if (!resumo) return null;

  const data = resumo.tendencia_score ?? [];
  const max = Math.max(...data.map(d => d.valor), 1);

  return (
    <motion.div {...fadeUp}>
      <div
        onClick={() => navigate('/relatorios')}
        className="bg-zinc-900/30 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-2xl
          hover:border-white/10 hover:bg-zinc-800/40 hover:scale-[1.005] transition-all duration-500 cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-medium">
              Performance da Semana
            </span>
          </div>
          <span className="text-[10px] text-zinc-600 group-hover:text-violet-400 transition-colors">
            Ver relatório completo →
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {/* Score */}
          <div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black tracking-tighter text-zinc-100">
                {resumo.score_semana}
              </span>
              <VariacaoBadge valor={resumo.variacao_score_semana} />
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5">Score Eficiência</p>
          </div>

          {/* Tarefas */}
          <div>
            <span className="text-xl font-bold text-emerald-400">
              {resumo.tarefas_concluidas_semana}
            </span>
            <p className="text-[10px] text-zinc-500 mt-0.5">Tarefas Concluídas</p>
          </div>

          {/* Foco */}
          <div>
            <span className="text-xl font-bold text-cyan-400">
              {resumo.minutos_foco_semana}<span className="text-xs text-zinc-500">min</span>
            </span>
            <p className="text-[10px] text-zinc-500 mt-0.5">Tempo de Foco</p>
          </div>

          {/* XP */}
          <div>
            <span className="text-xl font-bold text-amber-400">
              {resumo.xp_semana}<span className="text-xs text-zinc-500">xp</span>
            </span>
            <p className="text-[10px] text-zinc-500 mt-0.5">XP Ganho</p>
          </div>
        </div>

        {/* Mini bar chart — score trend */}
        <div className="flex items-end gap-1 h-10">
          {data.map((d, i) => {
            const h = (d.valor / max) * 32;
            const isLast = i === data.length - 1;
            return (
              <div key={d.label} className="flex-1 flex flex-col items-center">
                <motion.div
                  className="w-full max-w-[24px] rounded-t-sm"
                  style={{
                    height: Math.max(h, 2),
                    backgroundColor: isLast ? '#8b5cf6' : '#8b5cf633',
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: Math.max(h, 2) }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                />
              </div>
            );
          })}
        </div>

        {/* Streak + top dia */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3 h-3 text-orange-400" />
            <span className="text-xs text-zinc-400">{resumo.streak_atual} dias seguidos</span>
          </div>
          {resumo.top_dia && (
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-zinc-400">Melhor dia: {resumo.top_dia.nome}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

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
