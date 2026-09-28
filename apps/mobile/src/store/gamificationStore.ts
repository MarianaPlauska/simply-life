import { create } from 'zustand'
import { isPersistReady, persistStorage, runHydrated, whenPersistReady } from '../lib/persistStorage'
import {
  capXpGrant,
  levelFromTotalXp,
  xpProgressInLevel,
  STARTER_ACHIEVEMENTS,
  REWARD_SHOP,
  appendHistory,
  nextMilestone,
  localTodayIso,
  type AxelHistoryEvent,
  type Achievement,
} from '@simply-life/shared'

const XP_KEY = 'simply-life-xp-total'
const GOLD_KEY = 'simply-life-gold'
const UNLOCK_KEY = 'simply-life-achievements'
const OWNED_KEY = 'simply-life-shop-owned'
const HIST_KEY = 'simply-life-axel-history'
const STREAK_KEY = 'simply-life-streak'
const STREAK_DAY_KEY = 'simply-life-streak-day'

const storage = persistStorage
let loaded = false

function readNum(key: string, fallback = 0): number
{
  const raw = storage.getItem(key)
  const n = raw ? parseInt(raw, 10) : fallback
  return Number.isFinite(n) ? n : fallback
}

function readList(key: string): string[]
{
  try
  {
    const raw = storage.getItem(key)
    return raw ? (JSON.parse(raw) as string[]) : []
  }
  catch
  {
    return []
  }
}

function readHistory(): AxelHistoryEvent[]
{
  try
  {
    const raw = storage.getItem(HIST_KEY)
    return raw ? (JSON.parse(raw) as AxelHistoryEvent[]) : []
  }
  catch
  {
    return []
  }
}

type Celebration = { title: string; body: string } | null

type GamificationState = {
  totalXp: number
  gold: number
  unlocked: string[]
  owned: string[]
  history: AxelHistoryEvent[]
  streak: number
  celebration: Celebration
  hydrate: () => void
  grantXp: (amount: number, title: string, detail?: string) => number
  unlockIf: (id: string) => void
  buyItem: (id: string, cost: number) => { ok: boolean; message: string }
  bumpStreak: () => void
  dismissCelebration: () => void
  logEvent: (kind: AxelHistoryEvent['kind'], title: string, detail?: string) => void
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  totalXp: 0,
  gold: 0,
  unlocked: [],
  owned: [],
  history: [],
  streak: 0,
  celebration: null,

  hydrate: () =>
  {
    if (!isPersistReady())
    {
      void whenPersistReady().then(() => get().hydrate())
      return
    }
    loaded = true
    set({
      totalXp: readNum(XP_KEY),
      gold: readNum(GOLD_KEY),
      unlocked: readList(UNLOCK_KEY),
      owned: readList(OWNED_KEY),
      history: readHistory(),
      streak: readNum(STREAK_KEY),
    })
  },

  grantXp: (amount, title, detail) =>
  {
    // ainda carregando do disco: concede logo depois (retorno 0 só nesse instante inicial)
    if (!runHydrated(() => loaded, () => get().hydrate(), () => void get().grantXp(amount, title, detail))) return 0
    const { granted } = capXpGrant(storage, amount)
    if (granted <= 0) return 0
    const totalXp = get().totalXp + granted
    const gold = get().gold + Math.max(1, Math.round(granted / 4))
    storage.setItem(XP_KEY, String(totalXp))
    storage.setItem(GOLD_KEY, String(gold))
    const history = appendHistory(get().history, {
      kind: 'xp',
      title,
      detail: detail ?? `+${granted} XP`,
    })
    storage.setItem(HIST_KEY, JSON.stringify(history))
    set({
      totalXp,
      gold,
      history,
    })
    return granted
  },

  unlockIf: (id) =>
  {
    if (!runHydrated(() => loaded, () => get().hydrate(), () => get().unlockIf(id))) return
    if (get().unlocked.includes(id)) return
    const ach: Achievement | undefined = STARTER_ACHIEVEMENTS.find((a) => a.id === id)
    if (!ach) return
    const unlocked = [...get().unlocked, id]
    storage.setItem(UNLOCK_KEY, JSON.stringify(unlocked))
    get().grantXp(ach.xpReward, ach.title, ach.description)
    set({ unlocked, celebration: { title: ach.title, body: ach.description } })
  },

  buyItem: (id, cost) =>
  {
    if (!isPersistReady()) return { ok: false, message: 'Carregando, tente de novo' }
    if (!loaded) get().hydrate()
    if (get().owned.includes(id)) return { ok: false, message: 'Já adquirido' }
    if (get().gold < cost) return { ok: false, message: 'Moedas insuficientes' }
    const gold = get().gold - cost
    const owned = [...get().owned, id]
    storage.setItem(GOLD_KEY, String(gold))
    storage.setItem(OWNED_KEY, JSON.stringify(owned))
    const item = REWARD_SHOP.find((s) => s.id === id)
    set({
      gold,
      owned,
      celebration: { title: item?.title ?? 'Recompensa', body: 'Item desbloqueado' },
    })
    return { ok: true, message: 'Comprado' }
  },

  bumpStreak: () =>
  {
    if (!runHydrated(() => loaded, () => get().hydrate(), () => get().bumpStreak())) return
    const today = localTodayIso()
    if (storage.getItem(STREAK_DAY_KEY) === today) return
    const streak = get().streak + 1
    storage.setItem(STREAK_KEY, String(streak))
    storage.setItem(STREAK_DAY_KEY, today)
    set({ streak })
    if (streak >= 3) get().unlockIf('streak_3')
  },

  dismissCelebration: () => set({ celebration: null }),

  logEvent: (kind, title, detail) =>
  {
    if (!runHydrated(() => loaded, () => get().hydrate(), () => get().logEvent(kind, title, detail))) return
    const history = appendHistory(get().history, { kind, title, detail })
    storage.setItem(HIST_KEY, JSON.stringify(history))
    set({ history })
  },
}))

export function gamificationLevel(totalXp: number)
{
  return {
    level: levelFromTotalXp(totalXp),
    ...xpProgressInLevel(totalXp),
    next: nextMilestone(levelFromTotalXp(totalXp)),
  }
}
