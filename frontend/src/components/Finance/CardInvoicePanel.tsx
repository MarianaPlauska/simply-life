import { useState } from 'react'
import { toast } from 'sonner'
import { Calendar, CreditCard, Wallet } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import type { BillingCycle } from '../../lib/financeCardCycle'
import type { Category, Transaction, VirtualCard } from '../../store/storeTypes'
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
}

export function CardInvoicePanel({
  card,
  cycle,
  invoiceTx,
  invoiceTotal,
  categories,
}: CardInvoicePanelProps)
{
  const payCardInvoice = useTaskStore((s) => s.payCardInvoice)
  const updateCardBilling = useTaskStore((s) => s.updateCardBilling)
  const [paying, setPaying] = useState(false)
  const [fechamento, setFechamento] = useState(String(card.dia_fechamento ?? cycle.closingDay))
  const [vencimento, setVencimento] = useState(String(card.dia_vencimento ?? cycle.dueDay))

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
    toast.success('Ciclo da fatura atualizado')
  }

  return (
    <div className="border border-line rounded-sl bg-card flex flex-col min-h-0 min-w-0">
      <header className="px-3 sm:px-4 py-3 border-b border-line space-y-2">
        <div className="flex items-start gap-2">
          <CreditCard size={16} className="text-accent shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
              Fatura · {cycle.label}
            </p>
            <p className={`text-xl sm:text-2xl font-display tabular-nums break-all sm:break-normal ${AXEL_TEXT_PRIMARY}`}>
              {fmt(invoiceTotal)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] sm:text-[11px] font-mono">
          <span className="px-2 py-1 rounded-sl border border-line bg-chrome text-ink-muted">
            Fecha em {cycle.daysUntilClose}d
          </span>
          <span className="px-2 py-1 rounded-sl border border-accent/30 bg-accent/10 text-accent">
            Vence em {cycle.daysUntilDue}d
          </span>
        </div>
      </header>

      <div className="px-3 sm:px-4 py-3 border-b border-line grid grid-cols-2 gap-2">
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
          className="col-span-1 font-mono text-[10px] uppercase min-h-[44px] px-3 py-2 border border-line rounded-sl hover:bg-chrome text-ink-muted"
        >
          Salvar ciclo
        </button>
        <button
          type="button"
          disabled={paying || invoiceTotal <= 0}
          onClick={() => void handlePay()}
          className={`col-span-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] font-mono text-[10px] uppercase px-3 py-2 disabled:opacity-40 ${AXEL_BTN_PRIMARY}`}
        >
          <Wallet size={12} />
          Pagar fatura
        </button>
      </div>

      {/* Lista mobile */}
      <ul className="md:hidden divide-y divide-line max-h-[360px] overflow-y-auto">
        {invoiceTx.length === 0 && (
          <li className={`px-3 py-8 text-center text-[12px] ${AXEL_TEXT_SECONDARY}`}>
            <Calendar className="w-5 h-5 mx-auto mb-2 opacity-50" />
            Nenhuma compra neste ciclo
          </li>
        )}
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

      {/* Tabela desktop */}
      <div className="hidden md:block flex-1 overflow-auto max-h-[320px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-chrome border-b border-line">
            <tr>
              <th className={`px-3 py-2 text-left font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Data</th>
              <th className={`px-3 py-2 text-left font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Descrição</th>
              <th className={`px-3 py-2 text-right font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {invoiceTx.length === 0 && (
              <tr>
                <td colSpan={3} className={`px-3 py-8 text-center text-[12px] ${AXEL_TEXT_SECONDARY}`}>
                  <Calendar className="w-5 h-5 mx-auto mb-2 opacity-50" />
                  Nenhuma compra neste ciclo
                </td>
              </tr>
            )}
            {invoiceTx.map((t) =>
            {
              const cat = t.categoria_id
                ? categories.find((c) => c.id === t.categoria_id)?.nome
                : t.categoria
              return (
                <tr key={t.id} className={`border-b border-line ${AXEL_ROW_HOVER}`}>
                  <td className={`px-3 py-2 font-mono text-[10px] whitespace-nowrap ${AXEL_TEXT_SECONDARY}`}>
                    {t.data.slice(0, 10).split('-').reverse().join('/')}
                  </td>
                  <td className={`px-3 py-2 ${AXEL_TEXT_PRIMARY}`}>
                    <span className="block truncate max-w-[200px]">{t.descricao}</span>
                    {cat && (
                      <span className={`font-mono text-[9px] ${AXEL_TEXT_SECONDARY}`}>{cat}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-urgente">
                    -{fmt(t.valor)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className={`px-3 sm:px-4 py-2 border-t border-line font-mono text-[9px] leading-relaxed break-words ${AXEL_TEXT_SECONDARY}`}>
        Compras no cartão não debitam o caixa — use &quot;Pagar fatura&quot; para registrar a saída bancária.
      </p>
    </div>
  )
}
