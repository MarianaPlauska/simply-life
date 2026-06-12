import { useMemo } from 'react'
import { CreditCard, Settings2, Wallet } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { buildAccountPanelData } from '../../lib/financeAccountSnapshot'
import { FinanceUpcomingBillsList } from './overview/FinanceUpcomingBillsList'
import {
  BALANCE_TONE_BG,
  BALANCE_TONE_LABEL,
  BALANCE_TONE_TEXT,
} from '../../lib/financeBalanceTone'
import { CARD_CHIP_STYLES } from '../../lib/financeCardTheme'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import type { Transaction } from '../../store/storeTypes'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceBalancePanelProps
{
  transactions: Transaction[]
  onConfigure?: () => void
  onNewBill?: () => void
}

export function FinanceBalancePanel({
  transactions,
  onConfigure,
  onNewBill,
}: FinanceBalancePanelProps)
{
  const cards = useTaskStore((s) => s.cards)
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const reservedBills = useTaskStore((s) => s.reservedBills)

  const panel = useMemo(
    () => buildAccountPanelData(
      transactions,
      cards,
      cashAccount.saldo_inicial,
      reservedBills,
    ),
    [transactions, cards, cashAccount.saldo_inicial, reservedBills],
  )

  return (
    <section className={`${AXEL_BORDERLESS_PANEL} space-y-4`}>
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wallet size={14} className="text-accent" />
          <p className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
            Suas contas · saldo em tempo real
          </p>
        </div>
        {onConfigure && (
          <button
            type="button"
            onClick={onConfigure}
            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-accent hover:underline min-h-[44px] sm:min-h-0 px-2"
          >
            <Settings2 size={11} />
            Configurar
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {panel.snapshots.map((acc) =>
        {
          const card = acc.kind === 'card' ? cards.find((c) => c.id === acc.id) : null
          const Icon = acc.kind === 'cash' ? Wallet : CreditCard
          return (
            <div
              key={acc.id}
              className={`rounded-sl border p-3 ${BALANCE_TONE_BG[acc.tone]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {card && (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${CARD_CHIP_STYLES[card.tipo_gradiente].dot}`} />
                  )}
                  <Icon size={14} className={BALANCE_TONE_TEXT[acc.tone]} />
                  <p className={`text-[12px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>
                    {acc.label}
                  </p>
                </div>
                <span className={`font-mono text-[8px] uppercase shrink-0 ${BALANCE_TONE_TEXT[acc.tone]}`}>
                  {BALANCE_TONE_LABEL[acc.tone]}
                </span>
              </div>
              <p className={`text-xl font-display tabular-nums mt-2 ${BALANCE_TONE_TEXT[acc.tone]}`}>
                {fmt(acc.balance)}
              </p>
              {acc.hint && (
                <p className={`font-mono text-[9px] mt-1 ${AXEL_TEXT_SECONDARY}`}>{acc.hint}</p>
              )}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="border border-line rounded-sl px-3 py-2 bg-chrome/30">
          <span className={AXEL_TEXT_SECONDARY}>Disponível (livre): </span>
          <span className={`font-mono tabular-nums ${AXEL_TEXT_PRIMARY}`}>{fmt(panel.saldoDisponivel)}</span>
        </div>
        <div className="border border-line rounded-sl px-3 py-2 bg-chrome/30">
          <span className={AXEL_TEXT_SECONDARY}>Reservado em faturas: </span>
          <span className="font-mono tabular-nums text-atencao">{fmt(panel.reservaRestante)}</span>
        </div>
      </div>

      <FinanceUpcomingBillsList
        transactions={transactions}
        onNewBill={onNewBill}
      />
    </section>
  )
}
