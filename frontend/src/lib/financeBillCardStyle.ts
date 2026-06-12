import type { ReservedBill, VirtualCard } from '../store/storeTypes'
import type { BillVisualStatus } from './financeBillVisual'

/** Superfície suave da fatura — cor vem do cartão */
export interface BillCardSurface
{
  stripe: string
  border: string
  bg: string
  progress: string
  progressTrack: string
  accent: string
  dot: string
  label: string
}

export const CARD_BILL_SURFACES: Record<VirtualCard['tipo_gradiente'], BillCardSurface> = {
  purple: {
    stripe: 'bg-violet-400/60',
    border: 'border-violet-500/15',
    bg: 'bg-violet-500/[0.03]',
    progress: 'bg-violet-400/45',
    progressTrack: 'bg-violet-500/10',
    accent: 'text-violet-700/80 dark:text-violet-300/80',
    dot: 'bg-violet-400/80',
    label: 'Roxo',
  },
  obsidian: {
    stripe: 'bg-zinc-400/50',
    border: 'border-zinc-500/15',
    bg: 'bg-zinc-500/[0.04]',
    progress: 'bg-zinc-400/40',
    progressTrack: 'bg-zinc-500/10',
    accent: 'text-zinc-600 dark:text-zinc-300/80',
    dot: 'bg-zinc-400/70',
    label: 'Obsidian',
  },
  sunset: {
    stripe: 'bg-rose-400/55',
    border: 'border-rose-500/15',
    bg: 'bg-rose-500/[0.03]',
    progress: 'bg-rose-400/40',
    progressTrack: 'bg-rose-500/10',
    accent: 'text-rose-700/75 dark:text-rose-300/75',
    dot: 'bg-rose-400/75',
    label: 'Sunset',
  },
  ocean: {
    stripe: 'bg-sky-400/55',
    border: 'border-sky-500/15',
    bg: 'bg-sky-500/[0.03]',
    progress: 'bg-sky-400/40',
    progressTrack: 'bg-sky-500/10',
    accent: 'text-sky-700/75 dark:text-sky-300/75',
    dot: 'bg-sky-400/75',
    label: 'Ocean',
  },
  mint: {
    stripe: 'bg-emerald-400/55',
    border: 'border-emerald-500/15',
    bg: 'bg-emerald-500/[0.03]',
    progress: 'bg-emerald-400/40',
    progressTrack: 'bg-emerald-500/10',
    accent: 'text-emerald-700/75 dark:text-emerald-300/75',
    dot: 'bg-emerald-400/75',
    label: 'Mint',
  },
}

export const CASH_BILL_SURFACE: BillCardSurface = {
  stripe: 'bg-accent/35',
  border: 'border-line',
  bg: 'bg-chrome/25',
  progress: 'bg-accent/35',
  progressTrack: 'bg-chrome/60',
  accent: 'text-ink',
  dot: 'bg-accent/50',
  label: 'Conta corrente',
}

/** Badge de situação — discreto, não pinta o card inteiro */
export const STATUS_BADGE_SOFT: Record<BillVisualStatus, string> = {
  tranquila: '',
  vencendo: 'text-atencao/90 border-atencao/20 bg-atencao/[0.06]',
  urgente: 'text-urgente/90 border-urgente/20 bg-urgente/[0.06]',
  consumindo: 'text-ink-muted border-line bg-chrome/40',
  esgotada: 'text-ink-muted border-line bg-chrome/40',
  alerta_itens: 'text-ink-muted border-line bg-chrome/50',
}

export const STATUS_LABEL: Record<BillVisualStatus, string> = {
  tranquila: '',
  vencendo: 'Vence em breve',
  urgente: 'Urgente',
  consumindo: 'Quase no limite',
  esgotada: 'Reserva usada',
  alerta_itens: 'Parcela / atípico',
}

/** Cor da fatura = cartão vinculado; caixa = neutro */
export function resolveBillCardSurface(
  bill: ReservedBill,
  cards: VirtualCard[],
): BillCardSurface
{
  if (!bill.card_id) return CASH_BILL_SURFACE

  const card = cards.find((c) => c.id === bill.card_id)
  if (card) return CARD_BILL_SURFACES[card.tipo_gradiente]

  // Mock sem cartão cadastrado — inferência pelo id legado
  if (bill.card_id.includes('nubank') || bill.card_id.includes('purple'))
  {
    return CARD_BILL_SURFACES.purple
  }
  if (bill.card_id.includes('ocean') || bill.card_id.includes('vivo'))
  {
    return CARD_BILL_SURFACES.ocean
  }
  if (bill.card_id.includes('inter') || bill.card_id.includes('mint'))
  {
    return CARD_BILL_SURFACES.mint
  }
  if (bill.card_id.includes('sunset') || bill.card_id.includes('c6'))
  {
    return CARD_BILL_SURFACES.sunset
  }

  return CASH_BILL_SURFACE
}

export function dueDateTone(days: number): string
{
  if (days < 0 || days <= 3) return 'text-urgente/85'
  if (days <= 7) return 'text-atencao/85'
  return ''
}
