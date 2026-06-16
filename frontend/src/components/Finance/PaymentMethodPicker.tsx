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
import { cardChipClass } from '../../lib/financeCardTheme'
import {
  EXPENSE_CASH_METHODS,
  INCOME_METHODS,
  PAYMENT_METHOD_LABELS,
  type FinancePaymentMethod,
} from '../../lib/financePaymentMethod'
import {
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
  AXEL_TEXT_SECONDARY,
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
    `inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-sl font-mono text-[10px] uppercase ${
      active ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
    }`

  return (
    <div className="space-y-3">
      <div>
        <p className={`font-mono text-[9px] uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>
          {variant === 'receita' ? 'Conta que recebeu' : 'Conta / dinheiro'}
        </p>
        <p className={`text-[10px] mb-2 ${AXEL_TEXT_SECONDARY}`}>
          {variant === 'receita'
            ? 'Onde o dinheiro caiu — soma ao saldo.'
            : 'Desconta da conta corrente na hora.'}
        </p>
        <div className="flex flex-wrap gap-1.5">
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
                <Icon size={12} />
                {PAYMENT_METHOD_LABELS[method as FinancePaymentMethod]}
              </button>
            )
          })}
        </div>
      </div>

      {variant === 'despesa' && activeCards.length > 0 && (
        <div>
          <p className={`font-mono text-[9px] uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>
            Cartão de crédito
          </p>
          <p className={`text-[10px] mb-2 ${AXEL_TEXT_SECONDARY}`}>
            Vai para a fatura do cartão — não desconta o saldo agora.
          </p>
          <div className="flex flex-col gap-1.5">
            {activeCards.map((card) =>
            {
              const selected = value === card.id
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onChange(card.id)}
                  className={`w-full min-h-[44px] justify-start ${cardChipClass(card, selected)}`}
                >
                  <CreditCard size={12} className="shrink-0 opacity-70" />
                  <span className="truncate">{card.nome}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
