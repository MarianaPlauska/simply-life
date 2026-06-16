import { useEffect } from 'react'
import { toast } from 'sonner'
import { useTaskStore } from '../store/useTaskStore'
import { buildDosesHoje, proximaDosePendente, mensagemGentilDose } from '../lib/medicamentosSchedule'

const REMINDER_INTERVAL_MS = 5 * 60 * 1000

/** Lembretes gentis de medicamento — espelho do sync financeiro no AppLayout */
export function useMedicationReminders(enabled = true): void
{
  const medicamentos = useTaskStore((s) => s.medicamentos)
  const medicamentoTomadas = useTaskStore((s) => s.medicamentoTomadas)
  const fetchMedicamentos = useTaskStore((s) => s.fetchMedicamentos)
  const fetchMedicamentoTomadas = useTaskStore((s) => s.fetchMedicamentoTomadas)

  useEffect(() =>
  {
    if (!enabled) return
    void fetchMedicamentos()
    void fetchMedicamentoTomadas()
  }, [enabled, fetchMedicamentos, fetchMedicamentoTomadas])

  useEffect(() =>
  {
    if (!enabled || medicamentos.length === 0) return

    const check = () =>
    {
      const doses = buildDosesHoje(medicamentos, medicamentoTomadas)
      const pendente = proximaDosePendente(doses)
      if (!pendente || pendente.status === 'futuro') return

      const key = `med-reminder-${pendente.medicamentoId}-${pendente.horario}`
      const last = sessionStorage.getItem(key)
      const now = Date.now()
      if (last && now - Number(last) < REMINDER_INTERVAL_MS) return

      sessionStorage.setItem(key, String(now))
      toast.info('AXEL · Medicamento', {
        description: mensagemGentilDose(pendente),
        duration: 6000,
      })
    }

    check()
    const id = window.setInterval(check, REMINDER_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [enabled, medicamentos, medicamentoTomadas])
}
