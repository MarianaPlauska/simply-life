import { useTaskStore } from '../../store/useTaskStore';
import { motion, AnimatePresence } from 'framer-motion';

export function BurnoutAura()
{
  const tarefas = useTaskStore((s) => s.tarefas);

  // Count pending tasks with urgency score > 100
  const stressTasksCount = tarefas.filter(
    (t) => t.status !== 'concluida' && (t.score_urgencia || 0) > 100
  ).length;

  const isStressed = stressTasksCount > 5;

  return (
    <AnimatePresence>
      {isStressed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-[9990] overflow-hidden"
        >
          {/* Subtle vignette/border pulse indicating overload */}
          <div 
            className="absolute inset-0 border-[6px] border-red-500/20 rounded-none shadow-[inset_0_0_60px_rgba(239,68,68,0.25)] animate-[pulse_2.5s_ease-in-out_infinite]"
          />
          
          {/* Subtle glowing warning tag in the top right corner */}
          <div className="absolute top-4 right-4 bg-red-950/80 border border-red-500/30 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg pointer-events-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Alerta Burnout: +5 Tarefas Críticas</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
