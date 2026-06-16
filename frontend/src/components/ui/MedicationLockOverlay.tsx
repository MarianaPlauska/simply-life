import { useState } from 'react'
import { useTaskStore } from '../../store/useTaskStore'
import { buildDosesHoje, proximaDosePendente, mensagemGentilDose } from '../../lib/medicamentosSchedule'
import { Pill, X } from 'lucide-react'

// Lembrete gentil — sem bloquear a navegação

export function MedicationLockOverlay()
{
  const medicamentos = useTaskStore((s) => s.medicamentos)
  const medicamentoTomadas = useTaskStore((s) => s.medicamentoTomadas)
  const registrarTomadaMedicamento = useTaskStore((s) => s.registrarTomadaMedicamento)
  const fetchMedicamentoTomadas = useTaskStore((s) => s.fetchMedicamentoTomadas)
  const [dismissed, setDismissed] = useState<string | null>(null)

  const doses = buildDosesHoje(medicamentos, medicamentoTomadas)
  const pendente = proximaDosePendente(doses)

  if (!pendente || pendente.status === 'futuro' || dismissed === `${pendente.medicamentoId}-${pendente.horario}`)
  {
    return null
  }

  const handleTaken = async () =>
  {
    await registrarTomadaMedicamento(pendente.medicamentoId, pendente.horario)
    await fetchMedicamentoTomadas()
  }

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-3 right-3 md:left-auto md:right-4 md:max-w-md z-[9000]">
      <div className="rounded-sl border border-atencao/40 bg-card shadow-lg p-3 flex gap-3 items-start">
        <Pill className="w-5 h-5 text-atencao shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-ink">AXEL · Medicamento</p>
          <p className="text-[11px] text-ink-muted mt-0.5 leading-snug">
            {mensagemGentilDose(pendente)}
          </p>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => void handleTaken()}
              className="px-2.5 py-1 rounded-sl bg-accent text-white font-mono text-[9px] uppercase"
            >
              Registrar
            </button>
            <button
              type="button"
              onClick={() => setDismissed(`${pendente.medicamentoId}-${pendente.horario}`)}
              className="px-2.5 py-1 rounded-sl border border-line font-mono text-[9px] uppercase text-ink-muted"
            >
              Depois
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(`${pendente.medicamentoId}-${pendente.horario}`)}
          className="shrink-0 p-1 text-ink-muted"
          aria-label="Fechar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
