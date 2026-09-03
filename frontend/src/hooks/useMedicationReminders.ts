import { useEffect } from 'react'
import { toast } from 'sonner'
import { useTaskStore } from '../store/useTaskStore'
import { buildDosesHoje, proximaDosePendente, mensagemGentilDose } from '../lib/medicamentosSchedule'
import { showHealthNotification } from '../lib/healthNotifications'

const REMINDER_INTERVAL_MS = 5 * 60 * 1000

/** Lembretes de medicamento - toast in-app + notificação SW quando permitido */
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
      const body = mensagemGentilDose(pendente)

      void showHealthNotification({
        title: 'AXEL · Medicamento',
        body,
        url: '/saude#medicamentos',
        tag: key,
      }).then((pushed) =>
      {
        if (!pushed)
        {
          toast.info('AXEL · Medicamento', {
            description: body,
            duration: 6000,
          })
        }
      })
    }

    check()
    const id = window.setInterval(check, REMINDER_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [enabled, medicamentos, medicamentoTomadas])
}
