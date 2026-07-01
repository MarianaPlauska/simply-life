import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CreditCard, Wallet } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import type { BillingCycle } from '../../lib/financeCardCycle'
import type { Category, Transaction, VirtualCard } from '../../store/storeTypes'
import { cardTemCicloFatura, cardUsaExtrato } from '../../lib/financeCardModalidade'
import { buildExtratoLinhas } from '../../lib/financeCardSpend'
import {
  AXEL_BTN_PRIMARY,
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface CardInvoicePanelProps
{
  card: VirtualCard
  cycle: BillingCycle
  invoiceTx: Transaction[]
  invoiceTotal: number
  categories: Category[]
  variant?: 'page' | 'drawer'
}

export function CardInvoicePanel({
  card,
  cycle,
  invoiceTx,
  invoiceTotal,
  categories,
  variant = 'page',
}: CardInvoicePanelProps)
{
  const transactions = useTaskStore((s) => s.transactions)
  const payCardInvoice = useTaskStore((s) => s.payCardInvoice)
  const updateCardBilling = useTaskStore((s) => s.updateCardBilling)

  const temFatura = cardTemCicloFatura(card.modalidade)
  const usaExtrato = cardUsaExtrato(card.modalidade)
  const disponivel = Math.max(0, card.limite - invoiceTotal)
  const inDrawer = variant === 'drawer'

  const [paying, setPaying] = useState(false)
  const [fechamento, setFechamento] = useState(String(card.dia_fechamento ?? cycle.closingDay))
  const [vencimento, setVencimento] = useState(String(card.dia_vencimento ?? cycle.dueDay))

  const extratoLinhas = useMemo(
    () => (usaExtrato ? buildExtratoLinhas(transactions, card) : []),
    [usaExtrato, transactions, card],
  )

  const listaExibir = usaExtrato ? extratoLinhas.map((l) => l.tx) : invoiceTx

  const handlePay = async () =>
  {
    setPaying(true)
    try
    {
      const res = await payCardInvoice(card.id)
      if (res.ok) toast.success(res.message)
      else toast.error(res.message)
    }
    finally
    {
      setPaying(false)
    }
  }

  const saveBilling = () =>
  {
    const f = parseInt(fechamento, 10)
    const v = parseInt(vencimento, 10)
    if (Number.isNaN(f) || Number.isNaN(v) || f < 1 || f > 28 || v < 1 || v > 28)
    {
      toast.error('Use dias entre 1 e 28')
      return
    }
    void updateCardBilling(card.id, f, v)
    toast.success('Dias de fechamento e vencimento salvos')
  }

  const billingSection = temFatura ? (
    <div className="px-3 sm:px-4 py-3 space-y-2">
      <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
        Ciclo da fatura (só cartão de crédito)
      </p>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Fechamento</span>
          <input
            type="number"
            min={1}
            max={28}
            value={fechamento}
            onChange={(e) => setFechamento(e.target.value)}
            className="border border-line rounded-sl bg-chrome px-2 py-2 text-sm font-mono text-ink min-h-[44px]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Vencimento</span>
          <input
            type="number"
            min={1}
            max={28}
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
            className="border border-line rounded-sl bg-chrome px-2 py-2 text-sm font-mono text-ink min-h-[44px]"
          />
        </label>
        <button
          type="button"
          onClick={saveBilling}
          className="col-span-2 font-mono text-[10px] uppercase min-h-[44px] px-3 py-2 border border-line rounded-sl hover:bg-chrome text-ink-muted"
        >
          Salvar dias do ciclo
        </button>
        <button
          type="button"
          disabled={paying || invoiceTotal <= 0}
          onClick={() => void handlePay()}
          className={`col-span-2 inline-flex items-center justify-center gap-1.5 min-h-[44px] font-mono text-[10px] uppercase px-3 py-2 disabled:opacity-40 ${AXEL_BTN_PRIMARY}`}
        >
          <Wallet size={12} />
          Pagar fatura
        </button>
      </div>
    </div>
  ) : null

  const transactionList = (
    <div className={`${inDrawer ? 'flex-1 min-h-0' : 'max-h-[min(50vh,420px)]'} overflow-y-auto scrollbar-none`}>
      {listaExibir.length === 0 ? (
        <p className={`px-3 py-10 text-center text-[12px] ${AXEL_TEXT_SECONDARY}`}>
          {usaExtrato ? 'Nenhum lançamento neste extrato ainda' : 'Nenhuma compra neste ciclo'}
        </p>
      ) : usaExtrato ? (
        <ul className="divide-y divide-line">
          {extratoLinhas.map(({ tx, saldoApos, quandoLabel }) =>
          {
            const cat = tx.categoria_id
              ? categories.find((c) => c.id === tx.categoria_id)?.nome
              : tx.categoria
            return (
              <li key={tx.id} className={`px-3 py-3 ${AXEL_ROW_HOVER}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] font-medium break-words ${AXEL_TEXT_PRIMARY}`}>
                      {tx.descricao}
                    </p>
                    <p className={`font-mono text-[10px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
                      {quandoLabel}
                      {cat ? ` · ${cat}` : ''}
                    </p>
                  </div>
                  <span className="font-mono tabular-nums text-urgente shrink-0 text-[13px]">
                    -{fmt(tx.valor)}
                  </span>
                </div>
                <p className={`font-mono text-[10px] mt-1.5 tabular-nums ${AXEL_TEXT_SECONDARY}`}>
                  Saldo após: <span className="text-ink">{fmt(saldoApos)}</span>
                </p>
              </li>
            )
          })}
        </ul>
      ) : (
        <ul className="divide-y divide-line">
          {invoiceTx.map((t) =>
          {
            const cat = t.categoria_id
              ? categories.find((c) => c.id === t.categoria_id)?.nome
              : t.categoria
            return (
              <li key={t.id} className={`px-3 py-3 flex items-start justify-between gap-3 ${AXEL_ROW_HOVER}`}>
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] font-medium break-words ${AXEL_TEXT_PRIMARY}`}>
                    {t.descricao}
                  </p>
                  <p className={`font-mono text-[10px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
                    {t.data.slice(0, 10).split('-').reverse().join('/')}
                    {cat ? ` · ${cat}` : ''}
                  </p>
                </div>
                <span className="font-mono tabular-nums text-urgente shrink-0 text-[13px]">
                  -{fmt(t.valor)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

  return (
    <div className={`border border-line rounded-sl bg-card flex flex-col min-h-0 min-w-0 ${inDrawer ? 'flex-1 h-full' : ''}`}>
      <header className="px-3 sm:px-4 py-3 border-b border-line space-y-2 shrink-0">
        {inDrawer ? (
          <p className={`text-xl sm:text-2xl font-display tabular-nums break-all sm:break-normal ${AXEL_TEXT_PRIMARY}`}>
            {fmt(invoiceTotal)}
          </p>
        ) : (
          <div className="flex items-start gap-2">
            <CreditCard size={16} className="text-accent shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
                {usaExtrato ? 'Extrato' : 'Fatura'} · {card.nome}
              </p>
              <p className={`text-xl sm:text-2xl font-display tabular-nums break-all sm:break-normal ${AXEL_TEXT_PRIMARY}`}>
                {fmt(invoiceTotal)}
              </p>
            </div>
          </div>
        )}
        {temFatura ? (
          <div className="flex flex-wrap gap-2 text-[10px] sm:text-[11px] font-mono">
            <span className="px-2 py-1 rounded-sl border border-line bg-chrome text-ink-muted">
              Fecha em {cycle.daysUntilClose}d
            </span>
            <span className="px-2 py-1 rounded-sl border border-accent/30 bg-accent/10 text-accent">
              Vence em {cycle.daysUntilDue}d
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 text-[10px] sm:text-[11px] font-mono">
            <span className="px-2 py-1 rounded-sl border border-concluido/30 bg-concluido/10 text-concluido">
              Disponível {fmt(disponivel)}
            </span>
            <span className="px-2 py-1 rounded-sl border border-line bg-chrome text-ink-muted">
              Limite {fmt(card.limite)}
            </span>
          </div>
        )}
      </header>

      {!inDrawer && billingSection && (
        <div className="border-b border-line">{billingSection}</div>
      )}
      {inDrawer ? transactionList : null}

      {inDrawer && billingSection && (
        <details className="shrink-0 border-b border-line group">
          <summary className={`px-3 sm:px-4 py-2.5 cursor-pointer list-none select-none font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY} hover:bg-chrome/40 [&::-webkit-details-marker]:hidden`}>
            Ciclo e pagamento
          </summary>
          <div className="border-t border-line">{billingSection}</div>
        </details>
      )}

      {!inDrawer && transactionList}

      {temFatura && (
        <p className={`px-3 sm:px-4 py-2 border-t border-line font-mono text-[9px] leading-relaxed break-words ${AXEL_TEXT_SECONDARY}`}>
          Compras no cartão não debitam o caixa — use &quot;Pagar fatura&quot; para registrar a saída bancária.
        </p>
      )}
    </div>
  )
}
