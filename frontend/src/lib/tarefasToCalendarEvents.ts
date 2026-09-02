import type { TarefaUnificada } from '../types'
import type { CalendarEvent } from '../store/storeTypes'
import { clockLabel, dateIsoFromDue, hasClockTime } from './taskDueTime'

const DEFAULT_DURATION_MS = 60 * 60 * 1000

/** Agenda interna = tarefas com data (sem Google) */
export function tarefasToCalendarEvents(tarefas: TarefaUnificada[]): CalendarEvent[]
{
  return tarefas
    .filter((t) => t.status !== 'concluida' && t.data_vencimento)
    .map((t) =>
    {
      const inicio = t.data_vencimento as string
      const start = inicio.includes('T') ? new Date(inicio) : new Date(`${inicio}T09:00:00`)
      const fim = new Date(start.getTime() + DEFAULT_DURATION_MS)
      return {
        titulo: t.titulo,
        inicio: start.toISOString(),
        fim: fim.toISOString(),
        local: hasClockTime(t.data_vencimento) ? clockLabel(t.data_vencimento) : 'o dia',
        descricao: dateIsoFromDue(t.data_vencimento),
      }
    })
}
