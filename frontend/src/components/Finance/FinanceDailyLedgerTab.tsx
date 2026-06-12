import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Wallet, Sparkles } from 'lucide-react'
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

  const monthPendentes = useMemo(
    () => monthTransactions
      .filter((t) => (t.status_pagamento ?? 'pendente') === 'pendente' && t.tipo !== 'receita' && !t.card_id)
      .reduce((s, t) => s + t.valor, 0),
    [monthTransactions],
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
    ? 'border-concluido/40 bg-concluido/10 text-concluido'
    : advice.tone === 'caution'
      ? 'border-atencao/40 bg-atencao/10 text-atencao'
      : 'border-urgente/40 bg-urgente/10 text-urgente'

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

  return (
    <div className="space-y-4">
      {/* Saldo + conselho AXEL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="border border-line rounded-sl bg-card p-4">
          <p className={`font-mono text-[9px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
            Saldo corrente (pagos)
          </p>
          <p className={`text-xl sm:text-2xl font-display tabular-nums mt-1 break-all sm:break-normal ${cashPosition.saldoCorrente >= 0 ? 'text-ink' : 'text-urgente'}`}>
            {fmt(cashPosition.saldoCorrente)}
          </p>
          <p className={`text-[11px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
            Projetado: {fmt(cashPosition.saldoProjetado)}
          </p>
        </div>

        <div className="border border-line rounded-sl bg-card p-4">
          <p className={`font-mono text-[9px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
            Hoje · {dayTx.length} lançamento{dayTx.length !== 1 ? 's' : ''}
          </p>
          <p className={`text-xl sm:text-2xl font-display tabular-nums mt-1 break-all sm:break-normal ${AXEL_TEXT_PRIMARY}`}>
            {fmt(
              dayTx
                .filter((t) => (t.status_pagamento ?? 'pendente') === 'pago')
                .reduce((s, t) => s + (t.tipo === 'receita' ? t.valor : -t.valor), 0),
            )}
          </p>
          <p className={`text-[11px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
            Pendentes no mês: {fmt(monthPendentes)}
          </p>
        </div>

        <div className={`border rounded-sl p-4 ${adviceToneClass}`}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} />
            <p className="font-mono text-[9px] uppercase tracking-wide">AXEL · {advice.headline}</p>
          </div>
          <p className="text-[12px] leading-relaxed opacity-90 break-words">{advice.detail}</p>
          {advice.diasSugeridos != null && (
            <p className="font-mono text-[10px] mt-2 opacity-80">
              Sugestão: aguardar ~{advice.diasSugeridos} dias
            </p>
          )}
        </div>
      </div>

      {/* Seletor de dia + lançamento rápido */}
      <div className="border border-line rounded-sl bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Wallet size={14} className="text-accent" />
          <span className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
            Diário de lançamentos
          </span>
          <input
            type="date"
            value={dayKey}
            onChange={(e) => setDayKey(e.target.value)}
            className="ml-auto font-mono text-[11px] border border-line rounded-sl bg-chrome px-2 py-1 text-ink"
          />
          {!isToday(dayKey) && (
            <button
              type="button"
              onClick={() => setDayKey(todayKey)}
              className={`font-mono text-[10px] uppercase px-2 py-1 rounded-sl ${AXEL_FILTER_PILL_IDLE}`}
            >
              Hoje
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['despesa', 'receita'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() =>
              {
                setQuickTipo(t)
                setQuickPayment(t === 'receita' ? DEFAULT_INCOME_PAYMENT : DEFAULT_EXPENSE_PAYMENT)
              }}
              className={`px-2.5 py-1 rounded-sl font-mono text-[10px] uppercase ${
                quickTipo === t ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
              }`}
            >
              {t === 'despesa' ? 'Gasto' : 'Receita'}
            </button>
          ))}
          {quickTipo === 'despesa' && !isCardPaymentSelection(quickPayment, cards) && (
            (['pago', 'pendente'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQuickStatus(s)}
                className={`px-2.5 py-1 rounded-sl font-mono text-[10px] uppercase ${
                  quickStatus === s ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
                }`}
              >
                {s === 'pago' ? 'Desconta saldo' : 'Só anotar'}
              </button>
            ))
          )}
        </div>

        <div className="space-y-2">
          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
            {quickTipo === 'receita' ? 'Recebeu via' : 'Forma de pagamento'}
          </p>
          <PaymentMethodPicker
            cards={cards}
            value={quickPayment}
            onChange={setQuickPayment}
            variant={quickTipo === 'receita' ? 'receita' : 'despesa'}
          />
        </div>

        {quickTipo === 'despesa' && (
          <div className="space-y-2">
            <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Tipo de gasto</p>
            <CategoryPicker
              categories={activeCategories}
              value={quickCatId}
              onChange={setQuickCatId}
              compact
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <input
            value={quickDesc}
            onChange={(e) => setQuickDesc(e.target.value)}
            placeholder="Anotação — ex: almoço, Uber, pix recebido"
            className="sm:col-span-6 border border-line rounded-sl bg-chrome px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
          />
          <input
            value={quickVal}
            onChange={(e) => setQuickVal(e.target.value)}
            placeholder="Valor"
            inputMode="decimal"
            className="sm:col-span-3 border border-line rounded-sl bg-chrome px-3 py-2 text-sm font-mono text-ink"
          />
          <button
            type="button"
            onClick={() => void handleQuickAdd()}
            className={`sm:col-span-3 inline-flex items-center justify-center gap-1 font-mono text-[10px] uppercase ${AXEL_BTN_PRIMARY}`}
          >
            <Plus size={14} />
            Lançar
          </button>
        </div>
      </div>

      {/* Lista do dia — mobile */}
      <ul className="md:hidden border border-line rounded-sl divide-y divide-line">
        {dayTx.length === 0 && (
          <li className={`px-3 py-8 text-center text-[12px] ${AXEL_TEXT_SECONDARY}`}>
            Nenhum lançamento em {transactionDayKey(dayKey).split('-').reverse().join('/')}
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

      {/* Lista do dia — desktop */}
      <div className="hidden md:block border border-line rounded-sl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-chrome border-b border-line">
            <tr>
              <th className={`px-3 py-2 font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Hora</th>
              <th className={`px-3 py-2 font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Descrição</th>
              <th className={`px-3 py-2 font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Categoria</th>
              <th className={`px-3 py-2 font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Pagamento</th>
              <th className={`px-3 py-2 font-mono text-[9px] uppercase text-right ${AXEL_TEXT_SECONDARY}`}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {dayTx.length === 0 && (
              <tr>
                <td colSpan={5} className={`px-3 py-8 text-center text-[12px] ${AXEL_TEXT_SECONDARY}`}>
                  Nenhum lançamento em {transactionDayKey(dayKey).split('-').reverse().join('/')}
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
                  <td className={`px-3 py-2 font-mono text-[10px] ${AXEL_TEXT_SECONDARY}`}>—</td>
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
  )
}
