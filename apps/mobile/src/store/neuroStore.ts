import { create } from 'zustand'
import {
  DEFAULT_NEURO_SETTINGS,
  neuroPreset,
  normalizeNeuroSettings,
  type NeuroSettings,
  type NeuroTrait,
} from '@simply-life/shared'
import { readLocalJson, writeLocalJson } from '../lib/localJsonStore'
import { usePrefsStore } from './prefsStore'

const KEY = 'simply-life-neuro-v1'

type State = NeuroSettings & {
  hydrated: boolean
  hydrate: () => Promise<void>
  /** escolhe os traços e aplica o ponto de partida (preset) */
  setTraits: (traits: NeuroTrait[]) => void
  /** ajuste fino de um item, sem mexer nos outros */
  patch: (next: Partial<NeuroSettings>) => void
}

function persist(s: NeuroSettings): void
{
  void writeLocalJson(KEY, normalizeNeuroSettings(s))
}

/** Espelha nas preferências da conta o que já existia lá (movimento reduzido, apoio TDAH). */
function mirrorToPrefs(s: NeuroSettings): void
{
  const prefs = usePrefsStore.getState()
  // TDAH liga o apoio antigo; tirar o traço não desliga (a pessoa pode ter ligado à mão)
  const nextAdhd = s.traits.includes('tdah') || Boolean(prefs.prefs.adhd_support)
  if (Boolean(prefs.prefs.a11y_reduce_motion) !== s.reduceMotion || Boolean(prefs.prefs.adhd_support) !== nextAdhd)
  {
    void prefs.patch({ a11y_reduce_motion: s.reduceMotion, adhd_support: nextAdhd })
  }
}

/** "Meu jeito de funcionar": TDAH, autismo, ansiedade, depressão. Local no aparelho. */
export const useNeuroStore = create<State>((set, get) => ({
  ...DEFAULT_NEURO_SETTINGS,
  hydrated: false,

  hydrate: async () =>
  {
    if (get().hydrated) return
    const saved = await readLocalJson<unknown>(KEY)
    set({ ...normalizeNeuroSettings(saved), hydrated: true })
  },

  setTraits: (traits) =>
  {
    const next = neuroPreset(traits)
    set(next)
    persist(next)
    mirrorToPrefs(next)
  },

  patch: (partial) =>
  {
    const next = normalizeNeuroSettings({ ...get(), ...partial })
    set(next)
    persist(next)
    mirrorToPrefs(next)
  },
}))
