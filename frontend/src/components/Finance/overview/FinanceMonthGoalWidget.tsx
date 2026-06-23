import { useEffect, useMemo, useState } from 'react'
import { Pencil, Target, X } from 'lucide-react'
import type { Transaction } from '../../../store/storeTypes'
import {
  clearMonthSavingsGoal,
  computeMonthGoalProgress,
  hydrateMonthSavingsGoal,
  loadMonthSavingsGoal,
  saveMonthSavingsGoal,
} from '../../../lib/financeMonthGoal'
import {
  AXEL_PROGRESS_THICK,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceMonthGoalWidgetProps
{
  monthTransactions: Transaction[]
  monthOffset?: number
  compact?: boolean
}

// Meta de poupança do mês — ex.: poupar X até o dia 30

export function FinanceMonthGoalWidget({
  monthTransactions,
  monthOffset = 0,
  compact = false,
}: FinanceMonthGoalWidgetProps)
{
  const [goal, setGoal] = useState(() => loadMonthSavingsGoal())
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  useEffect(() =>
  {
    void hydrateMonthSavingsGoal().then((g) =>
    {
      if (g) setGoal(g)
    })
  }, [])

  const isCurrentMonth = monthOffset === 0

  const progress = useMemo(() =>
  {
    if (!goal) return null
    return computeMonthGoalProgress(monthTransactions, goal.valorAlvo)
  }, [goal, monthTransactions])

  if (!isCurrentMonth) return null

  const startEdit = () =>
  {
    setDraft(goal ? String(goal.valorAlvo) : '')
    setEditing(true)
  }

  const save = () =>
  {
    const val = Number(draft.replace(',', '.'))
    if (Number.isNaN(val) || val <= 0) return
    const saved = saveMonthSavingsGoal(val, goal?.titulo)
    setGoal(saved)
    setEditing(false)
  }

  const remove = () =>
  {
    if (!confirm('Remover a meta de poupança deste mês? Você pode definir outra depois.')) return
    clearMonthSavingsGoal()
    setGoal(null)
    setEditing(false)
  }

  if (!goal && !editing)
  {
    return (
      <button
        type="button"
        onClick={startEdit}
        className={`w-full rounded-sl border border-dashed border-line bg-card/50 text-left hover:bg-chrome/30 transition-colors ${
          compact ? 'p-2.5' : 'p-3'
        }`}
      >
        <div className="flex items-center gap-2">
          <Target size={compact ? 14 : 16} className="text-accent shrink-0" />
          <div>
            <p className={`${compact ? 'text-[11px]' : 'text-[12px]'} font-medium ${AXEL_TEXT_PRIMARY}`}>
              Definir meta do mês
            </p>
            <p className={`text-[10px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
              Ex.: poupar R$ 500 até o fim do mês
            </p>
          </div>
        </div>
      </button>
    )
  }

  if (editing)
  {
    return (
      <section className={`rounded-sl border border-line bg-card space-y-2 ${compact ? 'p-2.5' : 'p-3'}`}>
        <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
          Meta de poupança
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            min={1}
            step={50}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ex.: 500"
            className="flex-1 min-w-0 rounded-sl border border-line bg-chrome/30 px-2 py-1.5 font-mono text-[12px]"
            autoFocus
          />
          <button
            type="button"
            onClick={save}
            className="shrink-0 px-2.5 py-1.5 rounded-sl bg-accent text-white font-mono text-[9px] uppercase"
          >
            Salvar
          </button>
          {goal && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="shrink-0 p-1.5 rounded-sl border border-line"
              aria-label="Cancelar"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </section>
    )
  }

  if (!goal || !progress) return null

  const barTone = progress.poupado >= goal.valorAlvo
    ? 'bg-concluido'
    : progress.onTrack
      ? 'bg-accent'
      : 'bg-atencao'

  return (
    <section className={`rounded-sl border border-line bg-card space-y-2 ${compact ? 'p-2.5' : 'p-3'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Target size={13} className="text-accent shrink-0" />
            <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
              Meta do mês
            </p>
          </div>
          <p className={`${compact ? 'text-[11px]' : 'text-[12px]'} font-medium mt-0.5 ${AXEL_TEXT_PRIMARY}`}>
            Poupar {fmt(goal.valorAlvo)} até dia {progress.lastDay}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={startEdit}
            className="p-1 rounded-sl hover:bg-chrome/40"
            aria-label="Editar meta"
          >
            <Pencil size={12} className="text-ink-muted" />
          </button>
          <button
            type="button"
            onClick={remove}
            className="p-1 rounded-sl hover:bg-chrome/40"
            aria-label="Remover meta deste mês"
            title="Remove só a meta atual — pode definir outra depois"
          >
            <X size={12} className="text-ink-muted" />
          </button>
        </div>
      </div>

      <div className={AXEL_PROGRESS_THICK}>
        <div
          className={`h-full rounded-sl transition-all ${barTone}`}
          style={{ width: `${progress.pct}%` }}
        />
      </div>

      <div className="flex justify-between gap-2 text-[10px]">
        <span className={`font-mono tabular-nums ${AXEL_TEXT_SECONDARY}`}>
          {fmt(progress.poupado)} poupado
        </span>
        <span className={`font-mono tabular-nums ${
          progress.falta > 0 ? 'text-atencao' : 'text-concluido'
        }`}>
          {progress.falta > 0 ? `faltam ${fmt(progress.falta)}` : 'concluída'}
        </span>
      </div>

      <p className={`text-[10px] leading-snug ${progress.onTrack ? AXEL_TEXT_SECONDARY : 'text-atencao'}`}>
        {progress.paceMessage}
      </p>
    </section>
  )
}
