import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Settings2 } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import type { ExpensePreset } from '../../lib/financeExpensePresets'
import { resolvePresetIcon, resolvePresetColor } from '../../lib/financePresetIcons'
import { FinancePresetEditor } from './FinancePresetEditor'
import { MoneyInput } from '../ui/MoneyInput'
import { formatCentsToBrl, parseMoneyInputToNumber } from '../../lib/currencyInput'
import {
  AXEL_SEG_IDLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceQuickPresetsProps
{
  onLaunched?: () => void
}

export function FinanceQuickPresets({ onLaunched }: FinanceQuickPresetsProps)
{
  const presets = useTaskStore((s) => s.expensePresets)
  const saveExpensePresets = useTaskStore((s) => s.saveExpensePresets)
  const addTransaction = useTaskStore((s) => s.addTransaction)
  const categories = useTaskStore((s) => s.categories)

  const [editorOpen, setEditorOpen] = useState(false)
  const [pending, setPending] = useState<ExpensePreset | null>(null)
  const [pendingVal, setPendingVal] = useState('')
  const [saveValorToPreset, setSaveValorToPreset] = useState(true)

  const launch = async (preset: ExpensePreset, valor: number) =>
  {
    const cat = preset.categoria_id
      ? categories.find((c) => c.id === preset.categoria_id)
      : categories.find((c) => c.nome === preset.categoria || c.tipo === 'despesa')

    await addTransaction({
      descricao: preset.label,
      valor,
      tipo: 'despesa',
      categoria: cat?.nome ?? preset.categoria ?? 'outros',
      categoria_id: preset.categoria_id ?? cat?.id,
      data: new Date().toISOString().slice(0, 10),
      status_pagamento: preset.status_pagamento,
      forma_pagamento: preset.forma_pagamento ?? (preset.card_id ? 'cartao' : 'debito'),
      card_id: preset.card_id,
    })

    toast.success(`${preset.label} · ${fmt(valor)}`)
    onLaunched?.()
  }

  const handlePresetClick = (preset: ExpensePreset) =>
  {
    setPending(preset)
    setPendingVal(
      preset.valor != null && preset.valor > 0
        ? formatCentsToBrl(Math.round(preset.valor * 100))
        : '',
    )
    setSaveValorToPreset(true)
  }

  const confirmPending = () =>
  {
    if (!pending) return
    const val = parseMoneyInputToNumber(pendingVal)
    if (Number.isNaN(val) || val <= 0)
    {
      toast.error('Informe um valor válido')
      return
    }

    if (saveValorToPreset)
    {
      saveExpensePresets(
        presets.map((p) => (p.id === pending.id ? { ...p, valor: val } : p)),
      )
    }

    void launch(pending, val)
    setPending(null)
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className={`font-mono text-[9px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
          Lançar em 1 toque
        </p>
        <button
          type="button"
          onClick={() => setEditorOpen(true)}
          className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-accent hover:underline"
        >
          <Settings2 size={11} />
          Gerenciar
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {presets.map((p) =>
        {
          const Icon = resolvePresetIcon(p)
          const color = resolvePresetColor(p, categories)
          return (
          <button
            key={p.id}
            type="button"
            onClick={() => handlePresetClick(p)}
            className={`group relative max-w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-sl font-mono text-[10px] uppercase tracking-wide transition-colors min-h-[30px] ${AXEL_SEG_IDLE}`}
          >
            <Icon size={12} className="w-3 h-3 shrink-0" style={{ color }} strokeWidth={2} />
            <span className="truncate max-w-[88px] sm:max-w-[120px] font-medium normal-case text-[11px]">
              {p.label}
            </span>
            {p.valor != null && p.valor > 0 && (
              <span className="font-mono text-[9px] tabular-nums text-accent normal-case">
                {fmt(p.valor)}
              </span>
            )}
            <Pencil
              size={10}
              className="absolute top-1 right-1 text-ink-muted opacity-0 group-hover:opacity-100"
              aria-hidden
            />
          </button>
          )
        })}
      </div>

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setPending(null)}
            aria-label="Cancelar"
          />
          <div className="relative border border-line rounded-sl bg-card p-4 w-full max-w-xs shadow-xl">
            <p className={`text-sm font-medium flex items-center gap-2 ${AXEL_TEXT_PRIMARY}`}>
              {(() =>
              {
                const Icon = resolvePresetIcon(pending)
                const color = resolvePresetColor(pending, categories)
                return <Icon size={16} className="w-4 h-4 shrink-0" style={{ color }} />
              })()}
              {pending.label}
            </p>
            <p className={`text-[10px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
              Ajuste o valor antes de lançar
            </p>
            <MoneyInput
              value={pendingVal}
              onChange={setPendingVal}
              placeholder="Valor (R$)"
              className="mt-3 w-full min-h-[44px] text-base"
            />
            <label className="mt-3 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={saveValorToPreset}
                onChange={(e) => setSaveValorToPreset(e.target.checked)}
                className="rounded border-line"
              />
              <span className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
                Lembrar este valor no atalho
              </span>
            </label>
            <button
              type="button"
              onClick={confirmPending}
              className={`mt-3 w-full py-2 font-mono text-[10px] uppercase bg-accent hover:bg-accent-hover text-white font-bold rounded-sl`}
            >
              Lançar
            </button>
          </div>
        </div>
      )}

      {editorOpen && <FinancePresetEditor onClose={() => setEditorOpen(false)} />}
    </>
  )
}
