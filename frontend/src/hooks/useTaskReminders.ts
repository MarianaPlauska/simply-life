import { useEffect } from 'react'
import { toast } from 'sonner'
import { scheduleTaskReminders } from '../lib/taskReminderScheduler'
import { showHealthNotification } from '../lib/healthNotifications'
import { useTaskStore } from '../store/useTaskStore'

/** Lembrete PWA no horário do compromisso interno */
export function useTaskReminders(enabled = true): void
{
  const isLoggedIn = useTaskStore((s) => s.isLoggedIn)
  const tarefas = useTaskStore((s) => s.tarefas)

  useEffect(() =>
  {
    if (!enabled || !isLoggedIn)
    {
      return
    }

    const cleanup = scheduleTaskReminders(tarefas, {
      onDue: (tarefa) =>
      {
        void showHealthNotification({
          title: 'Compromisso',
          body: tarefa.titulo,
          url: '/calendario',
          tag: `task-${tarefa.id}`,
          kind: 'task',
          taskId: tarefa.id,
        }).then((pushed) =>
        {
          if (!pushed)
          {
            toast.info(tarefa.titulo, {
              description: 'Hora do compromisso',
              duration: 8000,
            })
          }
        })
      },
    })

    return cleanup
  }, [enabled, isLoggedIn, tarefas])
}
