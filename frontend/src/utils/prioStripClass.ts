/** Traço de prioridade — design linha (§2.4) */
export function prioStripClass(prio: string | undefined): string
{
  if (prio === 'critica')
  {
    return 'border-l-red-500'
  }
  if (prio === 'alta')
  {
    return 'border-l-amber-500'
  }
  if (prio === 'media')
  {
    return 'border-l-indigo-500'
  }
  return 'border-l-zinc-700'
}
