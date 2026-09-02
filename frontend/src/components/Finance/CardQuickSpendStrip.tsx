import { useEffect, useMemo, useState } from 'react'
import { CreditCard, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { getBillingCycle } from '../../lib/financeCardCycle'
import { cardLimitUsagePct, sumOpenInvoiceSpend } from '../../lib/financeCardSpend'
import { resolveQuickCardId, saveQuickCardId } from '../../lib/financeQuickCard'
import {
  CARD_QUICK_AMOUNT_HINTS,
  CARD_QUICK_AMOUNT_HINTS_COMPACT,
  CARD_QUICK_SUBTYPES,
  loadLastCardQuickSubtypeId,
  saveLastCardQuickSubtypeId,
  type CardQuickSubtype,
} from '../../lib/financeCardQuickSubtypes'
import { CardSpendProgress } from './CardSpendProgress'
import { CardQuickSpendSubtypes } from './CardQuickSpendSubtypes'
import { MoneyInput } from '../ui/MoneyInput'
import { formatCentsToBrl, parseMoneyInputToNumber } from '../../lib/currencyInput'
import { DashboardCollapsible } from '../dashboard/DashboardCollapsible'
import {
  AXEL_BTN_PRIMARY,
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
  AXEL_PROGRESS_THICK,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

type CardQuickSpendVariant = 'dashboard' | 'full'

interface CardQuickSpendStripProps
{
  showCardPicker?: boolean
  /** dashboard = recolhível e denso; full = Finanças início */
  variant?: CardQuickSpendVariant
  /** Sempre aberto no dashboard — ideal para mobile */
  prominent?: boolean
  className?: string
}

// Lançamento rápido no cartão — mobile-first, layout compacto no dashboard

export function CardQuickSpendStrip({
  showCardPicker = true,
  variant = 'full',
  prominent = false,
  className = '',
}: CardQuickSpendStripProps)
{
  const isDashboard = variant === 'dashboard'
  const isProminent = isDashboard && prominent

  const cards = useTaskStore((s) => s.cards)
  const categories = useTaskStore((s) => s.categories)
  const transactions = useTaskStore((s) => s.transactions)
  const addTransaction = useTaskStore((s) => s.addTransaction)
  const fetchCards = useTaskStore((s) => s.fetchCards)
  const fetchTransactions = useTaskStore((s) => s.fetchTransactions)
  const fetchCategories = useTaskStore((s) => s.fetchCategories)

  const activeCards = useMemo(
    () => cards.filter((c) => c.status === 'ativo'),
    [cards],
  )

  const [cardId, setCardId] = useState<string | null>(null)
  const [subtypeId, setSubtypeId] = useState<string | null>(null)
  const [customDesc, setCustomDesc] = useState('')
  const [valor, setValor] = useState('')
  const [saving, setSaving] = useState(false)
  const valorInputId = 'card-quick-spend-valor'

  useEffect(() =>
  {
    void fetchCards()
    void fetchTransactions()
    void fetchCategories()
  }, [fetchCards, fetchTransactions, fetchCategories])

  useEffect(() =>
  {
    if (activeCards.length === 0)
    {
      setCardId(null)
      return
    }
    const resolved = resolveQuickCardId(activeCards)
    setCardId((prev) =>
    {
      if (prev && activeCards.some((c) => c.id === prev)) return prev
      return resolved
    })
  }, [activeCards])

  useEffect(() =>
  {
    const last = loadLastCardQuickSubtypeId()
    if (last)
    {
      setSubtypeId(last)
      return
    }
    if (isDashboard && CARD_QUICK_SUBTYPES.length > 0)
    {
      setSubtypeId(CARD_QUICK_SUBTYPES[0].id)
    }
  }, [isDashboard])

  const ensureSubtype = (): string | null =>
  {
    if (subtypeId) return subtypeId
    const fallback = CARD_QUICK_SUBTYPES[0]?.id ?? null
    if (fallback)
    {
      setSubtypeId(fallback)
      saveLastCardQuickSubtypeId(fallback)
    }
    return fallback
  }

  const selected = activeCards.find((c) => c.id === cardId) ?? null
  const isOutro = subtypeId === 'outro'
  const fallbackSubtypeId = CARD_QUICK_SUBTYPES[0]?.id ?? null
  const effectiveSubtypeId = subtypeId ?? fallbackSubtypeId

  const handleSubtypeSelect = (st: CardQuickSubtype) =>
  {
    setSubtypeId(st.id)
    saveLastCardQuickSubtypeId(st.id)
    if (st.id !== 'outro')
    {
      setCustomDesc('')
    }
    window.requestAnimationFrame(() => document.getElementById(valorInputId)?.focus())
  }

  const parseValor = () => parseMoneyInputToNumber(valor)

  const handleSpend = async (valorOverride?: number) =>
  {
    if (!selected)
    {
      toast.error('Nenhum cartão ativo')
      return
    }

    const activeSubtypeId = ensureSubtype()
    const subtype = CARD_QUICK_SUBTYPES.find((s) => s.id === activeSubtypeId) ?? null
    if (!subtype)
    {
      toast.error('Escolha o tipo do gasto')
      return
    }

    const desc = subtype.id === 'outro' ? customDesc.trim() : subtype.label
    if (!desc)
    {
      toast.error('Descreva o gasto')
      return
    }

    const val = valorOverride ?? parseValor()
    if (Number.isNaN(val) || val <= 0)
    {
      toast.error('Informe o valor')
      document.getElementById(valorInputId)?.focus()
      return
    }

    const cat = categories.find(
      (c) => c.nome.toLowerCase() === subtype.categoria
        || c.nome.toLowerCase().includes(subtype.categoria),
    )

    setSaving(true)
    try
    {
      await addTransaction({
        descricao: desc,
        valor: val,
        tipo: 'despesa',
        categoria: cat?.nome ?? subtype.categoria,
        categoria_id: cat?.id,
        data: new Date().toISOString().slice(0, 10),
        status_pagamento: 'pago',
        forma_pagamento: 'cartao',
        card_id: selected.id,
      })
      setValor('')
      if (isOutro) setCustomDesc('')
      toast.success(`${desc} · ${fmt(val)}`)
    }
    finally
    {
      setSaving(false)
    }
  }

  if (activeCards.length === 0) return null

  const cycle = selected ? getBillingCycle(selected) : null
  const invoiceTotal = selected ? sumOpenInvoiceSpend(transactions, selected) : 0
  const usagePct = selected ? cardLimitUsagePct(transactions, selected) : 0
  const canLaunch = Boolean(
    effectiveSubtypeId
    && (effectiveSubtypeId === 'outro' ? customDesc.trim() : true)
    && parseValor() > 0,
  )

  const handleAmountTap = (amt: number) =>
  {
    setValor(formatCentsToBrl(Math.round(amt * 100)))
    if (isDashboard)
    {
      void handleSpend(amt)
      return
    }
    window.requestAnimationFrame(() => document.getElementById(valorInputId)?.focus())
  }
  const amountHints = isDashboard ? CARD_QUICK_AMOUNT_HINTS_COMPACT : CARD_QUICK_AMOUNT_HINTS

  const formBody = selected && (
    <div className={isDashboard ? 'space-y-2' : 'space-y-2.5'}>
      {showCardPicker && activeCards.length > 1 && (
        <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5">
          {activeCards.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() =>
              {
                setCardId(c.id)
                saveQuickCardId(c.id)
              }}
              className={`shrink-0 px-2 py-1 rounded-sl font-mono text-[9px] uppercase min-h-[32px] ${
                cardId === c.id ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
              }`}
            >
              {c.nome}
            </button>
          ))}
        </div>
      )}

      {!isDashboard && (
        <CardSpendProgress card={selected} transactions={transactions} compact />
      )}

      {isDashboard && (
        <div className={`flex justify-between font-mono text-[9px] ${AXEL_TEXT_SECONDARY}`}>
          <span>{fmt(invoiceTotal)} / {fmt(selected.limite)}</span>
          <span>{usagePct.toFixed(0)}%</span>
        </div>
      )}

      {!isDashboard && cycle && (
        <p className={`font-mono text-[9px] ${AXEL_TEXT_SECONDARY}`}>
          Fatura {fmt(invoiceTotal)} · fecha {cycle.end.split('-').reverse().join('/')}
        </p>
      )}

      <CardQuickSpendSubtypes
        selectedId={subtypeId}
        onSelect={handleSubtypeSelect}
        layout="scroll"
        showLabel={!isDashboard}
      />

      {isOutro && (
        <input
          value={customDesc}
          onChange={(e) => setCustomDesc(e.target.value)}
          placeholder="Descreva"
          className="w-full border border-line rounded-sl bg-chrome px-2.5 py-2 text-sm text-ink min-h-[40px]"
          onKeyDown={(e) => e.key === 'Enter' && void handleSpend()}
        />
      )}

      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
        {amountHints.map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => handleAmountTap(amt)}
            className={`shrink-0 px-2 py-1 rounded-sl font-mono text-[10px] tabular-nums min-h-[32px] border ${
              parseValor() === amt
                ? AXEL_FILTER_PILL_ACTIVE
                : `${AXEL_FILTER_PILL_IDLE} border-line`
            }`}
          >
            {fmt(amt)}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <MoneyInput
          id={valorInputId}
          value={valor}
          onChange={setValor}
          placeholder="Valor"
          className={`flex-1 min-w-0 tabular-nums ${
            isDashboard
              ? 'py-2 text-base min-h-[40px]'
              : 'py-2.5 text-lg text-center min-h-[44px]'
          }`}
        />
        <button
          type="button"
          disabled={saving || !canLaunch}
          onClick={() => void handleSpend()}
          className={`shrink-0 px-4 inline-flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase ${AXEL_BTN_PRIMARY} disabled:opacity-40 ${
            isDashboard ? 'min-h-[40px]' : 'min-h-[44px]'
          }`}
        >
          <Plus size={14} />
          Lançar
        </button>
      </div>
    </div>
  )

  if (isProminent)
  {
    return (
      <section
        id="dashboard-quick-spend"
        className={`rounded-sl border border-line border-l-[3px] border-l-accent bg-card overflow-hidden scroll-mt-20 ${className}`}
        aria-label="Gasto rápido no cartão"
      >
        <div className="flex items-start gap-2.5 p-3 border-b border-line bg-accent/5">
          <CreditCard size={18} className="text-accent shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-ink">Gasto rápido</p>
                <p className={`text-[11px] truncate ${AXEL_TEXT_SECONDARY}`}>
                  {selected?.nome ?? 'Cartão'}
                </p>
              </div>
              <Link
                to={`/financeiro?cartao=${cardId ?? ''}`}
                className="font-mono text-[9px] uppercase text-accent hover:underline shrink-0 px-2 py-1 rounded-sl border border-accent/30"
              >
                Fatura
              </Link>
            </div>
            {selected && (
              <div className="mt-2 flex items-center gap-2">
                <div className={`flex-1 ${AXEL_PROGRESS_THICK}`}>
                  <div
                    className={`h-full rounded-sl transition-all ${
                      usagePct >= 90 ? 'bg-urgente' : usagePct >= 70 ? 'bg-atencao' : 'bg-finance'
                    }`}
                    style={{ width: `${usagePct}%` }}
                  />
                </div>
                <span className={`font-mono text-[10px] tabular-nums shrink-0 ${AXEL_TEXT_SECONDARY}`}>
                  {usagePct.toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="p-3">
          {formBody}
        </div>
      </section>
    )
  }

  if (isDashboard)
  {
    return (
      <DashboardCollapsible
        className={className}
        defaultOpen
        icon={<CreditCard size={14} className="text-accent shrink-0" />}
        title={`Gasto rápido · ${selected?.nome ?? 'Cartão'}`}
        trailing={(
          <Link
            to={`/financeiro?cartao=${cardId ?? ''}`}
            onClick={(e) => e.stopPropagation()}
            className="font-mono text-[8px] uppercase text-accent hover:underline shrink-0"
          >
            Fatura
          </Link>
        )}
        summaryExtra={selected ? (
          <div className="mt-1.5 flex items-center gap-2">
            <div className={`flex-1 ${AXEL_PROGRESS_THICK}`}>
              <div
                className={`h-full rounded-sl transition-all ${
                  usagePct >= 90 ? 'bg-urgente' : usagePct >= 70 ? 'bg-atencao' : 'bg-finance'
                }`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <span className={`font-mono text-[9px] tabular-nums shrink-0 ${AXEL_TEXT_SECONDARY}`}>
              {usagePct.toFixed(0)}%
            </span>
          </div>
        ) : undefined}
        bodyClassName=""
      >
        {formBody}
      </DashboardCollapsible>
    )
  }

  return (
    <DashboardCollapsible
      className={className}
      icon={<CreditCard size={14} className="text-accent shrink-0" />}
      title="Gasto rápido no cartão"
      subtitle={selected?.nome ?? 'Cartão'}
      trailing={(
        <Link
          to={`/financeiro?cartao=${cardId ?? ''}`}
          onClick={(e) => e.stopPropagation()}
          className="font-mono text-[9px] uppercase text-accent hover:underline shrink-0"
        >
          Ver fatura
        </Link>
      )}
      bodyClassName="space-y-2.5"
    >
      {formBody}
    </DashboardCollapsible>
  )
}
