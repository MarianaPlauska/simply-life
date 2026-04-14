// slice de calendário — google calendar integration
import type { StateCreator } from 'zustand';
import type { CalendarEvent } from '../storeTypes';
import { API, authHeaders } from '../api';

export interface CalendarSlice {
  calendarEvents: CalendarEvent[];
  calendarLoading: boolean;
  calendarError: string | null;
  googleCalendarConnected: boolean;
  fetchCalendarEvents: () => Promise<void>;
  connectGoogleCalendar: () => Promise<void>;
  disconnectGoogleCalendar: () => Promise<void>;
  checkGoogleStatus: () => Promise<void>;
  processGoogleCallback: (code: string) => Promise<boolean>;
}

// precisa do logout do auth slice
type FullGet = () => CalendarSlice & { logout: () => void };

export const createCalendarSlice: StateCreator<CalendarSlice, [], [], CalendarSlice> = (set, get) => ({
  calendarEvents: [],
  calendarLoading: false,
  calendarError: null,
  googleCalendarConnected: false,

  fetchCalendarEvents: async () =>
  {
    if ( get().googleCalendarConnected === false )
    {
      set({ calendarLoading: false, calendarError: null, calendarEvents: [] });
      return;
    }
    set({ calendarLoading: true, calendarError: null });
    try
    {
      const res = await fetch(`${API}/integracoes/calendario/hoje`, { headers: authHeaders() });
      if ( res.status === 401 ) { (get as unknown as FullGet)().logout(); return; }
      if ( !res.ok )
      {
        const body = await res.json().catch(() => ({}));
        const detail = typeof body?.detail === 'string' ? body.detail : '';
        if ( res.status === 403 || detail.toLowerCase().includes('permission') )
        {
          set({ calendarLoading: false, calendarError: '403', googleCalendarConnected: false });
        }
        else
        {
          set({ calendarLoading: false });
        }
        return;
      }
      const data = await res.json();
      set({ calendarEvents: data, calendarLoading: false, calendarError: null, googleCalendarConnected: true });
    }
    catch (err)
    {
      console.error('[fetchCalendarEvents]:', err);
      set({ calendarLoading: false });
    }
  },

  connectGoogleCalendar: async () =>
  {
    try
    {
      const res = await fetch(`${API}/integracoes/google/url`, { headers: authHeaders() });
      if ( !res.ok ) throw new Error('falha');
      const data = await res.json();
      window.location.href = data.url;
    }
    catch (e) { console.error('connectGoogleCalendar:', e); }
  },

  disconnectGoogleCalendar: async () =>
  {
    try
    {
      const res = await fetch(`${API}/integracoes/google/desconectar`, {
        method: 'DELETE', headers: authHeaders(),
      });
      if ( res.ok ) set({ googleCalendarConnected: false, calendarEvents: [] });
    }
    catch (e) { console.error('disconnectGoogleCalendar:', e); }
  },

  checkGoogleStatus: async () =>
  {
    try
    {
      const res = await fetch(`${API}/integracoes/google/status`, { headers: authHeaders() });
      if ( !res.ok ) return;
      const data = await res.json();
      set({ googleCalendarConnected: data.connected });
    }
    catch { /* offline */ }
  },

  processGoogleCallback: async (code) =>
  {
    try
    {
      const res = await fetch(`${API}/integracoes/google/callback`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ code }),
      });
      if ( !res.ok ) return false;
      set({ googleCalendarConnected: true });
      return true;
    }
    catch (err)
    {
      console.error('[processGoogleCallback]:', err);
      return false;
    }
  },
});
