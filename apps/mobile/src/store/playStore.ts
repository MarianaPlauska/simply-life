import { create } from 'zustand'
import {
  beatPersonalRecord,
  fillEnergy,
  localTodayIso,
  mergeRecordBoard,
  pickChestPrize,
  pickDailyMissions,
  settleAxelEnergy,
  type AxelEnergyState,
  type ChestPrize,
  type DailyMission,
  type DayCard,
  type MissionHabits,
  type RecordBeat,
  type RecordBoard,
} from '@simply-life/shared'
import { persistStorage } from '../lib/persistStorage'
import { useGamificationStore } from './gamificationStore'
import { usePrefsStore } from './prefsStore'

const CARDS_KEY = 'simply-life-play-cards'
const DAY_KEY = 'simply-life-play-day'
const RECORDS_KEY = 'simply-life-play-records'
const WEEK_KEY = 'simply-life-play-week'
const BEAT_KEY = 'simply-life-play-beat'
const CARD_CLOSED_KEY = 'simply-life-play-card-closed'
const ENERGY_KEY = 'simply-life-play-energy'

export const PLAY_LOCAL_KEYS = [CARDS_KEY, DAY_KEY, RECORDS_KEY, WEEK_KEY, BEAT_KEY, CARD_CLOSED_KEY, ENERGY_KEY] as const

export type SavedCard = DayCard & { day: string }

type DayState = {
  day: string
  missions: DailyMission[]
  chestOpened: boolean
}

type PlayState = {
  cards: SavedCard[]
  day: DayState | null
  records: RecordBoard | null
  weekDismissed: string | null
  cardClosedOn: string | null
  energy: number
  energyDay: string | null
  energyDippedOn: string | null
  party: RecordBeat | null
  ready: boolean
  hydrate: () => void
  reveal: (card: DayCard) => void
  ensureMissions: (today: string, habits: MissionHabits) => void
  openChest: (today: string) => ChestPrize | null
  observeRecords: (now: RecordBoard, quiet: boolean) => void
  dismissParty: () => void
  dismissWeek: (sundayId: string) => void
  closeCard: (today: string) => void
  fillEnergy: (amount: number) => void
  settleEnergy: (today: string, hour: number, actedToday: boolean) => void
  reset: () => void
}

function readEnergy(): AxelEnergyState
{
  const raw = readJson<Partial<AxelEnergyState>>(ENERGY_KEY, {})
  return {
    energy: typeof raw.energy === 'number' ? raw.energy : 100,
    day: typeof raw.day === 'string' ? raw.day : null,
    dippedOn: typeof raw.dippedOn === 'string' ? raw.dippedOn : null,
  }
}

function writeEnergy(state: AxelEnergyState): void
{
  persistStorage.setItem(ENERGY_KEY, JSON.stringify(state))
}

function readJson<T>(key: string, fallback: T): T
{
  try
  {
    const raw = persistStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  }
  catch
  {
    return fallback
  }
}

