import { useMemo } from 'react'
import type { CalendarEvent } from '@simply-life/shared'
import { useCalendarStore } from '../../store/calendarStore'
import { useMeuMundoStore } from '../../store/meuMundoStore'

/** Compromissos de fora (Google, .ics e agenda do celular), para mostrar e checar conflito. */
export function useMundoEvents(): CalendarEvent[]
{
  const cal = useCalendarStore((s) => s.events)
  const phone = useMeuMundoStore((s) => s.phoneEvents)
  // o Google também aparece na agenda do celular: o mesmo compromisso entra uma vez só
  return useMemo(() =>
  {
    const seen = new Set<string>()
    return [...cal, ...phone].filter((e) =>
    {
      const k = `${e.titulo.trim().toLowerCase()}|${e.date}|${e.inicio}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }, [cal, phone])
}
