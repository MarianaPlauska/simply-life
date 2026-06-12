import {
  ArrowLeftRight,
  Banknote,
  CreditCard,
  FileText,
  MoreHorizontal,
  QrCode,
  Wallet,
} from 'lucide-react'
import type { VirtualCard } from '../../store/storeTypes'
import { cardChipClass, CARD_CHIP_STYLES } from '../../lib/financeCardTheme'
import {
  EXPENSE_CASH_METHODS,
  INCOME_METHODS,
  PAYMENT_METHOD_LABELS,
  type FinancePaymentMethod,
} from '../../lib/financePaymentMethod'
import {
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
} from '../../constants/axelSurfaces'

const CASH_ICONS: Record<string, typeof QrCode> = {
  pix: QrCode,
  debito: Wallet,
  dinheiro: Banknote,
  boleto: FileText,
  ted: ArrowLeftRight,
  outro: MoreHorizontal,
}

interface PaymentMethodPickerProps
{
  cards: VirtualCard[]
  value: string
  onChange: (payment: string) => void
  variant?: 'despesa' | 'receita'
}

export function PaymentMethodPicker({
  cards,
  value,
  onChange,
  variant = 'despesa',
}: PaymentMethodPickerProps)
{
  const activeCards = cards.filter((c) => c.status === 'ativo')
  const cashMethods = variant === 'receita' ? INCOME_METHODS : EXPENSE_CASH_METHODS

  const pillClass = (active: boolean) =>
    `shrink-0 inline-flex items-center justify-center gap-1.5 uppercase min-h-[44px] px-2.5 ${
      active ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
    }`

  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 w-full">
      {cashMethods.map((method) =>
      {
        const Icon = CASH_ICONS[method] ?? Wallet
        const active = value === method
        return (
          <button
            key={method}
            type="button"
            onClick={() => onChange(method)}
            className={pillClass(active)}
          >
            <Icon size={12} className={method === 'pix' ? 'text-accent' : undefined} />
            {PAYMENT_METHOD_LABELS[method as FinancePaymentMethod]}
          </button>
        )
      })}

      {variant === 'despesa' && activeCards.map((card) =>
      {
        const selected = value === card.id
        const dotClass = CARD_CHIP_STYLES[card.tipo_gradiente].dot
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onChange(card.id)}
            className={`col-span-2 sm:col-span-1 min-h-[44px] ${cardChipClass(card, selected)}`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} aria-hidden />
            <CreditCard size={12} className="shrink-0 opacity-70" />
            <span className="truncate max-w-[140px]">{card.nome}</span>
          </button>
        )
      })}
    </div>
  )
}
