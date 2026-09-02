import { toast } from 'sonner'
import { useTaskStore } from '../store/useTaskStore'
import { markTaskPushSnooze } from './pushNotificationActions'

interface PushActionMessage
{
  type: 'push-action'
  action: 'done' | 'snooze'
  data: {
    kind?: string
    taskId?: number | null
    medicamentoId?: number | null
    horario?: string | null
    url?: string
  }
  result?: { message?: string }
}

export async function handlePushActionMessage(msg: PushActionMessage): Promise<void>
{
  const { action, data, result } = msg
  const store = useTaskStore.getState()

  if (result?.message)
  {
    toast.success(result.message)
  }

  if (data.kind === 'task' && data.taskId)
  {
    if (action === 'done')
    {
      await store.updateTarefa(data.taskId, { status: 'concluida' })
      if (!result?.message) toast.success('Tarefa concluída')
      return
    }
    if (action === 'snooze')
    {
      markTaskPushSnooze(data.taskId, 30)
      if (!result?.message) toast.info('Lembrete adiado em 30 min')
      return
    }
  }

  if (data.kind === 'med' && data.medicamentoId && data.horario && action === 'done')
  {
    await store.registrarTomadaMedicamento(data.medicamentoId, data.horario)
    if (!result?.message) toast.success('Dose registrada')
    return
  }

  if (action === 'snooze' && !result?.message)
  {
    toast.info('Lembrete adiado')
  }
}
