import { CreditCard, Wallet } from 'lucide-react'
import type { VirtualCard } from '../../store/storeTypes'
import { cardChipClass } from '../../lib/financeCardTheme'
import {
  ACCOUNT_PAYMENT_SELECTION,
  isCardPaymentSelection,
} from '../../lib/financePaymentMethod'
import {
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

interface PaymentMethodPickerProps
{
  cards: VirtualCard[]
  value: string
  onChange: (payment: string) => void
  variant?: 'despesa' | 'receita'
}

// Conta corrente (padrão) ou cartão cadastrado — sem PIX/débito/boleto separados

export function PaymentMethodPicker({
  cards,
  value,
  onChange,
  variant = 'despesa',
}: PaymentMethodPickerProps)
{
  const activeCards = cards.filter((c) => c.status === 'ativo')
  const contaSelected = value === ACCOUNT_PAYMENT_SELECTION
    || !isCardPaymentSelection(value, cards)

  if (variant === 'receita')
  {
    return (
      <div className="flex items-start gap-2.5 rounded-sl border border-line bg-chrome/40 px-3 py-2.5">
        <Wallet size={16} className="text-concluido shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className={`text-sm font-medium ${AXEL_TEXT_PRIMARY}`}>Conta corrente</p>
          <p className={`text-[10px] mt-0.5 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
            O valor entra no saldo disponível. Receitas não vão para cartão.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <p className={`font-mono text-[9px] uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>
          Pagar com
        </p>
        <p className={`text-[10px] mb-2 ${AXEL_TEXT_SECONDARY}`}>
          Sem cartão selecionado, desconta da conta corrente (PIX, débito, dinheiro…).
        </p>
        <button
          type="button"
          onClick={() => onChange(ACCOUNT_PAYMENT_SELECTION)}
          className={`w-full min-h-[44px] justify-start inline-flex items-center gap-2 px-3 rounded-sl border font-mono text-[11px] ${
            contaSelected ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
          }`}
        >
          <Wallet size={14} className="shrink-0 opacity-80" />
          <span>Conta corrente</span>
        </button>
      </div>

      {activeCards.length > 0 && (
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
