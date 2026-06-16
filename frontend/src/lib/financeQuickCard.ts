// Cartão fixado para lançamento rápido (ex.: VR)

const STORAGE_KEY = 'simply-life-quick-card-id'

export function loadQuickCardId(): string | null
{
  try
  {
    return localStorage.getItem(STORAGE_KEY)
  }
  catch
  {
    return null
  }
}

export function saveQuickCardId(cardId: string): void
{
  localStorage.setItem(STORAGE_KEY, cardId)
}

/** Prioriza VR/vale; senão cartão fixado; senão primeiro ativo */
export function resolveQuickCardId(
  cards: { id: string; nome: string; status: string }[],
): string | null
{
  const active = cards.filter((c) => c.status === 'ativo')
  if (active.length === 0) return null

  const pinned = loadQuickCardId()
  if (pinned && active.some((c) => c.id === pinned))
  {
    return pinned
  }

  const vr = active.find((c) => /vr|vale|refei/i.test(c.nome))
  if (vr) return vr.id

  return active[0]?.id ?? null
}
