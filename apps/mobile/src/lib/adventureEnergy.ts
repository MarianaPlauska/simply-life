import { ENERGY_FILL, type EnergyKind } from '@simply-life/shared'
import { usePlayStore } from '../store/playStore'
import { usePrefsStore } from '../store/prefsStore'

/** Enche a energia só no modo aventura. Não mexe em XP, moeda ou Elo. */
export function fillAdventureEnergy(kind: EnergyKind): void
{
  if (usePrefsStore.getState().prefs.gamification_mode !== 'rpg') return
  usePlayStore.getState().fillEnergy(ENERGY_FILL[kind])
}
