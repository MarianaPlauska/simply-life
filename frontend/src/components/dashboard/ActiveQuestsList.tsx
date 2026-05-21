import { useEffect } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { GlassCard } from '../ui/GlassCard';
import { Sparkles, Calendar, Compass, CheckCircle2, Circle } from 'lucide-react';

export function ActiveQuestsList()
{
  const userQuests = useTaskStore((s) => s.userQuests);
  const fetchQuests = useTaskStore((s) => s.fetchQuests);

  useEffect(() =>
  {
    fetchQuests();
  }, [fetchQuests]);

  const activeQuests = userQuests.filter((q) => !q.concluida);
  const completedQuests = userQuests.filter((q) => q.concluida);

  return (
    <GlassCard className="relative overflow-hidden flex flex-col gap-5 w-full" noGlow={false}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-bold text-zinc-200">Quests Jarvis Ativas</h3>
        </div>
        <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
          {completedQuests.length} / {userQuests.length} Concluídas
        </span>
      </div>

      {/* Quests List */}
      <div className="flex flex-col gap-3">
        {activeQuests.length === 0 && completedQuests.length === 0 ? (
          <p className="text-xs text-zinc-500 italic py-2">Nenhuma quest disponível no momento.</p>
        ) : (
          <>
            {/* Active Quests */}
            {activeQuests.map((q) => (
              <div 
                key={q.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/40 border border-white/5 hover:border-violet-500/10 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="text-zinc-600">
                    <Circle className="w-4.5 h-4.5 cursor-not-allowed" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-200">{q.titulo}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                        q.tipo === 'semanal' 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                      }`}>
                        {q.tipo === 'semanal' ? <Calendar className="w-2.5 h-2.5" /> : <Sparkles className="w-2.5 h-2.5" />}
                        {q.tipo}
                      </span>
                      {q.meta > 1 && (
                        <span className="text-[10px] text-zinc-500 font-medium">
                          Progresso: {q.progresso} / {q.meta}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-extrabold text-violet-400">
                  <span>+{q.recompensa_xp} XP</span>
                </div>
              </div>
            ))}

            {/* Completed Quests */}
            {completedQuests.map((q) => (
              <div 
                key={q.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/20 border border-white/5 opacity-55 hover:opacity-80 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="text-emerald-500">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-400 line-through">{q.titulo}</span>
                    <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-500 border border-white/5 text-[9px] font-bold uppercase tracking-wider w-max">
                      concluída
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                  <span>+{q.recompensa_xp} XP</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </GlassCard>
  );
}
