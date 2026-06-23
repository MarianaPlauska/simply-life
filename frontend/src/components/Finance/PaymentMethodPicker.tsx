import { CreditCard, Wallet } from 'lucide-react'
import type { VirtualCard } from '../../store/storeTypes'
import { cardChipClass } from '../../lib/financeCardTheme'
import { cardModalidadeLabel } from '../../lib/financeCardModalidade'
import {
  ACCOUNT_PAYMENT_SELECTION,
  isCardPaymentSelection,
} from '../../lib/financePaymentMethod'
import {
  AXEL_FORM_SEG_ACTIVE,
  AXEL_FORM_SEG_IDLE,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

interface PaymentMethodPickerProps
{
  cards: VirtualCard[]
  value: string
  onChange: (payment: string) => void
  variant?: 'despesa' | 'receita'
  /** Texto dinâmico abaixo da seleção */
  hint?: string
}

// Conta corrente (padrão) ou cartão cadastrado

export function PaymentMethodPicker({
  cards,
  value,
  onChange,
  variant = 'despesa',
  hint,
}: PaymentMethodPickerProps)
{
  const activeCards = cards.filter((c) => c.status === 'ativo')
  const contaSelected = value === ACCOUNT_PAYMENT_SELECTION
    || !isCardPaymentSelection(value, cards)

  if (variant === 'receita')
  {
    return (
      <div className="flex items-center gap-2 rounded-sl border border-line bg-chrome/30 px-2.5 py-2">
        <Wallet size={14} className="text-concluido shrink-0" />
        <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
          Entra na conta corrente.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
        Pagar com
      </p>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5 -mx-0.5 px-0.5">
        <button
          type="button"
          onClick={() => onChange(ACCOUNT_PAYMENT_SELECTION)}
          className={`shrink-0 ${contaSelected ? AXEL_FORM_SEG_ACTIVE : AXEL_FORM_SEG_IDLE}`}
        >
          <Wallet size={12} className="shrink-0 opacity-80" />
          <span>Conta corrente</span>
        </button>
        {activeCards.map((card) =>
        {
          const selected = value === card.id
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onChange(card.id)}
              className={`shrink-0 ${cardChipClass(card, selected)}`}
            >
              <CreditCard size={12} className="shrink-0 opacity-70" />
              <span className="truncate max-w-[100px]">{card.nome}</span>
              <span className="font-mono text-[8px] uppercase opacity-70">
                {cardModalidadeLabel(card.modalidade)}
              </span>
            </button>
          )
        })}
      </div>
      {activeCards.length === 0 && (
        <p className={`text-[10px] ${AXEL_TEXT_SECONDARY}`}>
          Cadastre cartões em Contas → Cartões para escolher aqui.
        </p>
      )}
      {hint && (
        <p className={`text-[10px] leading-snug ${AXEL_TEXT_SECONDARY}`}>
          {hint}
        </p>
      )}
    </div>
  )
}
