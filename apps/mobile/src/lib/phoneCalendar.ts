import type { CalendarEvent } from '@simply-life/shared'

/** No navegador não há acesso à agenda do aparelho (no iPhone, use o link .ics da agenda em Configurações). */
export async function readPhoneCalendarEvents(_from: string, _to: string, _ask = false): Promise<CalendarEvent[] | null>
{
  return null
}

/** No navegador a tarefa já aparece no calendário do app. A agenda do aparelho é no app instalado. */
export async function addPhoneCalendarEvent(_input: {
  title: string
  date: string
  horaMinutos: number | null
  minutes: number
}): Promise<boolean>
{
  return false
}
