import { useEffect } from 'react'
import { create } from 'zustand'
import { readPersisted, writePersisted } from '../lib/persistStorage'

/** "Conectar depois": esconde o convite para conectar a agenda por um tempo, sem cobrança. */
const KEY = 'simply-life-agenda-prompt-until'
const SNOOZE_DAYS = 30

type State = {
  hydrated: boolean
  /** até quando o convite fica escondido (ms desde 1970) */
  snoozedUntil: number | null
  hydrate: () => Promise<void>
  snooze: () => void
}

export const useAgendaPromptStore = create<State>((set, get) => ({
  hydrated: false,
  snoozedUntil: null,
  hydrate: async () =>
  {
    if (get().hydrated) return
    const raw = await readPersisted(KEY)
    const n = raw ? Number(raw) : NaN
    set({ hydrated: true, snoozedUntil: Number.isFinite(n) ? n : null })
  },
  snooze: () =>
  {
    const until = Date.now() + SNOOZE_DAYS * 86400000
    set({ snoozedUntil: until })
    void writePersisted(KEY, String(until))
  },
}))

/** true quando o convite de conectar agenda pode aparecer */
export function useShowAgendaPrompt(): boolean
{
  const hydrated = useAgendaPromptStore((s) => s.hydrated)
  const until = useAgendaPromptStore((s) => s.snoozedUntil)
  const hydrate = useAgendaPromptStore((s) => s.hydrate)
  useEffect(() =>
  {
    if (!hydrated) void hydrate()
  }, [hydrated, hydrate])
  return !(until && until > Date.now())
}
