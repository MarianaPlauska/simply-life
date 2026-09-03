import { useState, useMemo } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CalendarClock, X, Mail } from 'lucide-react';
import { toast } from 'sonner';
import {
  getStressTasks,
  getCommunicationStressTasks,
} from '../../utils/burnoutTasks';

const STRESS_THRESHOLD = 5;

export function BurnoutAura()
{
  const tarefas = useTaskStore((s) => s.tarefas);
  const updateTarefa = useTaskStore((s) => s.updateTarefa);
  const [modalOpen, setModalOpen] = useState(false);
  const [postponing, setPostponing] = useState(false);

  const stressTasks = useMemo(() => getStressTasks(tarefas), [tarefas]);
  const commTasks = useMemo(() => getCommunicationStressTasks(tarefas), [tarefas]);
  const stressTasksCount = stressTasks.length;
  const isStressed = stressTasksCount > STRESS_THRESHOLD;

  const handlePostponeCommunications = async () =>
  {
    if (commTasks.length === 0)
    {
      toast.info('Nenhuma tarefa de comunicação crítica para adiar.');
      return;
    }

    setPostponing(true);
    try
    {
      await Promise.all(
        commTasks.map((t) =>
          updateTarefa(t.id, {
            status: 'pendente',
            score_urgencia: 25,
            prioridade: 'media',
          }),
        ),
      );
      toast.success(`Jarvis adiou ${commTasks.length} comunicação(ões) para "Nesta Semana"`, {
        description: 'Score reduzido para aliviar a carga cognitiva imediata.',
      });
      setModalOpen(false);
    }
    catch
    {
      toast.error('Não foi possível adiar as tarefas. Tente novamente.');
    }
    finally
    {
      setPostponing(false);
    }
  };

  if (!isStressed)
  {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-[9990] overflow-hidden"
        >
          <div
            className="absolute inset-0 border border-red-500/15"
          />

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="absolute top-3 right-3 bg-card border border-red-500/30 px-2 py-1 rounded pointer-events-auto flex items-center gap-1.5 hover:border-red-400/50 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">
              Burnout · {stressTasksCount}
            </span>
          </button>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9991] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6 pointer-events-auto"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-lg w-full bg-zinc-950/95 border border-zinc-700/50 rounded-3xl p-6 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Assistente Jarvis</span>
              </div>

              <h2 className="text-lg font-black text-zinc-100 mb-2">
                Carga cognitiva elevada
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Você tem {stressTasksCount} tarefas com urgência &gt; 100 em &quot;Fazer em 1h&quot; ou Pendente.
                Isso indica risco de burnout. Posso adiar e-mails e alertas de comunicação para a coluna semanal.
              </p>

              {commTasks.length > 0 ? (
                <ul className="max-h-36 overflow-y-auto flex flex-col gap-2 mb-5 pr-1">
                  {commTasks.slice(0, 8).map((t) => (
                    <li
                      key={t.id}
                      className="flex items-start gap-2 p-2.5 rounded-xl bg-zinc-900/80 border border-white/5 text-left"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-200 truncate">{t.titulo}</p>
                        <p className="text-[10px] text-zinc-500">Score {t.score_urgencia} · {t.origem}</p>
                      </div>
                    </li>
                  ))}
                  {commTasks.length > 8 && (
                    <li className="text-[10px] text-zinc-500 text-center">+{commTasks.length - 8} outras</li>
                  )}
                </ul>
              ) : (
                <p className="text-xs text-zinc-500 mb-5 italic">
                  Nenhuma tarefa de e-mail/comunicação na fila crítica - revise manualmente as tarefas restantes.
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  disabled={postponing || commTasks.length === 0}
                  onClick={handlePostponeCommunications}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wide transition-all"
                >
                  <CalendarClock className="w-4 h-4" />
                  {postponing ? 'Adiando…' : `Adiar ${commTasks.length} comunicação(ões)`}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wide transition-all"
                >
                  Continuar assim
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
