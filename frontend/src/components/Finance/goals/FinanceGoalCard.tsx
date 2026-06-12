import { Check, CheckCircle2, Edit3, Target } from 'lucide-react'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_PROGRESS_THICK,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'
import { FINANCE_CATEGORY_ICONS } from '../financeCategoryIcons'
import type { GoalProjection } from '../../../lib/financeGoalProjection'
import type { FinancialGoal } from '../../../store/storeTypes'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceGoalCardProps
{
  meta: FinancialGoal
  projection: GoalProjection
  editing: boolean
  editVal: string
  onEditStart: () => void
  onEditVal: (v: string) => void
  onSave: (val: number) => void
  onCancel: () => void
}

export function FinanceGoalCard({
  meta,
  projection,
  editing,
  editVal,
  onEditStart,
  onEditVal,
  onSave,
  onCancel,
}: FinanceGoalCardProps)
{
  const current = meta.valor_atual
  const pct = Math.min((current / meta.valor_alvo) * 100, 100)
  const Icon = FINANCE_CATEGORY_ICONS[meta.icone] ?? Target

  const paceClass = projection.onTrack
    ? 'text-concluido'
    : projection.monthlySavings <= 0
      ? 'text-urgente'
      : 'text-atencao'

  return (
    <article className={`${AXEL_BORDERLESS_PANEL} h-full flex flex-col`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-sl flex items-center justify-center border border-line bg-chrome shrink-0"
            style={{ color: meta.cor }}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className={`text-[13px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>
              {meta.titulo}
            </h3>
            {meta.prazo && (
              <p className={`text-[10px] font-mono ${AXEL_TEXT_SECONDARY}`}>
                Prazo {new Date(`${meta.prazo.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>
        <span className={`font-mono text-[12px] tabular-nums shrink-0 ${
          pct >= 100 ? 'text-concluido' : 'text-accent'
        }`}
        >
          {pct.toFixed(0)}%
        </span>
      </div>

      <div className="mt-4 space-y-1">
        <div className="flex justify-between font-mono text-[11px] tabular-nums">
          <span className={AXEL_TEXT_PRIMARY}>{fmt(current)}</span>
          <span className={AXEL_TEXT_SECONDARY}>Meta {fmt(meta.valor_alvo)}</span>
        </div>
        <div className={AXEL_PROGRESS_THICK}>
          <div
            className="h-full rounded-sl transition-all duration-700 bg-accent"
            style={{ width: `${pct}%`, backgroundColor: meta.cor }}
          />
        </div>
      </div>

      <p className={`text-[11px] mt-3 leading-relaxed ${paceClass}`}>
        {projection.paceMessage}
      </p>

      {projection.projectedLabel && projection.remaining > 0 && (
        <p className={`text-[10px] font-mono mt-1 ${AXEL_TEXT_SECONDARY}`}>
          Projeção: {projection.projectedLabel}
        </p>
      )}

      <div className="mt-auto pt-4 flex items-center justify-between gap-2">
        {projection.remaining > 0 ? (
          <>
            <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
              Faltam <span className="font-mono text-ink">{fmt(projection.remaining)}</span>
            </p>
            {editing ? (
              <div className="flex items-center gap-1">
                <span className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>R$</span>
                <input
                  type="number"
                  value={editVal}
                  onChange={(e) => onEditVal(e.target.value)}
                  onKeyDown={(e) =>
                  {
                    if (e.key === 'Enter') onSave(parseFloat(editVal))
                    if (e.key === 'Escape') onCancel()
                  }}
                  className="w-24 bg-chrome border border-line rounded-sl px-2 py-0.5 text-[12px] font-mono outline-none focus:border-accent/50"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => onSave(parseFloat(editVal))}
                  className="p-1 rounded-sl hover:bg-chrome text-concluido"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onEditStart}
                className={`flex items-center gap-1 text-[11px] font-mono uppercase ${AXEL_TEXT_SECONDARY} hover:text-accent`}
              >
                <Edit3 className="w-3 h-3" />
                Atualizar
              </button>
            )}
          </>
        ) : (
          <p className="text-[11px] text-concluido font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Meta atingida
          </p>
        )}
      </div>
    </article>
  )
}
