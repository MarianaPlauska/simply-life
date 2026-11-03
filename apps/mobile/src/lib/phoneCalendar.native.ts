import * as Calendar from 'expo-calendar'
import { Platform } from 'react-native'

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
