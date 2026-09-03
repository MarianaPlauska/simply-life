// slice de calendário - OAuth Google (Calendar + Gmail) via API Vercel
import type { StateCreator } from 'zustand'
import type { CalendarEvent } from '../storeTypes'
import {
  completeGoogleOAuth,
  disconnectGoogle,
  fetchGoogleStatus,
  startGoogleOAuth,
} from '../../lib/googleIntegrationApi'

export interface CalendarSlice
{
  calendarEvents: CalendarEvent[]
  calendarLoading: boolean
  calendarError: string | null
  googleCalendarConnected: boolean
  lastGmailSyncAt: string | null
  fetchCalendarEvents: () => Promise<void>
  connectGoogleCalendar: () => Promise<void>
  disconnectGoogleCalendar: () => Promise<void>
  checkGoogleStatus: () => Promise<void>
  processGoogleCallback: (code: string, state: string | null) => Promise<boolean>
}

export const createCalendarSlice: StateCreator<CalendarSlice, [], [], CalendarSlice> = (set) => ({
  calendarEvents: [],
  calendarLoading: false,
  calendarError: null,
  googleCalendarConnected: false,
  lastGmailSyncAt: null,

  fetchCalendarEvents: async () =>
  {
    set({ calendarLoading: false, calendarError: null, calendarEvents: [] })
  },

  connectGoogleCalendar: async () =>
  {
    const url = await startGoogleOAuth()
    window.location.href = url
  },

  disconnectGoogleCalendar: async () =>
  {
    await disconnectGoogle()
    set({
      googleCalendarConnected: false,
      lastGmailSyncAt: null,
      calendarEvents: [],
    })
  },

  checkGoogleStatus: async () =>
  {
    try
    {
      const status = await fetchGoogleStatus()
      set({
        googleCalendarConnected: status.connected,
        lastGmailSyncAt: status.last_gmail_sync_at,
      })
    }
    catch
    {
      set({ googleCalendarConnected: false, lastGmailSyncAt: null })
    }
  },

  processGoogleCallback: async (code, state) =>
  {
    const ok = await completeGoogleOAuth(code, state)
    if (ok)
    {
      set({ googleCalendarConnected: true })
    }
    return ok
  },
})
