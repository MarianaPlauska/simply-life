import { toast } from 'sonner'
import type { TarefaUnificada } from '../types'

const KEY_PREFIX = 'axel-intencao-nudge:'

function todayKey(): string
{
  const d = new Date()
  return `${KEY_PREFIX}${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** No máximo 1 nudge por dia para intenções sem hora */
export function maybeNudgeIntencoes(tarefas: TarefaUnificada[]): void
{
  const abertas = tarefas.filter((t) => t.status !== 'concluida' && !t.data_vencimento)
  if (abertas.length === 0) return

  try
  {
    if (localStorage.getItem(todayKey()) === '1') return
    localStorage.setItem(todayKey(), '1')
  }
  catch
  {
    return
  }

  const sample = abertas[0]?.titulo ?? 'uma intenção'
  toast.message('Intenção ainda sem hora', {
    description: abertas.length === 1
      ? `${sample} - agende quando couber.`
      : `${abertas.length} intenções esperando um horário. A primeira: ${sample}.`,
    duration: 6000,
  })
}
