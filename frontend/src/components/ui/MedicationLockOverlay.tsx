import { useState, useEffect } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { Pill, Check, AlertOctagon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function MedicationLockOverlay()
{
  const medicamentos = useTaskStore((s) => s.medicamentos);
  const toggleMedicamento = useTaskStore((s) => s.toggleMedicamento);
  const fetchMedicamentos = useTaskStore((s) => s.fetchMedicamentos);
  const [overdueMeds, setOverdueMeds] = useState<typeof medicamentos>([]);

  useEffect(() =>
  {
    fetchMedicamentos();
  }, [fetchMedicamentos]);

  useEffect(() =>
  {
    const checkOverdue = () =>
    {
      const now = new Date();
      const overdue = medicamentos.filter((med) =>
      {
        if (med.tomado) return false;
        
        try
        {
          const [hours, minutes] = med.horario.split(':').map(Number);
          const medTime = new Date();
          medTime.setHours(hours, minutes, 0, 0);
          
          const diffMs = now.getTime() - medTime.getTime();
          const diffMin = diffMs / (1000 * 60);
          
          // Overdue by more than 60 minutes (1h)
          return diffMin > 60;
        }
        catch
        {
          return false;
        }
      });
      
      setOverdueMeds(overdue);
    };

    checkOverdue();
    
    // Check every 30 seconds
    const interval = setInterval(checkOverdue, 30000);
    return () => clearInterval(interval);
  }, [medicamentos]);

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
          {/* Pulsing red aura in background */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-red-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none" />

          {/* Warning Icon */}
          <div className="relative mb-6 flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 shadow-lg text-red-500 animate-[bounce_2s_infinite]">
            <AlertOctagon className="w-10 h-10" />
          </div>

          <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1.5">Bloqueio Preventivo Jarvis</span>
          <h2 className="text-xl font-black text-zinc-100 mb-3">Saúde em Primeiro Lugar</h2>
          <p className="text-xs text-zinc-400 leading-relaxed mb-6">
            Você tem medicamento(s) atrasado(s) por mais de 1 hora. Para garantir seu bem-estar, o Jarvis restringiu a navegação temporariamente. Registre a ingestão para liberar o acesso.
          </p>

          {/* Overdue Medication List */}
          <div className="w-full flex flex-col gap-3 mb-8">
            {overdueMeds.map((med) => (
              <div 
                key={med.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900 border border-white/5 shadow-inner"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-zinc-200">{med.nome}</span>
                    <span className="text-[10px] text-zinc-500">Horário: {med.horario}</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleMedicamento(med.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 active:scale-95 text-white text-[10px] font-bold uppercase transition-all duration-200"
                >
                  <Check className="w-3.5 h-3.5" />
                  Marcar como Tomado
                </button>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-zinc-500 italic">
            Nenhuma ação além do registro de saúde é permitida no momento.
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
