import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, Receipt } from 'lucide-react'
import { transactionDayKey } from '../../lib/financeLedger'
import { maskFinanceValue } from '../../lib/financeHideValues'
import { EMPTY_COPY } from '../../lib/emptyCopy'
import { AxelListRow } from '../ui/AxelListRow'
import { ModuleEmptyState } from '../ui/ModuleEmptyState'
import { AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import type { Category, Transaction } from '../../store/storeTypes'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function formatDay(key: string): string
{
  return new Date(`${key}T12:00:00`).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
  })
}

interface FinanceRecentTransactionsProps
{
  transactions: Transaction[]
  categories: Category[]
  hideValues?: boolean
  limit?: number
  onOpenLedger?: () => void
}

/** Últimos lançamentos reais - confirmação rápida sem ir ao Diário */
export function FinanceRecentTransactions({
  transactions,
  categories,
  hideValues = false,
  limit = 5,
  onOpenLedger,
}: FinanceRecentTransactionsProps)
{
  const navigate = useNavigate()

  const rows = useMemo(() =>
  {
    return [...transactions]
      .sort((a, b) =>
      {
        const cmp = transactionDayKey(b.data).localeCompare(transactionDayKey(a.data))
        if (cmp !== 0) return cmp
        return b.id - a.id
      })
      .slice(0, limit)
      .map((t) =>
      {
        const cat = t.categoria_id
          ? categories.find((c) => c.id === t.categoria_id)?.nome
          : t.categoria
        const title = t.descricao || cat || (t.tipo === 'receita' ? 'Receita' : 'Despesa')
        const value = maskFinanceValue(hideValues, fmt(t.valor))
        const signed = t.tipo === 'receita' ? `+${value}` : `−${value}`
        return {
          id: t.id,
          title,
          subtitle: `${formatDay(transactionDayKey(t.data))} · ${signed}`,
          tipo: t.tipo,
        }
      })
  }, [transactions, categories, hideValues, limit])

  if (rows.length === 0)
  {
    return (
      <ModuleEmptyState
        icon={Receipt}
        tone="finance"
        message={EMPTY_COPY.financeNoTransactions}
      />
    )
  }

  return (
    <section aria-label="Últimos lançamentos">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <p className="sl-section-label">Últimos lançamentos</p>
        {onOpenLedger && (
          <button
            type="button"
            onClick={onOpenLedger}
            className={`text-[12px] font-medium text-finance hover:underline min-h-[44px] inline-flex items-center`}
          >
            Ver todos
          </button>
        )}
      </div>
      <ul>
        {rows.map((row) => (
          <AxelListRow
            key={row.id}
            title={row.title}
            subtitle={row.subtitle}
            iconNode={row.tipo === 'receita'
              ? <ArrowUpRight className="w-3.5 h-3.5 text-health shrink-0" strokeWidth={1.75} />
              : <ArrowDownRight className="w-3.5 h-3.5 text-finance shrink-0" strokeWidth={1.75} />}
            onClick={() => navigate('/financeiro#movimentos')}
          />
        ))}
      </ul>
      <p className={`text-[11px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
        Toque para abrir movimentos
      </p>
    </section>
  )
}
