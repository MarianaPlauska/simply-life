import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { isMockReservedBillId } from '../../lib/financeReservedBillsLocal'
import {
  billMatchesFilter,
  daysUntilDue,
  resolveBillVisualStatus,
  statusSortWeight,
  type BillFilterKey,
} from '../../lib/financeBillVisual'
import { itemsForBill } from '../../lib/financeBillItems'
import { ReservedBillCard } from './reserved-bills/ReservedBillCard'
import { ReservedBillsSummaryBar } from './reserved-bills/ReservedBillsSummaryBar'
import { UpcomingPayablesSection } from './UpcomingPayablesSection'
import { PaymentMethodPicker } from './PaymentMethodPicker'
import { FinanceReconcileButton } from './FinanceReconcileButton'
import { FinanceKanbanPaymentsPanel } from './overview/FinanceKanbanPaymentsPanel'
import { DashboardCollapsible } from '../dashboard/DashboardCollapsible'
import { MoneyInput } from '../ui/MoneyInput'
import { parseMoneyInputToNumber } from '../../lib/currencyInput'
import { isPaidInSettlements } from '../../lib/financeLedgerReconcile'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_BTN_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const todayIso = () => new Date().toISOString().slice(0, 10)

interface FinanceReservedBillsTabProps
{
  monthLabel?: string
  viewYear?: number
  viewMonth?: number
}

