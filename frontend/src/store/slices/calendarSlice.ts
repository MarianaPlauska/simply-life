// slice de calendário — placeholder (google calendar adiado)
import type { StateCreator } from 'zustand'
import type { CalendarEvent } from '../storeTypes'

export interface CalendarSlice
{
  calendarEvents: CalendarEvent[]
  calendarLoading: boolean
  calendarError: string | null
  googleCalendarConnected: boolean
  fetchCalendarEvents: () => Promise<void>
  connectGoogleCalendar: () => Promise<void>
  disconnectGoogleCalendar: () => Promise<void>
  checkGoogleStatus: () => Promise<void>
  processGoogleCallback: (code: string) => Promise<boolean>
}

export const createCalendarSlice: StateCreator<CalendarSlice, [], [], CalendarSlice> = (set) => ({
  calendarEvents: [],
  calendarLoading: false,
  calendarError: null,
  googleCalendarConnected: false,

  fetchCalendarEvents: async () =>
  {
    // google calendar será integrado via supabase oauth futuramente
    set({ calendarLoading: false, calendarError: null, calendarEvents: [] })
  },

  connectGoogleCalendar: async () =>
  {
    // placeholder — precisa configurar provider no supabase dashboard
    const { toast } = await import('sonner')
    toast.info('Google Calendar será configurado em breve')
  },

  disconnectGoogleCalendar: async () =>
  {
    set({ googleCalendarConnected: false, calendarEvents: [] })
  },

  checkGoogleStatus: async () =>
  {
    // sempre false até configurar
    set({ googleCalendarConnected: false })
  },

  processGoogleCallback: async () =>
  {
    return false
  },
})
