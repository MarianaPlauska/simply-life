import { cardLimitUsagePct, sumOpenInvoiceSpend } from '../../lib/financeCardSpend'
import {
  CARD_USAGE_BAR_CLASS,
  CARD_USAGE_TEXT_CLASS,
  resolveCardUsageToneFromSpend,
} from '../../lib/financeBalanceTone'
import type { Transaction, VirtualCard } from '../../store/storeTypes'
import {
  AXEL_PROGRESS_THICK,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface CardSpendProgressProps
{
  card: VirtualCard
  transactions: Transaction[]
  compact?: boolean
}

export function CardSpendProgress({ card, transactions, compact = false }: CardSpendProgressProps)
{
  const spent = sumOpenInvoiceSpend(transactions, card)
  const pct = cardLimitUsagePct(transactions, card)
  const available = Math.max(0, card.limite - spent)

  const usageTone = resolveCardUsageToneFromSpend(spent, card.limite)
  const barTone = CARD_USAGE_BAR_CLASS[usageTone]
  const pctTone = CARD_USAGE_TEXT_CLASS[usageTone]

  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      <div className="flex justify-between items-baseline gap-2 font-mono text-[10px]">
        <span className={AXEL_TEXT_SECONDARY}>
          {fmt(spent)} de {fmt(card.limite)}
        </span>
        <span className={pctTone}>
          {usageTone === 'exhausted' ? '100%' : `${pct.toFixed(0)}%`}
        </span>
      </div>
      <div className={AXEL_PROGRESS_THICK}>
        <div
          className={`h-full rounded-sl transition-all duration-300 ${barTone}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {!compact && (
        <p className={`font-mono text-[9px] ${AXEL_TEXT_SECONDARY}`}>
          Disponível {fmt(available)}
        </p>
      )}
    </div>
  )
}
