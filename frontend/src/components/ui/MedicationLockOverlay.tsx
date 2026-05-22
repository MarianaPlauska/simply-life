import { useState, useEffect, useCallback } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { Pill, Check, AlertOctagon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  getOverdueMedications,
  ignoreMedicationForToday,
  clearMedicationIgnore,
} from '../../utils/medicationLock';

export function MedicationLockOverlay()
{
  const medicamentos = useTaskStore((s) => s.medicamentos);
  const toggleMedicamento = useTaskStore((s) => s.toggleMedicamento);
  const fetchMedicamentos = useTaskStore((s) => s.fetchMedicamentos);
  const [overdueMeds, setOverdueMeds] = useState<typeof medicamentos>([]);
  const [tick, setTick] = useState(0);

  useEffect(() =>
  {
    fetchMedicamentos();
  }, [fetchMedicamentos]);

  const refreshOverdue = useCallback(() =>
  {
    setOverdueMeds(getOverdueMedications(medicamentos));
  }, [medicamentos, tick]);

  useEffect(() =>
  {
    refreshOverdue();
    const interval = setInterval(() =>
    {
      setTick((n) => n + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshOverdue]);

  const handleTaken = async (medId: number) =>
  {
    clearMedicationIgnore(medId);
    await toggleMedicamento(medId);
    setTick((n) => n + 1);
  };

  const handleIgnore = (medId: number, nome: string) =>
  {
    ignoreMedicationForToday(medId);
    toast.warning(`Jarvis: "${nome}" ignorado por hoje`, {
      description: 'A navegação foi liberada. Tente registrar a ingestão assim que possível.',
    });
    setTick((n) => n + 1);
  };

  const handleIgnoreAll = () =>
  {
    overdueMeds.forEach((med) => ignoreMedicationForToday(med.id));
    toast.warning('Jarvis: medicamentos ignorados por hoje', {
      description: 'Navegação liberada temporariamente. Sua saúde continua em prioridade máxima.',
    });
    setTick((n) => n + 1);
  };

  if (overdueMeds.length === 0)
  {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="relative max-w-md w-full bg-zinc-950/90 border border-red-500/20 rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden"
          style={{
            boxShadow: '0 0 50px rgba(239, 68, 68, 0.15)',
          }}
        >
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-red-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative mb-6 flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 shadow-lg text-red-500 animate-[bounce_2s_infinite]">
            <AlertOctagon className="w-10 h-10" />
          </div>

          <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1.5">Bloqueio Preventivo Jarvis</span>
          <h2 className="text-xl font-black text-zinc-100 mb-3">Saúde em Primeiro Lugar</h2>
          <p className="text-xs text-zinc-400 leading-relaxed mb-6">
            Medicamento(s) atrasado(s) por mais de 1 hora. O Jarvis bloqueou finanças, tarefas e demais módulos até você registrar a ingestão ou ignorar conscientemente.
          </p>

          <div className="w-full flex flex-col gap-3 mb-6">
            {overdueMeds.map((med) => (
              <div
                key={med.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-zinc-900 border border-white/5 shadow-inner text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-200">{med.nome}</span>
                    <span className="text-[10px] text-zinc-500">Horário: {med.horario}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleIgnore(med.id, med.nome)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-300 text-[10px] font-bold uppercase transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    Ignorar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTaken(med.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 active:scale-95 text-white text-[10px] font-bold uppercase transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Tomado
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleIgnoreAll}
            className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-300 uppercase tracking-wider mb-3 transition-colors"
          >
            Ignorar todos por hoje
          </button>

          <div className="text-[10px] text-zinc-500 italic">
            Prioridade absoluta: Score 200+ na spec — nada substitui sua saúde.
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
