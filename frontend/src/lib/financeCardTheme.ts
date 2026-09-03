import type { VirtualCard } from '../store/storeTypes'

/** Cores dos chips de pagamento - espelha o visual do cartão cadastrado */
export const CARD_CHIP_STYLES: Record<
  VirtualCard['tipo_gradiente'],
  { dot: string; activeBorder: string; activeBg: string }
> = {
  purple: {
    dot: 'bg-violet-500',
    activeBorder: 'border-violet-500/50',
    activeBg: 'bg-gradient-to-r from-violet-900/35 via-indigo-950/25 to-transparent',
  },
  obsidian: {
    dot: 'bg-zinc-400',
    activeBorder: 'border-zinc-500/50',
    activeBg: 'bg-gradient-to-r from-zinc-800/50 via-zinc-950/30 to-transparent',
  },
  sunset: {
    dot: 'bg-rose-500',
    activeBorder: 'border-rose-500/50',
    activeBg: 'bg-gradient-to-r from-rose-900/35 via-amber-950/25 to-transparent',
  },
  ocean: {
    dot: 'bg-sky-500',
    activeBorder: 'border-sky-500/50',
    activeBg: 'bg-gradient-to-r from-sky-900/35 via-cyan-950/25 to-transparent',
  },
  mint: {
    dot: 'bg-emerald-500',
    activeBorder: 'border-emerald-500/50',
    activeBg: 'bg-gradient-to-r from-emerald-900/35 via-teal-950/25 to-transparent',
  },
}

export function cardChipClass(card: VirtualCard, selected: boolean): string
{
  const s = CARD_CHIP_STYLES[card.tipo_gradiente]
  if (selected)
  {
    return `inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sl font-mono text-[10px] uppercase max-w-full border ${s.activeBorder} ${s.activeBg} text-ink`
  }
  return 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sl font-mono text-[10px] uppercase max-w-full border border-line bg-chrome/50 text-ink-muted hover:bg-chrome hover:text-ink'
}
