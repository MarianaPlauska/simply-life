import type { TccRecentItem } from '../../../lib/tccPersist'

/** Rótulos dos registros de TCC (usados no Apoio do celular e do computador). */
export function recentLabel(item: TccRecentItem): string
{
  if (item.kind === 'thought')
  {
    return item.entry.automaticThought.trim() || item.entry.situation.trim() || 'Registro de pensamento'
  }
  if (item.kind === 'behavior')
  {
    return item.entry.action.trim() || 'Ativação comportamental'
  }
  const step = item.entry.steps.find((s) => s.id === item.entry.chosenStepId)
  return step?.label.trim() || item.entry.situation.trim() || 'Exposição gradual'
}

export function recentKindLabel(item: TccRecentItem): string
{
  if (item.kind === 'thought') return 'Pensamento'
  if (item.kind === 'behavior') return 'Ativação'
  return 'Exposição'
}
