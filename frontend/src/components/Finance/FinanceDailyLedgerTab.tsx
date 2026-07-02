import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import {
  adviseSpend,
  daysUntilMonthEnd,
} from '../../lib/financeSpendAdvice'
import {
  filterTransactionsByDay,
  isToday,
  transactionDayKey,
} from '../../lib/financeLedger'
import { useCashPosition } from '../../hooks/useCashPosition'
import { CategoryPicker } from './CategoryPicker'
import { FinanceCategories } from './FinanceCategories'
import { PaymentMethodPicker } from './PaymentMethodPicker'
import {
  DEFAULT_EXPENSE_PAYMENT,
  DEFAULT_INCOME_PAYMENT,
  paymentMethodLabel,
  resolvePaymentFromSelection,
} from '../../lib/financePaymentMethod'
import { FinanceQuickPresets } from './FinanceQuickPresets'
import { FinanceReconcileButton } from './FinanceReconcileButton'
import { DashboardCollapsible } from '../dashboard/DashboardCollapsible'
import { dedupeLedgerEntries, countLedgerDuplicates } from '../../lib/financeTransactionDedup'
import {
  AXEL_BTN_PRIMARY_COMPACT,
  AXEL_BENTO_PANEL,
  AXEL_FIELD_INPUT,
  AXEL_ROW_HOVER,
  AXEL_FORM_SEG_ACTIVE,
  AXEL_FORM_SEG_IDLE,
  AXEL_SEG_SHELL,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import type { Category, Transaction } from '../../store/storeTypes'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const STATUS_LABEL: Record<string, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  agendado: 'Agendado',
}

