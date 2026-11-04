import { create } from 'zustand'
import {
  addDaysToIso,
  expandBlocos,
  fitFlexiveis,
  minutesToLabel,
  todayIso,
  type Bloco,
  type BlocoMarca,
  type BlocoStatus,
  type CalendarEvent,
} from '@simply-life/shared'
import { readPersisted, writePersisted } from '../lib/persistStorage'
import { archiveBloco, fetchBlocos, upsertBloco, upsertMarca } from '../lib/sync/blocos'
import { scheduleBlocoReminders, type BlocoReminder } from '../lib/pushNotifications'
import { friendlyError } from '../lib/friendlyError'
import { useAuthStore } from './authStore'
import { readPhoneCalendarEvents } from '../lib/phoneCalendar'

const KEY = 'simply-life-mundo-v1'

type State = {
  blocos: Bloco[]
  marcas: BlocoMarca[]
  loaded: boolean
  error: string | null
  hydrate: () => Promise<void>
  save: (b: Bloco) => Promise<void>
  remove: (id: string) => Promise<void>
  mark: (blocoId: string, dia: string, patch: { status?: BlocoStatus | null; horaMinutos?: number | null }) => Promise<void>
  clearError: () => void
  /** agenda do celular (só app instalado), próximos 14 dias */
  phoneEvents: CalendarEvent[]
  phoneLinked: boolean
  loadPhoneEvents: (ask?: boolean) => Promise<void>
  /** encaixa os flexíveis do dia nos espaços livres; devolve quantos mudaram */
  fitDia: (dia: string, events: CalendarEvent[]) => Promise<number>
}

export function newBlocoId(): string
{
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  if (c?.randomUUID) return c.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) =>
  {
    const n = Math.floor(Math.random() * 16)
    return (ch === 'x' ? n : (n & 0x3) | 0x8).toString(16)
  })
}

function isGuest(): boolean
{
  return useAuthStore.getState().isGuest
}

function reminders(blocos: Bloco[], marcas: BlocoMarca[]): BlocoReminder[]
{
  const from = todayIso()
  const out: BlocoReminder[] = []
  for (const o of expandBlocos(blocos, marcas, from, addDaysToIso(from, 6)))
  {
    if (o.inicio == null || o.status) continue
    const [y, m, d] = o.dia.split('-').map(Number)
    const start = new Date(y, m - 1, d, 0, o.inicio)
    const url = `/kanban?hub=mundo&dia=${o.dia}`
    if (o.bloco.avisoMinutos != null)
    {
      out.push({
        key: `${o.bloco.id}-${o.dia}-a`,
        at: new Date(start.getTime() - o.bloco.avisoMinutos * 60000),
        title: o.bloco.avisoMinutos === 0 ? `Agora: ${o.bloco.titulo}` : `Daqui a ${o.bloco.avisoMinutos} min: ${o.bloco.titulo}`,
        body: `${minutesToLabel(o.inicio)} às ${minutesToLabel(o.fim ?? o.inicio)}`,
        url,
      })
    }
    if (o.bloco.avisoFim && o.fim != null)
    {
      out.push({
        key: `${o.bloco.id}-${o.dia}-f`,
        at: new Date(start.getTime() + o.bloco.duracaoMinutos * 60000),
        title: `E aí, deu para fazer ${o.bloco.titulo}?`,
        body: 'Toque para marcar. Se não deu, tudo bem, a gente encaixa de novo.',
        url,
      })
    }
  }
  return out
}

export const useMeuMundoStore = create<State>((set, get) =>
{
  const persist = async () =>
  {
    const { blocos, marcas } = get()
    await writePersisted(KEY, JSON.stringify({ blocos, marcas })).catch(() => undefined)
    void scheduleBlocoReminders(reminders(blocos, marcas)).catch(() => undefined)
  }

  const remote = async (fn: () => Promise<void>) =>
  {
    if (isGuest()) return
    try
    {
      await fn()
    }
    catch (e)
    {
      set({ error: friendlyError(e) })
    }
  }

  return {
    blocos: [],
    marcas: [],
    loaded: false,
    error: null,

    hydrate: async () =>
    {
      try
      {
        const raw = await readPersisted(KEY)
        if (raw)
        {
          const parsed = JSON.parse(raw) as { blocos?: Bloco[]; marcas?: BlocoMarca[] }
          set({ blocos: parsed.blocos ?? [], marcas: parsed.marcas ?? [] })
        }
      }
      catch
      {
        // cache corrompido: começa do banco
      }
      if (!isGuest())
      {
        try
        {
          set(await fetchBlocos())
        }
        catch (e)
        {
          set({ error: friendlyError(e, 'Não foi possível carregar o Meu Mundo.') })
        }
      }
      set({ loaded: true })
      void get().loadPhoneEvents(false)
      await persist()
    },

    save: async (b) =>
    {
      const exists = get().blocos.some((x) => x.id === b.id)
      set({ blocos: exists ? get().blocos.map((x) => (x.id === b.id ? b : x)) : [...get().blocos, b] })
      await persist()
      await remote(() => upsertBloco(b))
    },

    remove: async (id) =>
    {
      set({ blocos: get().blocos.filter((x) => x.id !== id), marcas: get().marcas.filter((m) => m.blocoId !== id) })
      await persist()
      await remote(() => archiveBloco(id))
    },

    mark: async (blocoId, dia, patch) =>
    {
      const prev = get().marcas.find((m) => m.blocoId === blocoId && m.dia === dia)
      const next: BlocoMarca = {
        blocoId,
        dia,
        status: patch.status !== undefined ? patch.status : prev?.status ?? null,
        horaMinutos: patch.horaMinutos !== undefined ? patch.horaMinutos : prev?.horaMinutos ?? null,
      }
      set({ marcas: [...get().marcas.filter((m) => m !== prev), next] })
      await persist()
      await remote(() => upsertMarca(next))
    },

    clearError: () => set({ error: null }),

    phoneEvents: [],
    phoneLinked: false,

    loadPhoneEvents: async (ask = false) =>
    {
      try
      {
        const from = addDaysToIso(todayIso(), -7)
        const events = await readPhoneCalendarEvents(from, addDaysToIso(from, 28), ask)
        if (events) set({ phoneEvents: events, phoneLinked: true })
      }
      catch
      {
        // sem módulo de agenda no aparelho
      }
    },

    fitDia: async (dia, events) =>
    {
      const now = new Date()
      const from = dia === todayIso() ? Math.ceil((now.getHours() * 60 + now.getMinutes()) / 15) * 15 : undefined
      const occ = expandBlocos(get().blocos, get().marcas, dia, dia)
      const moves = fitFlexiveis(dia, occ, events, { from })
      for (const m of moves) await get().mark(m.blocoId, dia, { horaMinutos: m.horaMinutos })
      return moves.length
    },
  }
})
