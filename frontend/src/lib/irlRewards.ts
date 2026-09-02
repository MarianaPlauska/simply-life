export interface IrlReward
{
  id: string
  titulo: string
  custo: number
  claimed: number
}

const KEY = 'axel-recompensas-irl'

export function readIrlRewards(): IrlReward[]
{
  try
  {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as IrlReward[]
    return Array.isArray(parsed) ? parsed : []
  }
  catch
  {
    return []
  }
}

function write(list: IrlReward[]): void
{
  try
  {
    localStorage.setItem(KEY, JSON.stringify(list))
  }
  catch { /* quota */ }
}

export function addIrlReward(titulo: string, custo: number): IrlReward
{
  const item: IrlReward = {
    id: `irl-${Date.now()}`,
    titulo: titulo.trim().slice(0, 80),
    custo: Math.max(1, Math.round(custo)),
    claimed: 0,
  }
  write([...readIrlRewards(), item])
  void import('../store/useTaskStore').then(({ useTaskStore }) =>
  {
    useTaskStore.getState().completeOnboardingStep('recompensa_irl')
  }).catch(() => undefined)
  return item
}

export function claimIrlReward(id: string): IrlReward | null
{
  const list = readIrlRewards()
  const next = list.map((r) => (r.id === id ? { ...r, claimed: r.claimed + 1 } : r))
  write(next)
  return next.find((r) => r.id === id) ?? null
}

export function undoIrlClaim(id: string): IrlReward | null
{
  const list = readIrlRewards()
  const next = list.map((r) => (r.id === id ? { ...r, claimed: Math.max(0, r.claimed - 1) } : r))
  write(next)
  return next.find((r) => r.id === id) ?? null
}
