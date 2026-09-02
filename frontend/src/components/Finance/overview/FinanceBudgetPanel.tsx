import { useMemo, useState } from 'react'
import { Check, ChevronDown, Edit3, Plus } from 'lucide-react'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_PROGRESS_THICK,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
  MODULE_HERO,
} from '../../../constants/axelSurfaces'
import {
  budgetAlertLabel,
  budgetRemainingDisplay,
  filterActiveBudgetRows,
  totalBudgetRemaining,
  type CategoryBudgetRow,
} from '../../../lib/financeCategoryBudget'
import { CategoryIconCircle } from '../categories/CategoryIconCircle'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceBudgetPanelProps
{
  rows: CategoryBudgetRow[]
  budgetUsedPct: number
  editingBudget: number | null
  setEditingBudget: (id: number | null) => void
  editVal: string
  setEditVal: (v: string) => void
  onSaveBudget: (catId: number, name: string) => void
}

function barTone(row: CategoryBudgetRow): string
{
  if (row.alert === 'over') return 'bg-urgente'
  if (row.alert === 'caution') return 'bg-atencao'
  return 'bg-finance'
}

export function FinanceBudgetPanel({
  rows,
  budgetUsedPct,
  editingBudget,
  setEditingBudget,
  editVal,
  setEditVal,
  onSaveBudget,
}: FinanceBudgetPanelProps)
{
  const [showPicker, setShowPicker] = useState(false)

  const displayRows = useMemo(() => filterActiveBudgetRows(rows), [rows])
  const catalogRows = useMemo(
    () => rows.filter((r) => r.limite <= 0 && r.gasto <= 0),
    [rows],
  )
  const totalRemaining = useMemo(() => totalBudgetRemaining(rows), [rows])
  const trackedCount = useMemo(
    () => rows.filter((r) => r.limite > 0).length,
    [rows],
  )

  const usedTone = budgetUsedPct > 90
    ? 'text-urgente'
    : budgetUsedPct > 70
      ? 'text-atencao'
      : AXEL_TEXT_SECONDARY

  return (
    <section className={`${AXEL_BORDERLESS_PANEL} h-full`}>
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-line">
        <div>
          <h2 className={AXEL_SECTION_TITLE}>Orçamento por categoria</h2>
          <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
            Só categorias com limite ou gasto no mês
          </p>
        </div>
        <div className="text-right shrink-0">
          {trackedCount > 0 && (
            <p className={`text-[15px] font-display tabular-nums ${MODULE_HERO.finance}`}>
              {fmt(totalRemaining)}
            </p>
          )}
          <span className={`font-mono text-[10px] tabular-nums ${usedTone}`}>
            {trackedCount > 0
              ? `livres · ${budgetUsedPct.toFixed(0)}% usado`
              : `${budgetUsedPct.toFixed(0)}% usado`}
          </span>
        </div>
      </div>

      <div className="space-y-3 mt-4">
        {displayRows.length === 0 && (
          <p className={`text-[12px] py-4 text-center ${AXEL_TEXT_SECONDARY}`}>
            Nenhum limite definido ainda. Adicione as categorias que você controla.
          </p>
        )}

        {displayRows.map((cat) =>
        {
          const display = budgetRemainingDisplay(cat, fmt)
          const isEditing = editingBudget === cat.id

          return (
            <div key={cat.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <CategoryIconCircle icone={cat.icone} cor={cat.cor} size="sm" />
                  <div className="min-w-0">
                    <p className={`text-[12px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>
                      {cat.nome}
                    </p>
                    {cat.alert !== 'ok' && (
                      <p className={`text-[9px] font-mono uppercase ${
                        cat.alert === 'over' ? 'text-urgente' : 'text-atencao'
                      }`}
                      >
                        {budgetAlertLabel(cat.alert)}
                      </p>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>R$</span>
                    <input
                      type="number"
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onKeyDown={(e) =>
                      {
                        if (e.key === 'Enter') onSaveBudget(cat.id, cat.nome)
                        if (e.key === 'Escape') setEditingBudget(null)
                      }}
                      className="w-20 bg-chrome border border-line rounded-sl px-2 py-0.5 text-[12px] font-mono text-ink outline-none focus:border-accent/50"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => onSaveBudget(cat.id, cat.nome)}
                      className="p-1 rounded-sl hover:bg-chrome text-concluido"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                    {
                      setEditingBudget(cat.id)
                      setEditVal(String(cat.limite))
                    }}
                    className="text-right shrink-0 min-w-0 hover:opacity-90 transition-opacity"
                  >
                    <p className={`text-[14px] font-display tabular-nums leading-tight ${display.tone}`}>
                      {display.primary}
                    </p>
                    <p className={`text-[10px] font-mono tabular-nums flex items-center justify-end gap-1 ${AXEL_TEXT_SECONDARY}`}>
                      <Edit3 className="w-3 h-3 opacity-60" />
                      {display.secondary}
                    </p>
                  </button>
                )}
              </div>

              <div className={AXEL_PROGRESS_THICK}>
                <div
                  className={`h-full rounded-sl transition-all duration-500 ${barTone(cat)}`}
                  style={{ width: `${Math.min(cat.pct, 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {catalogRows.length > 0 && (
        <div className="mt-4 pt-3 border-t border-line">
          {showPicker ? (
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {catalogRows.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                  {
                    setEditingBudget(cat.id)
                    setEditVal('')
                    setShowPicker(false)
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-sl text-left hover:bg-chrome ${AXEL_TEXT_SECONDARY} hover:text-ink`}
                >
                  <span className="text-[11px]">{cat.nome}</span>
                  <Plus className="w-3 h-3 opacity-60" />
                </button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-sl border border-dashed border-line text-[10px] font-mono uppercase text-ink-muted hover:text-accent hover:border-accent/40"
            >
              <ChevronDown className="w-3 h-3" />
              Adicionar categoria ao orçamento
            </button>
          )}
        </div>
      )}
    </section>
  )
}