export function FinanceReservedBillsTab({
  monthLabel,
  viewYear,
  viewMonth,
}: FinanceReservedBillsTabProps)
{
  const cards = useTaskStore((s) => s.cards)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const reservedBillItems = useTaskStore((s) => s.reservedBillItems)
  const billSettlements = useTaskStore((s) => s.billSettlements)
  const fetchBillSettlements = useTaskStore((s) => s.fetchBillSettlements)
  const addReservedBill = useTaskStore((s) => s.addReservedBill)
  const recordBillSpend = useTaskStore((s) => s.recordBillSpend)
  const cancelReservedBill = useTaskStore((s) => s.cancelReservedBill)
  const addReservedBillItem = useTaskStore((s) => s.addReservedBillItem)
  const removeReservedBillItem = useTaskStore((s) => s.removeReservedBillItem)

  const [showForm, setShowForm] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState(todayIso)
  const [payment, setPayment] = useState<'cash' | string>('cash')
  const [spendBillId, setSpendBillId] = useState<number | null>(null)
  const [spendVal, setSpendVal] = useState('')
  const [filter, setFilter] = useState<BillFilterKey>('todas')
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set())
  const [summaryExpanded, setSummaryExpanded] = useState(false)

  useEffect(() =>
  {
    void fetchBillSettlements()
  }, [fetchBillSettlements])

  const abertas = useMemo(
    () => reservedBills.filter((b) =>
    {
      if (b.status !== 'aberta') return false
      return !isPaidInSettlements(b.titulo, b.valor_alocado, billSettlements)
    }),
    [reservedBills, billSettlements],
  )

  const visibleBills = useMemo(() =>
  {
    return abertas
      .filter((bill) =>
      {
        const items = itemsForBill(reservedBillItems, bill.id)
        const status = resolveBillVisualStatus(bill, items)
        return billMatchesFilter(status, items, filter)
      })
      .sort((a, b) =>
      {
        const itemsA = itemsForBill(reservedBillItems, a.id)
        const itemsB = itemsForBill(reservedBillItems, b.id)
        const wA = statusSortWeight(resolveBillVisualStatus(a, itemsA))
        const wB = statusSortWeight(resolveBillVisualStatus(b, itemsB))
        if (wA !== wB) return wA - wB
        return daysUntilDue(a.data_vencimento) - daysUntilDue(b.data_vencimento)
      })
  }, [abertas, reservedBillItems, filter])

  const isDemoData = useMemo(
    () => reservedBills.some((b) => isMockReservedBillId(b.id)),
    [reservedBills],
  )

  // Reservas ficam recolhidas por padrão — usuário expande quando precisar
  const toggleExpanded = (id: number) =>
  {
    setExpandedIds((prev) =>
    {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCreate = async () =>
  {
    const v = parseMoneyInputToNumber(valor)
    if (!titulo.trim() || Number.isNaN(v) || v <= 0 || !vencimento)
    {
      toast.error('Preencha título, valor e vencimento')
      return
    }

    await addReservedBill({
      titulo: titulo.trim(),
      valor_alocado: v,
      data_vencimento: vencimento,
      card_id: payment !== 'cash' ? payment : undefined,
    })

    setTitulo('')
    setValor('')
    setVencimento(todayIso())
    setPayment('cash')
    setShowForm(false)
    toast.success('Fatura reservada — valor bloqueado do disponível')
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
          Contas a pagar
        </p>
        <p className={`text-[12px] leading-snug ${AXEL_TEXT_SECONDARY}`}>
          Faturas de cartão, PIX, boletos e outras contas avulsas — com lembrete antes do vencimento.
          Recorrentes mensais ficam em <strong className="text-ink">Fixas</strong>.
        </p>
      </header>

      <UpcomingPayablesSection />

      <section className={AXEL_BORDERLESS_PANEL}>
        <header className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <CalendarClock size={14} className="text-accent shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
                Reservas com valor separado
              </p>
              <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
                Bloqueia do disponível — ideal para fatura grande ou parcelas
              </p>
            </div>
          </div>
          <FinanceReconcileButton className="font-mono text-[8px] uppercase tracking-wide px-2 py-1 rounded-sl border border-line text-ink-muted hover:text-urgente hover:border-urgente/40 transition-colors shrink-0" />
        </header>

        {isDemoData && (
          <p className={`mb-3 rounded-sl border border-accent/25 bg-accent-muted/40 px-3 py-2 text-[11px] ${AXEL_TEXT_SECONDARY}`}>
            Dados de demonstração — some quando você criar faturas reais no Supabase.
          </p>
        )}

        {abertas.length > 0 && (
          <ReservedBillsSummaryBar
            bills={abertas}
            filter={filter}
            onFilterChange={setFilter}
            visibleCount={visibleBills.length}
            compact={abertas.length > 0}
            expanded={summaryExpanded}
            onToggleExpanded={() => setSummaryExpanded((v) => !v)}
          />
        )}

        {showForm && (
          <div className="relative border border-line rounded-sl bg-chrome/30 p-4 space-y-3 mb-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="absolute top-2 right-2 p-2 rounded-sl text-ink-muted hover:text-ink hover:bg-chrome/80 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Fechar formulário"
            >
              <X size={16} />
            </button>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Nome — ex: Aluguel, Internet, IPVA..."
              className="w-full border border-line rounded-sl bg-card px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <MoneyInput
                value={valor}
                onChange={setValor}
                placeholder="Valor total (R$)"
                className="text-sm"
              />
              <input
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                className="border border-line rounded-sl bg-card px-3 py-2 text-sm font-mono"
                aria-label="Data do consumo ou vencimento"
              />
            </div>
            <div>
              <p className={`font-mono text-[9px] uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>Vai pagar com</p>
              <PaymentMethodPicker cards={cards} value={payment} onChange={setPayment} />
            </div>
            <button
              type="button"
              onClick={() => void handleCreate()}
              className={`w-full py-2 font-mono text-[10px] uppercase ${AXEL_BTN_PRIMARY}`}
            >
              Reservar valor
            </button>
          </div>
        )}

        {abertas.length === 0 ? (
          <p className={`py-8 text-center text-[12px] ${AXEL_TEXT_SECONDARY}`}>
            Nenhuma fatura reservada — crie uma para separar o dinheiro
          </p>
        ) : !summaryExpanded ? (
          <p className={`pb-2 text-center text-[11px] ${AXEL_TEXT_SECONDARY}`}>
            Toque acima para ver filtros e detalhes de cada reserva
          </p>
        ) : visibleBills.length === 0 ? (
          <p className={`py-6 text-center text-[12px] ${AXEL_TEXT_SECONDARY}`}>
            Nenhuma fatura neste filtro — tente outra aba
          </p>
        ) : (
          <ul className="space-y-2">
            {visibleBills.map((bill) => (
              <ReservedBillCard
                key={bill.id}
                bill={bill}
                cards={cards}
                expanded={expandedIds.has(bill.id)}
                onToggle={() => toggleExpanded(bill.id)}
                onRecordSpend={recordBillSpend}
                onCancel={cancelReservedBill}
                onAddItem={addReservedBillItem}
                onRemoveItem={removeReservedBillItem}
                spendBillId={spendBillId}
                setSpendBillId={setSpendBillId}
                spendVal={spendVal}
                setSpendVal={setSpendVal}
              />
            ))}
          </ul>
        )}
      </section>

      <DashboardCollapsible
        title="Já pagos"
        subtitle="Quitados neste mês — toque para abrir o registro"
        borderless
        defaultOpen={false}
      >
        <FinanceKanbanPaymentsPanel
          monthLabel={monthLabel}
          viewYear={viewYear}
          viewMonth={viewMonth}
        />
      </DashboardCollapsible>

      {!showForm && (
        <button
          type="button"
          onClick={() =>
          {
            setVencimento(todayIso())
            setShowForm(true)
          }}
          className={`fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 right-3 z-40 inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 font-mono text-[10px] uppercase tracking-wide shadow-lg ${AXEL_BTN_PRIMARY}`}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova reserva</span>
          <span className="sm:hidden">Novo</span>
        </button>
      )}
    </div>
  )
}