export const usePlayStore = create<PlayState>((set, get) => ({
  cards: [],
  day: null,
  records: null,
  weekDismissed: null,
  cardClosedOn: null,
  energy: 100,
  energyDay: null,
  energyDippedOn: null,
  party: null,
  ready: false,

  hydrate: () =>
  {
    const saved = readEnergy()
    set({
      cards: readJson<SavedCard[]>(CARDS_KEY, []),
      day: readJson<DayState | null>(DAY_KEY, null),
      records: readJson<RecordBoard | null>(RECORDS_KEY, null),
      weekDismissed: persistStorage.getItem(WEEK_KEY),
      cardClosedOn: persistStorage.getItem(CARD_CLOSED_KEY),
      energy: saved.energy,
      energyDay: saved.day,
      energyDippedOn: saved.dippedOn,
      party: null,
      ready: true,
    })
  },

  reveal: (card) =>
  {
    if (get().cards.some((c) => c.id === card.id)) return
    const cards = [{ ...card, day: card.id.slice(0, 10) }, ...get().cards]
    persistStorage.setItem(CARDS_KEY, JSON.stringify(cards))
    set({ cards })
  },

  ensureMissions: (today, habits) =>
  {
    if (get().day?.day === today) return
    const day: DayState = { day: today, missions: pickDailyMissions(habits), chestOpened: false }
    persistStorage.setItem(DAY_KEY, JSON.stringify(day))
    set({ day })
  },

  openChest: (today) =>
  {
    const day = get().day
    if (!day || day.day !== today || day.chestOpened) return null
    const owned = useGamificationStore.getState().owned
    const prize = pickChestPrize(today, owned)
    if (prize.kind === 'gold') useGamificationStore.getState().grantGold(prize.amount)
    else
    {
      useGamificationStore.getState().addOwned(prize.id)
      const worn = usePrefsStore.getState().prefs.axel_accessory
      if (!worn) void usePrefsStore.getState().patch({ axel_accessory: prize.id })
    }
    const next = { ...day, chestOpened: true }
    persistStorage.setItem(DAY_KEY, JSON.stringify(next))
    set({ day: next })
    return prize
  },

  observeRecords: (now, quiet) =>
  {
    const saved = get().records
    if (!saved)
    {
      persistStorage.setItem(RECORDS_KEY, JSON.stringify(now))
      set({ records: now })
      return
    }
    const beat = beatPersonalRecord(now, saved)
    const next = mergeRecordBoard(now, saved)
    const same = next.elo === saved.elo && next.tasksDay === saved.tasksDay && next.waterWeek === saved.waterWeek
    if (same) return
    const id = beat ? `${beat.kind}:${beat.value}` : ''
    const seen = persistStorage.getItem(BEAT_KEY)
    const show = Boolean(beat && !quiet && id !== seen)
    persistStorage.setItem(RECORDS_KEY, JSON.stringify(next))
    if (show) persistStorage.setItem(BEAT_KEY, id)
    set({ records: next, party: show && beat ? beat : get().party })
  },

  dismissParty: () => set({ party: null }),

  dismissWeek: (sundayId) =>
  {
    persistStorage.setItem(WEEK_KEY, sundayId)
    set({ weekDismissed: sundayId })
  },

  closeCard: (today) =>
  {
    persistStorage.setItem(CARD_CLOSED_KEY, today)
    set({ cardClosedOn: today })
  },

  fillEnergy: (amount) =>
  {
    const today = localTodayIso()
    const saved = { energy: get().energy, day: get().energyDay, dippedOn: get().energyDippedOn }
    const settled = settleAxelEnergy(saved, { today, hour: new Date().getHours(), actedToday: true })
    const energy = fillEnergy(settled.energy, amount)
    const state = { energy, day: today, dippedOn: settled.dippedOn }
    if (state.energy === saved.energy && state.day === saved.day && state.dippedOn === saved.dippedOn) return
    writeEnergy(state)
    set({ energy: state.energy, energyDay: state.day, energyDippedOn: state.dippedOn })
  },

  settleEnergy: (today, hour, actedToday) =>
  {
    const saved = { energy: get().energy, day: get().energyDay, dippedOn: get().energyDippedOn }
    const next = settleAxelEnergy(saved, { today, hour, actedToday })
    if (next.energy === saved.energy && next.day === saved.day && next.dippedOn === saved.dippedOn) return
    writeEnergy(next)
    set({ energy: next.energy, energyDay: next.day, energyDippedOn: next.dippedOn })
  },

  reset: () =>
  {
    for (const key of PLAY_LOCAL_KEYS) persistStorage.removeItem(key)
    set({ cards: [], day: null, records: null, weekDismissed: null, cardClosedOn: null, energy: 100, energyDay: null, energyDippedOn: null, party: null, ready: true })
  },
}))
