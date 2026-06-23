import { useEffect } from 'react'
import { toast } from 'sonner'
import { scheduleMedicationNotifications } from '../lib/medicationNotificationScheduler'
import { showHealthNotification } from '../lib/healthNotifications'
import { useTaskStore } from '../store/useTaskStore'

/** Lembretes no horário da dose — SW + toast quando permissão negada */
export function useMedicationScheduledNotifications(enabled = true): void
{
  const isLoggedIn = useTaskStore((s) => s.isLoggedIn)
  const medicamentos = useTaskStore((s) => s.medicamentos)
  const medicamentoTomadas = useTaskStore((s) => s.medicamentoTomadas)

  useEffect(() =>
  {
    if (!enabled || !isLoggedIn || medicamentos.length === 0)
    {
      return
    }

    const cleanup = scheduleMedicationNotifications(
      medicamentos,
      medicamentoTomadas,
      {
        onDose: (dose, body) =>
        {
          const tag = `med-${dose.medicamentoId}-${dose.horario}`
          void showHealthNotification({
            title: `Medicamento · ${dose.horario}`,
            body,
            url: '/saude#medicamentos',
            tag,
          }).then((pushed) =>
          {
            if (!pushed)
            {
              toast.info(`Medicamento · ${dose.horario}`, {
                description: body,
                duration: 8000,
              })
            }
          })
        },
      },
    )

    return cleanup
  }, [enabled, isLoggedIn, medicamentos, medicamentoTomadas])
}
