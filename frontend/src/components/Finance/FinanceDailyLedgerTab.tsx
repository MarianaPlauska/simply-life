import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Sparkles } from 'lucide-react'
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
import { computeCashPosition } from '../../lib/financeReservedBills'
import { CategoryPicker } from './CategoryPicker'
import { PaymentMethodPicker } from './PaymentMethodPicker'
import {
  DEFAULT_EXPENSE_PAYMENT,
  DEFAULT_INCOME_PAYMENT,
  isCardPaymentSelection,
  paymentMethodLabel,
  resolvePaymentFromSelection,
} from '../../lib/financePaymentMethod'
import { FinanceSpendingCharts } from './FinanceSpendingCharts'
import { FinanceQuickPresets } from './FinanceQuickPresets'
import { FinanceMonthKpisRow } from './overview/FinanceMonthKpisRow'
import { DashboardCollapsible } from '../dashboard/DashboardCollapsible'
import {
  AXEL_BTN_PRIMARY,
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
  AXEL_ROW_HOVER,
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

function buildRecentDayKeys(count: number): string[]
{
  const keys: string[] = []
  const d = new Date()
  for (let i = 0; i < count; i++)
  {
    const copy = new Date(d)
    copy.setDate(d.getDate() - i)
    keys.push(copy.toISOString().slice(0, 10))
  }
  return keys
}

function dayChipLabel(key: string, todayKey: string): string
{
  if (key === todayKey) return 'Hoje'
  const d = new Date(`${key}T12:00:00`)
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })
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
  monthTransactions,
}: FinanceDailyLedgerTabProps)
{
  const addTransaction = useTaskStore((s) => s.addTransaction)
  const cards = useTaskStore((s) => s.cards)
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const reservedBills = useTaskStore((s) => s.reservedBills)

  const todayKey = new Date().toISOString().slice(0, 10)
  const recentDays = useMemo(() => buildRecentDayKeys(7), [todayKey])
  const [dayKey, setDayKey] = useState(todayKey)
  const [quickDesc, setQuickDesc] = useState('')
  const [quickVal, setQuickVal] = useState('')
  const [quickCatId, setQuickCatId] = useState<number | ''>('')
  const [quickStatus, setQuickStatus] = useState<'pago' | 'pendente'>('pago')
  const [quickTipo, setQuickTipo] = useState<'despesa' | 'receita'>('despesa')
  const [quickPayment, setQuickPayment] = useState<string>(DEFAULT_EXPENSE_PAYMENT)

  const dayTx = useMemo(
    () => filterTransactionsByDay(transactions, dayKey),
    [transactions, dayKey],
  )

  const cashPosition = useMemo(
    () => computeCashPosition(transactions, cashAccount.saldo_inicial, reservedBills),
    [transactions, cashAccount.saldo_inicial, reservedBills],
  )

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
      status_pagamento: isCard ? 'pago' : quickStatus,
      forma_pagamento: paymentResolved.forma_pagamento,
      card_id: cardId,
    })

    setQuickDesc('')
    setQuickVal('')
    const msg = isCard
      ? 'Lançado no cartão'
      : quickStatus === 'pago'
        ? 'Lançado — descontou da conta corrente'
        : 'Lançado como pendente'
    toast.success(msg)
  }

  const monthReceita = useMemo(
    () => monthTransactions.filter((t) => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0),
    [monthTransactions],
  )

  const monthDespesas = useMemo(
    () => monthTransactions.filter((t) => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0),
    [monthTransactions],
  )

  const formattedDay = transactionDayKey(dayKey).split('-').reverse().join('/')

  const entryForm = (
    <>
      <div className="space-y-2">
        <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>O que é?</p>
        <div className="grid grid-cols-2 gap-1.5">
          {(['despesa', 'receita'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() =>
              {
                setQuickTipo(t)
                setQuickPayment(t === 'receita' ? DEFAULT_INCOME_PAYMENT : DEFAULT_EXPENSE_PAYMENT)
              }}
              className={`py-1.5 rounded-sl font-mono text-[10px] uppercase ${
                quickTipo === t ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
              }`}
            >
              {t === 'despesa' ? 'Gasto' : 'Receita'}
            </button>
          ))}
        </div>
      </div>

      {quickTipo === 'receita' && (
        <p className={`text-[10px] rounded-sl border border-concluido/30 bg-concluido/8 px-2 py-1 ${AXEL_TEXT_SECONDARY}`}>
          Hora extra? Use <strong className="text-ink">Lançamento</strong> → Receita → tipo de entrada.
        </p>
      )}

      {quickTipo === 'despesa' && !isCardPaymentSelection(quickPayment, cards) && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            {(['pago', 'pendente'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQuickStatus(s)}
                className={`py-1.5 rounded-sl font-mono text-[10px] uppercase ${
                  quickStatus === s ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
                }`}
              >
                {s === 'pago' ? 'Desconta agora' : 'Só anotar'}
              </button>
            ))}
          </div>
        </div>
      )}

      <PaymentMethodPicker
        cards={cards}
        value={quickPayment}
        onChange={setQuickPayment}
        variant={quickTipo === 'receita' ? 'receita' : 'despesa'}
      />

      {quickTipo === 'despesa' && (
        <CategoryPicker
          categories={activeCategories}
          value={quickCatId}
          onChange={setQuickCatId}
          compact
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        <input
          value={quickDesc}
          onChange={(e) => setQuickDesc(e.target.value)}
          placeholder="Descrição"
          className="sm:col-span-6 border border-line rounded-sl bg-chrome px-2.5 py-2 text-sm text-ink"
        />
        <input
          value={quickVal}
          onChange={(e) => setQuickVal(e.target.value)}
          placeholder="Valor"
          inputMode="decimal"
          className="sm:col-span-3 border border-line rounded-sl bg-chrome px-2.5 py-2 text-sm font-mono text-ink"
        />
        <button
          type="button"
          onClick={() => void handleQuickAdd()}
          className={`sm:col-span-3 inline-flex items-center justify-center gap-1 min-h-[40px] font-mono text-[10px] uppercase ${AXEL_BTN_PRIMARY}`}
        >
          <Plus size={14} />
          Lançar
        </button>
      </div>
    </>
  )

  return (
    <div className="space-y-3">
      <FinanceMonthKpisRow
        saldoDisponivel={cashPosition.saldoDisponivel}
        receita={monthReceita}
        despesas={monthDespesas}
        saldoMes={monthReceita - monthDespesas}
        compact
      />

      <FinanceSpendingCharts
        transactions={transactions}
        activeCategories={activeCategories}
        compact
      />

      <section className="rounded-sl border border-line bg-card p-2 md:p-3">
        <FinanceQuickPresets />
      </section>

      <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5">
        {recentDays.map((key) =>
        {
          const active = key === dayKey
          return (
            <button
              key={key}
              type="button"
              onClick={() => setDayKey(key)}
              className={`shrink-0 px-3 py-2 rounded-sl font-mono text-[10px] uppercase ${
                active ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
              }`}
            >
              {dayChipLabel(key, todayKey)}
            </button>
          )
        })}
        <input
          type="date"
          value={dayKey}
          onChange={(e) => setDayKey(e.target.value)}
          className="shrink-0 font-mono text-[10px] border border-line rounded-sl bg-chrome px-2 py-2 text-ink"
          aria-label="Escolher data"
        />
      </div>

      <DashboardCollapsible
        title="Lançar neste dia"
        subtitle={`${isToday(dayKey) ? 'Hoje' : formattedDay} · dia ${dayNet >= 0 ? '+' : ''}${fmt(dayNet)}`}
        defaultOpen
        bodyClassName="space-y-2.5"
      >
        {entryForm}
      </DashboardCollapsible>

      <div className={`rounded-sl border p-2.5 text-[10px] ${adviceToneClass}`}>
        <div className="flex items-center gap-1.5">
          <Sparkles size={11} className="text-accent" />
          <span className={`font-mono text-[8px] uppercase ${AXEL_TEXT_SECONDARY}`}>AXEL</span>
          <span className={AXEL_TEXT_PRIMARY}>{advice.headline}</span>
        </div>
      </div>

      <section>
        <header className="flex items-center justify-between mb-1.5">
          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
            {formattedDay} · {dayTx.length} item{dayTx.length !== 1 ? 's' : ''}
          </p>
          <p className={`font-mono text-[10px] tabular-nums ${dayNet >= 0 ? 'text-concluido' : 'text-urgente'}`}>
            {dayNet >= 0 ? '+' : ''}{fmt(dayNet)}
          </p>
        </header>

        <ul className="md:hidden border border-line rounded-sl divide-y divide-line">
          {dayTx.length === 0 && (
            <li className={`px-3 py-8 text-center text-[12px] ${AXEL_TEXT_SECONDARY}`}>
              Nada registrado neste dia
            </li>
          )}
          {dayTx.map((t) =>
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

        <div className="hidden md:block border border-line rounded-sl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-chrome border-b border-line">
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
              {dayTx.map((t) =>
              {
                const cat = t.categoria_id
                  ? activeCategories.find((c) => c.id === t.categoria_id)?.nome
                  : t.categoria
                const status = t.status_pagamento ?? 'pendente'
                return (
                  <tr key={t.id} className={`border-b border-line ${AXEL_ROW_HOVER}`}>
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
      </section>
    </div>
  )
}
