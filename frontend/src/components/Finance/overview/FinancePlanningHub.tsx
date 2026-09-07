import { ChevronLeft, ChevronRight } from 'lucide-react'
import { FinanceBudgetPanel } from './FinanceBudgetPanel'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
  MODULE_HERO,
} from '../../../constants/axelSurfaces'
import type { CategoryBudgetRow } from '../../../lib/financeCategoryBudget'
import { totalBudgetRemaining } from '../../../lib/financeCategoryBudget'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinancePlanningHubProps
{
  monthLabel: string
  monthOffset: number
  onMonthOffset: (offset: number) => void
  canGoPrev: boolean
  canGoNext: boolean
  budgetUsedPct: number
  budgetRows: CategoryBudgetRow[]
  editingBudget: number | null
  setEditingBudget: (id: number | null) => void
  editVal: string
  setEditVal: (v: string) => void
  handleSaveBudget: (catId: number, name: string) => void
  hojeLines: string[]
}

/** Hub Planejamento mensal - orçamento geral + categorias (estilo Organizze) */
export function FinancePlanningHub({
  monthLabel,
  monthOffset,
  onMonthOffset,
  canGoPrev,
  canGoNext,
  budgetUsedPct,
  budgetRows,
  editingBudget,
  setEditingBudget,
  editVal,
  setEditVal,
  handleSaveBudget,
  hojeLines,
}: FinancePlanningHubProps)
{
  const tracked = budgetRows.filter((r) => r.limite > 0)
  const totalLimit = tracked.reduce((s, r) => s + r.limite, 0)
  const totalSpent = tracked.reduce((s, r) => s + r.gasto, 0)
  const remaining = totalBudgetRemaining(budgetRows)
  const overallPct = totalLimit > 0 ? Math.min(100, (totalSpent / totalLimit) * 100) : budgetUsedPct
  const overCount = tracked.filter((r) => r.alert === 'over').length
  const cautionCount = tracked.filter((r) => r.alert === 'caution').length

  return (
    <div className="space-y-3">
      <div className={`${AXEL_BORDERLESS_PANEL} space-y-3`}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className={AXEL_SECTION_TITLE}>Planejamento mensal</p>
            <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
              Crie orçamentos e defina o limite por categoria
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => onMonthOffset(monthOffset - 1)}
              className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-sl border border-line text-ink-muted disabled:opacity-30"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className={`min-w-[7.5rem] text-center text-[13px] font-medium ${AXEL_TEXT_PRIMARY}`}>
              {monthLabel}
            </p>
            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => onMonthOffset(monthOffset + 1)}
              className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-sl border border-line text-ink-muted disabled:opacity-30"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="rounded-sl border border-line bg-chrome/30 px-3 py-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="sl-eyebrow text-finance">Orçamento geral</p>
              <p className={`mt-1 ${MODULE_HERO.finance}`}>
                {tracked.length > 0 ? fmt(remaining) : fmt(0)}
              </p>
              <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
                {tracked.length > 0
                  ? `${fmt(totalSpent)} de ${fmt(totalLimit)} · ${overallPct.toFixed(0)}%`
                  : 'Defina limites nas categorias abaixo'}
              </p>
            </div>
            <p className={`font-mono text-[11px] tabular-nums ${
              overallPct >= 100 ? 'text-urgente' : overallPct >= 80 ? 'text-atencao' : AXEL_TEXT_SECONDARY
            }`}
            >
              {overallPct.toFixed(0)}%
            </p>
          </div>
          <div className="h-2 rounded-sl bg-chrome overflow-hidden">
            <div
              className={`h-full rounded-sl transition-all ${
                overallPct >= 100 ? 'bg-urgente' : overallPct >= 80 ? 'bg-atencao' : 'bg-finance'
              }`}
              style={{ width: `${Math.min(100, overallPct)}%` }}
            />
          </div>
          {(overCount > 0 || cautionCount > 0) && (
            <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
              {overCount > 0 ? `${overCount} estourada(s)` : null}
              {overCount > 0 && cautionCount > 0 ? ' · ' : null}
              {cautionCount > 0 ? `${cautionCount} em atenção (≥80%)` : null}
            </p>
          )}
        </div>

        {hojeLines.length > 0 && (
          <div className="rounded-sl border border-accent/35 bg-accent/10 px-3 py-2.5">
            <p className="font-mono text-[10px] uppercase tracking-wide text-accent">
              Alerta Hoje
            </p>
            <ul className="mt-1 space-y-0.5">
              {hojeLines.map((line) => (
                <li key={line} className={`text-[12px] ${AXEL_TEXT_PRIMARY}`}>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <FinanceBudgetPanel
        rows={budgetRows}
        budgetUsedPct={budgetUsedPct}
        editingBudget={editingBudget}
        setEditingBudget={setEditingBudget}
        editVal={editVal}
        setEditVal={setEditVal}
        onSaveBudget={handleSaveBudget}
      />
    </div>
  )
}
