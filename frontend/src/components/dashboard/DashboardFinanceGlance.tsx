import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCashPosition } from '../../hooks/useCashPosition'
import { useTaskStore } from '../../store/useTaskStore'
import { FinanceWorstEnvelope } from '../Finance/overview/FinanceWorstEnvelope'
import {
  AXEL_LINK,
  AXEL_METRIC_HAIRLINE,
  AXEL_TEXT_SECONDARY,
  MODULE_HERO,
  MODULE_WASH,
} from '../../constants/axelSurfaces'
import { ModuleSection } from '../ui/ModuleSection'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface DashboardFinanceGlanceProps
{
  showLink?: boolean
  compactRail?: boolean
}

export function DashboardFinanceGlance({ showLink = false, compactRail = false }: DashboardFinanceGlanceProps)
{
  const { display } = useCashPosition()
  const categories = useTaskStore((s) => s.categories)
  const budgetLimits = useTaskStore((s) => s.budgetLimits)
  const transactions = useTaskStore((s) => s.transactions)

  const monthTransactions = useMemo(() =>
  {
    const now = new Date()
    const m = now.getMonth()
    const y = now.getFullYear()
    return transactions.filter((t) =>
    {
      const d = new Date(`${t.data.slice(0, 10)}T12:00:00`)
      return d.getMonth() === m && d.getFullYear() === y
    })
  }, [transactions])

  return (
    <ModuleSection tone="finance" label="Finanças">
      {!compactRail && (
        <>
          <div className={MODULE_WASH.finance}>
            <p className={MODULE_HERO.finance}>
              {fmt(display.saldoDisponivel)}
            </p>
          </div>
          <p className="sl-body-muted mt-2">
            Disponível · projetado {fmt(display.saldoProjetadoDisponivel)}
          </p>
        </>
      )}
      {compactRail && (
        <p className="sl-body-muted">
          Projetado {fmt(display.saldoProjetadoDisponivel)}
        </p>
      )}
      {showLink && (
        <Link
          to="/financeiro"
          className={`inline-flex items-center min-h-11 mt-2 sl-body font-medium ${AXEL_LINK}`}
        >
          Abrir Finanças
        </Link>
      )}
      <div className="mt-4">
        <FinanceWorstEnvelope
          categories={categories}
          budgetLimits={budgetLimits}
          monthTransactions={monthTransactions}
        />
      </div>
    </ModuleSection>
  )
}