function shiftDayKey(key: string, delta: number): string
{
  const d = new Date(`${key}T12:00:00`)
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

function formatDayHeading(dayKey: string): string
{
  return new Date(`${dayKey}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

interface FinanceDailyLedgerTabProps
{
  transactions: Transaction[]
  activeCategories: Category[]
  monthTransactions: Transaction[]
}

export function FinanceDailyLedgerTab({
  transactions,
  activeCategories,
}: FinanceDailyLedgerTabProps)
{
  const addTransaction = useTaskStore((s) => s.addTransaction)
  const cards = useTaskStore((s) => s.cards)
  const { display: cashPosition } = useCashPosition()

  const todayKey = new Date().toISOString().slice(0, 10)
  const [dayKey, setDayKey] = useState(todayKey)
  const [quickDesc, setQuickDesc] = useState('')
  const [quickVal, setQuickVal] = useState('')
  const [quickCatId, setQuickCatId] = useState<number | ''>('')
  const [quickTipo, setQuickTipo] = useState<'despesa' | 'receita'>('despesa')
  const [quickPayment, setQuickPayment] = useState<string>(DEFAULT_EXPENSE_PAYMENT)
  const [showCatModal, setShowCatModal] = useState(false)
  const [catModalParentId, setCatModalParentId] = useState<number | null>(null)
  const [pinVersion, setPinVersion] = useState(0)
  const [dayPage, setDayPage] = useState(0)

  const DAY_PAGE_SIZE = 5

  const dayTxRaw = useMemo(
    () => filterTransactionsByDay(transactions, dayKey),
    [transactions, dayKey],
  )

  const dayTx = useMemo(
    () => dedupeLedgerEntries(dayTxRaw),
    [dayTxRaw],
  )

  const duplicateCount = countLedgerDuplicates(dayTxRaw)

  const dayPageCount = Math.max(1, Math.ceil(dayTx.length / DAY_PAGE_SIZE))
  const dayPageSafe = Math.min(dayPage, dayPageCount - 1)
  const dayTxPage = dayTx.slice(
    dayPageSafe * DAY_PAGE_SIZE,
    dayPageSafe * DAY_PAGE_SIZE + DAY_PAGE_SIZE,
  )

  useEffect(() =>
  {
    setDayPage(0)
  }, [dayKey])

  const dayNet = useMemo(
    () => dayTx
      .filter((t) => (t.status_pagamento ?? 'pendente') === 'pago')
      .reduce((s, t) => s + (t.tipo === 'receita' ? t.valor : -t.valor), 0),
    [dayTx],
  )

  const advice = useMemo(() =>
  {
    const cardLimits = cards
      .filter((c) => c.status === 'ativo')
      .map((c) => c.limite)
    const limiteDisp = cardLimits.length > 0 ? Math.max(...cardLimits) : undefined

    return adviseSpend({
      saldoCorrente: cashPosition.saldoDisponivel,
      saldoProjetado: cashPosition.saldoProjetadoDisponivel,
      despesasPendentes: cashPosition.pendentes,
      despesasAgendadas: cashPosition.agendados,
      diasAteFimMes: daysUntilMonthEnd(),
      limiteCartaoDisponivel: limiteDisp,
    })
  }, [cashPosition, cards])

  const adviceToneClass = advice.tone === 'ok'
    ? 'border-concluido/30 bg-concluido/8'
    : advice.tone === 'caution'
      ? 'border-atencao/30 bg-atencao/8'
      : 'border-urgente/30 bg-urgente/8'

  const despesaCats = activeCategories.filter((c) => c.tipo === 'despesa')

  const handleQuickAdd = async () =>
  {
    const val = parseFloat(quickVal.replace(',', '.'))
    if (!quickDesc.trim() || Number.isNaN(val) || val <= 0)
    {
      toast.error('Preencha descrição e valor')
      return
    }

    const cat = despesaCats.find((c) => c.id === quickCatId)
    const paymentResolved = resolvePaymentFromSelection(quickPayment, cards)
    const isCard = quickTipo === 'despesa' && Boolean(paymentResolved.card_id)
    const cardId = paymentResolved.card_id

    if (isCard)
    {
      const selectedCard = cards.find((c) => c.id === cardId)
      if (selectedCard?.status === 'bloqueado')
      {
        toast.error('Cartão bloqueado')
        return
      }
    }

    await addTransaction({
      descricao: quickDesc.trim(),
      valor: val,
      tipo: quickTipo,
      categoria: quickTipo === 'receita' ? '-' : (cat?.nome ?? 'outros'),
      categoria_id: quickTipo === 'despesa' ? (quickCatId || undefined) : undefined,
      data: dayKey,
      status_pagamento: 'pago',
      forma_pagamento: paymentResolved.forma_pagamento,
      card_id: cardId,
    })

    setQuickDesc('')
    setQuickVal('')
    const msg = isCard
      ? 'Lançado no cartão'
      : 'Lançado — descontou da conta corrente'
    toast.success(msg)
  }

  const formattedDay = transactionDayKey(dayKey).split('-').reverse().join('/')

  const openCategories = (parentId: number | null = null) =>
  {
    setCatModalParentId(parentId)
    setShowCatModal(true)
  }

  const entryForm = (
    <>
      <div className="space-y-1.5">
        <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>O que é?</p>
        <div className={`grid grid-cols-2 gap-0.5 ${AXEL_SEG_SHELL}`}>
          {(['despesa', 'receita'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() =>
              {
                setQuickTipo(t)
                setQuickPayment(t === 'receita' ? DEFAULT_INCOME_PAYMENT : DEFAULT_EXPENSE_PAYMENT)
              }}
              className={quickTipo === t ? AXEL_FORM_SEG_ACTIVE : AXEL_FORM_SEG_IDLE}
            >
              {t === 'despesa' ? 'Gasto' : 'Receita'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-1 border-t border-line">
        <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Valor do lançamento</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={quickDesc}
            onChange={(e) => setQuickDesc(e.target.value)}
            placeholder="Descrição"
            className={`flex-1 min-w-0 ${AXEL_FIELD_INPUT}`}
          />
          <div className="flex gap-2 sm:w-auto w-full">
            <input
              value={quickVal}
              onChange={(e) => setQuickVal(e.target.value)}
              placeholder="R$"
              inputMode="decimal"
              className={`w-full sm:w-28 font-mono ${AXEL_FIELD_INPUT}`}
            />
            <button
              type="button"
              onClick={() => void handleQuickAdd()}
              className={`shrink-0 inline-flex items-center justify-center gap-1 px-4 py-2 ${AXEL_BTN_PRIMARY_COMPACT}`}
            >
              <Plus size={13} strokeWidth={2} />
              Lançar
            </button>
          </div>
        </div>
      </div>

      <PaymentMethodPicker
        cards={cards}
        value={quickPayment}
        onChange={setQuickPayment}
        variant={quickTipo === 'receita' ? 'receita' : 'despesa'}
      />

      {quickTipo === 'receita' && (
        <p className={`text-[10px] rounded-sl border border-concluido/30 bg-concluido/8 px-2 py-1 ${AXEL_TEXT_SECONDARY}`}>
          Hora extra? Use <strong className="text-ink">Lançamento</strong> → Receita.
        </p>
      )}

      {quickTipo === 'despesa' && (
        <div className="space-y-1.5 pt-2 border-t border-line/60">
          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Categoria</p>
          <CategoryPicker
            categories={activeCategories}
            tipo="despesa"
            value={quickCatId}
            onChange={setQuickCatId}
            compact
            pinVersion={pinVersion}
            onAddCategory={() => openCategories(null)}
            onAddSubcategory={(parentId) => openCategories(parentId)}
            onManageCategories={() => openCategories(null)}
          />
        </div>
      )}
    </>
  )

  const categoryModal = showCatModal ? (
    <FinanceCategories
      defaultParentId={catModalParentId}
      defaultTipo="despesa"
      pinTipo="despesa"
      onCategoryCreated={(cat) =>
      {
        setQuickCatId(cat.id)
        setPinVersion((v) => v + 1)
      }}
      onClose={() =>
      {
        setShowCatModal(false)
        setPinVersion((v) => v + 1)
      }}
    />
  ) : null

  const dayListSection = (
    <section className={AXEL_BENTO_PANEL}>
      <header className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-line">
        <div className="min-w-0">
          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
            {formattedDay} · {dayTx.length} item{dayTx.length !== 1 ? 's' : ''}
            {duplicateCount > 0 && (
              <span className="text-urgente ml-1">({duplicateCount} dup.)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {duplicateCount > 0 && (
            <FinanceReconcileButton className="font-mono text-[8px] uppercase tracking-wide px-2 py-1 rounded-sl border border-line text-ink-muted hover:text-urgente hover:border-urgente/40 transition-colors" />
          )}
          <p className={`font-mono text-[10px] tabular-nums ${dayNet >= 0 ? 'text-concluido' : 'text-urgente'}`}>
            {dayNet >= 0 ? '+' : ''}{fmt(dayNet)}
          </p>
        </div>
      </header>

      <div className="max-h-[min(420px,50dvh)] overflow-y-auto custom-scrollbar">

      <ul className="md:hidden divide-y divide-line">
        {dayTx.length === 0 && (
          <li className={`px-3 py-8 text-center text-[12px] ${AXEL_TEXT_SECONDARY}`}>
            Nada registrado neste dia
          </li>
        )}
        {dayTxPage.map((t) =>
        {
          const cat = t.categoria_id
            ? activeCategories.find((c) => c.id === t.categoria_id)?.nome
            : t.categoria
          const status = t.status_pagamento ?? 'pendente'
          return (
            <li key={t.id} className={`px-3 py-3 flex items-start justify-between gap-3 ${AXEL_ROW_HOVER}`}>
              <div className="min-w-0 flex-1">
                <p className={`text-[13px] font-medium break-words ${AXEL_TEXT_PRIMARY}`}>{t.descricao}</p>
                <p className={`font-mono text-[10px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
                  {cat ?? '—'}
                  {' · '}
                  {paymentMethodLabel(t)}
                  {status !== 'pago' && ` · ${STATUS_LABEL[status] ?? status}`}
                </p>
              </div>
              <span className={`font-mono tabular-nums shrink-0 text-[13px] ${
                t.tipo === 'receita' ? 'text-concluido' : 'text-urgente'
              }`}>
                {t.tipo === 'receita' ? '+' : '-'}{fmt(t.valor)}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="hidden md:block overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-chrome/80 border-b border-line">
            <tr>
              <th className={`px-3 py-2 font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Descrição</th>
              <th className={`px-3 py-2 font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Categoria</th>
              <th className={`px-3 py-2 font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Pagamento</th>
              <th className={`px-3 py-2 font-mono text-[9px] uppercase text-right ${AXEL_TEXT_SECONDARY}`}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {dayTx.length === 0 && (
              <tr>
                <td colSpan={4} className={`px-3 py-8 text-center text-[12px] ${AXEL_TEXT_SECONDARY}`}>
                  Nada registrado neste dia
                </td>
              </tr>
            )}
            {dayTxPage.map((t) =>
            {
              const cat = t.categoria_id
                ? activeCategories.find((c) => c.id === t.categoria_id)?.nome
                : t.categoria
              const status = t.status_pagamento ?? 'pendente'
              return (
                <tr key={t.id} className={`border-b border-line/60 ${AXEL_ROW_HOVER}`}>
                  <td className={`px-3 py-2 ${AXEL_TEXT_PRIMARY}`}>{t.descricao}</td>
                  <td className={`px-3 py-2 font-mono text-[10px] ${AXEL_TEXT_SECONDARY}`}>{cat ?? '—'}</td>
                  <td className={`px-3 py-2 font-mono text-[10px] ${AXEL_TEXT_SECONDARY}`}>
                    {paymentMethodLabel(t)}
                    {status !== 'pago' && (
                      <span className="text-ink-muted ml-1">· {STATUS_LABEL[status] ?? status}</span>
                    )}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono tabular-nums ${
                    t.tipo === 'receita' ? 'text-concluido' : 'text-urgente'
                  }`}>
                    {t.tipo === 'receita' ? '+' : '-'}{fmt(t.valor)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      </div>

      {dayTx.length > 0 && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-line bg-chrome/30">
          <button
            type="button"
            disabled={dayPageSafe <= 0}
            onClick={() => setDayPage((p) => Math.max(0, p - 1))}
            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-ink-muted disabled:opacity-40 min-h-[40px] px-2"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Anterior
          </button>
          <span className={`font-mono text-[9px] tabular-nums ${AXEL_TEXT_SECONDARY}`}>
            {dayPageSafe + 1} / {dayPageCount}
          </span>
          <button
            type="button"
            disabled={dayPageSafe >= dayPageCount - 1}
            onClick={() => setDayPage((p) => Math.min(dayPageCount - 1, p + 1))}
            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-ink-muted disabled:opacity-40 min-h-[40px] px-2"
          >
            Próxima
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </section>
  )

  return (
    <div className="space-y-3">
      {categoryModal}
      <section className={`${AXEL_BENTO_PANEL} p-3`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDayKey((k) => shiftDayKey(k, -1))}
            className="p-2 rounded-sl border border-line hover:bg-chrome text-ink-muted shrink-0"
            aria-label="Dia anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0 text-center px-1">
            <p className={`font-display text-sm capitalize ${AXEL_TEXT_PRIMARY}`}>
              {isToday(dayKey) ? 'Hoje' : formatDayHeading(dayKey)}
            </p>
            {isToday(dayKey) ? (
              <p className={`font-mono text-[10px] capitalize mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
                {formatDayHeading(dayKey)}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setDayKey(todayKey)}
                className="font-mono text-[10px] uppercase text-accent hover:underline mt-0.5"
              >
                Voltar para hoje
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDayKey((k) => shiftDayKey(k, 1))}
            className="p-2 rounded-sl border border-line hover:bg-chrome text-ink-muted shrink-0"
            aria-label="Próximo dia"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <label className={`block mt-2.5 font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
          Outra data
          <input
            type="date"
            value={dayKey}
            onChange={(e) => setDayKey(e.target.value)}
            className={`mt-1 w-full ${AXEL_FIELD_INPUT} py-2 text-sm`}
            aria-label="Escolher data"
          />
        </label>
      </section>

      {dayListSection}

      <DashboardCollapsible
        title="Lançar neste dia"
        subtitle={`${isToday(dayKey) ? 'Hoje' : formattedDay} · dia ${dayNet >= 0 ? '+' : ''}${fmt(dayNet)}`}
        className={AXEL_BENTO_PANEL}
        bodyClassName="space-y-2.5"
      >
        {entryForm}
      </DashboardCollapsible>

      <section className={`${AXEL_BENTO_PANEL} p-2 md:p-3`}>
        <FinanceQuickPresets />
      </section>

      <div className={`rounded-sl p-2.5 text-[10px] ${adviceToneClass}`}>
        <div className="flex items-center gap-1.5">
          <Sparkles size={11} className="text-accent" />
          <span className={`font-mono text-[8px] uppercase ${AXEL_TEXT_SECONDARY}`}>AXEL</span>
          <span className={AXEL_TEXT_PRIMARY}>{advice.headline}</span>
        </div>
      </div>
    </div>
  )
}
