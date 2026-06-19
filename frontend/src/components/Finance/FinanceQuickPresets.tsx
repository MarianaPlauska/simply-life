import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Settings2 } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import type { ExpensePreset } from '../../lib/financeExpensePresets'
import { FinancePresetEditor } from './FinancePresetEditor'
import {
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_ROW_HOVER,
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
    setPendingVal(preset.valor != null && preset.valor > 0 ? String(preset.valor) : '')
    setSaveValorToPreset(true)
  }

  const confirmPending = () =>
  {
    if (!pending) return
    const val = parseFloat(pendingVal.replace(',', '.'))
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

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handlePresetClick(p)}
            className={`group relative flex flex-col items-start gap-0.5 p-2 md:py-1.5 md:px-2 rounded-sl border border-line bg-card text-left min-h-[56px] md:min-h-0 ${AXEL_ROW_HOVER}`}
          >
            <span className="text-base md:text-sm leading-none">{p.emoji ?? '💸'}</span>
            <span className={`text-[11px] md:text-[10px] font-medium leading-tight line-clamp-2 ${AXEL_TEXT_PRIMARY}`}>
              {p.label}
            </span>
            {p.valor != null && p.valor > 0 && (
              <span className="font-mono text-[9px] tabular-nums text-accent">
                {fmt(p.valor)}
              </span>
            )}
            <Pencil
              size={10}
              className="absolute top-1.5 right-1.5 text-ink-muted opacity-0 group-hover:opacity-100 md:opacity-60"
              aria-hidden
            />
          </button>
        ))}
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
            <p className={`text-sm font-medium ${AXEL_TEXT_PRIMARY}`}>
              {pending.emoji} {pending.label}
            </p>
            <p className={`text-[10px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
              Ajuste o valor antes de lançar
            </p>
            <input
              autoFocus
              value={pendingVal}
              onChange={(e) => setPendingVal(e.target.value)}
              placeholder="Valor (R$)"
              inputMode="decimal"
              className="mt-3 w-full border border-line rounded-sl bg-chrome px-3 py-2.5 text-base font-mono text-ink"
              onKeyDown={(e) => e.key === 'Enter' && confirmPending()}
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
              className={`mt-3 w-full py-2.5 font-mono text-[10px] uppercase ${AXEL_FILTER_PILL_ACTIVE}`}
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
