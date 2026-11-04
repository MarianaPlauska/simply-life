import * as Calendar from 'expo-calendar'
import { Platform } from 'react-native'
import { localTodayIso, type CalendarEvent } from '@simply-life/shared'

/**
 * Lê os compromissos da agenda do celular entre dois dias (YYYY-MM-DD), só para mostrar e checar conflito.
 * `ask`: pede a permissão; sem ela, só lê se já foi dada antes.
 */
export async function readPhoneCalendarEvents(from: string, to: string, ask = false): Promise<CalendarEvent[] | null>
{
  const perm = ask ? await Calendar.requestCalendarPermissionsAsync() : await Calendar.getCalendarPermissionsAsync()
  if (perm.status !== 'granted') return null
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)
  if (!calendars.length) return []
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  const events = await Calendar.getEventsAsync(
    calendars.map((c) => c.id),
    new Date(fy, fm - 1, fd, 0, 0),
    new Date(ty, tm - 1, td, 23, 59),
  )
  return events.map((e) =>
  {
    const start = new Date(e.startDate)
    const end = new Date(e.endDate)
    const sameDay = localTodayIso(start) === localTodayIso(end)
    return {
      id: `phone-${e.id}-${start.getTime()}`,
      titulo: e.title || 'Compromisso',
      date: localTodayIso(start),
      inicio: e.allDay ? null : start.getHours() * 60 + start.getMinutes(),
      fim: e.allDay ? null : sameDay ? end.getHours() * 60 + end.getMinutes() : 24 * 60,
      allDay: Boolean(e.allDay),
      busy: e.availability !== Calendar.Availability.FREE,
      local: e.location || null,
      origem: 'Celular',
    }
  })
}

/** Grava na agenda do celular (Google Agenda, Samsung, etc.), sem abrir o despertador. */
export async function addPhoneCalendarEvent(input: {
  title: string
  date: string
  horaMinutos: number | null
  minutes: number
}): Promise<boolean>
{
  const title = input.title.trim()
  if (!title) return false
  const perm = await Calendar.requestCalendarPermissionsAsync()
  if (perm.status !== 'granted') return false

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)
  const target = calendars.find((c) => c.allowsModifications && c.isPrimary)
    ?? calendars.find((c) => c.allowsModifications)
  if (!target) return false

  const [y, m, d] = input.date.split('-').map(Number)
  if (!y || !m || !d) return false
  const hora = input.horaMinutos
  const allDay = hora == null
  const start = allDay
    ? new Date(y, m - 1, d, 0, 0, 0, 0)
    : new Date(y, m - 1, d, Math.floor(hora / 60), hora % 60, 0, 0)
  const end = allDay
    ? new Date(y, m - 1, d, 23, 59, 0, 0)
    : new Date(start.getTime() + Math.max(15, input.minutes) * 60 * 1000)

  await Calendar.createEventAsync(target.id, {
    title,
    startDate: start,
    endDate: end,
    allDay,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    alarms: allDay || Platform.OS !== 'ios' ? [] : [{ relativeOffset: -10 }],
  })
  return true
}
