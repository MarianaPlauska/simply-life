import { useState } from 'react'
import { toast } from 'sonner'
import { Settings2 } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import type { ExpensePreset } from '../../lib/financeExpensePresets'
import { DEFAULT_EXPENSE_PAYMENT } from '../../lib/financePaymentMethod'
import { FinancePresetEditor } from './FinancePresetEditor'
import {
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

interface FinanceQuickPresetsProps
{
  onLaunched?: () => void
}

export function FinanceQuickPresets({ onLaunched }: FinanceQuickPresetsProps)
{
  const presets = useTaskStore((s) => s.expensePresets)
  const addTransaction = useTaskStore((s) => s.addTransaction)
  const categories = useTaskStore((s) => s.categories)

  const [editorOpen, setEditorOpen] = useState(false)
  const [pending, setPending] = useState<ExpensePreset | null>(null)
  const [pendingVal, setPendingVal] = useState('')

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
      forma_pagamento: preset.forma_pagamento ?? (preset.card_id ? 'cartao' : DEFAULT_EXPENSE_PAYMENT),
      card_id: preset.card_id,
    })

    toast.success(`${preset.label} · ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`)
    onLaunched?.()
  }

  const handlePresetClick = (preset: ExpensePreset) =>
  {
    if (preset.valor != null && preset.valor > 0)
    {
      void launch(preset, preset.valor)
      return
    }
    setPending(preset)
    setPendingVal('')
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
    void launch(pending, val)
    setPending(null)
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
          Lançar em 1 toque
        </p>
        <button
          type="button"
          onClick={() => setEditorOpen(true)}
          className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-accent hover:underline"
        >
          <Settings2 size={12} />
          Gerenciar
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handlePresetClick(p)}
            className={`flex flex-col items-start gap-1 p-3 rounded-sl border border-line bg-card text-left min-h-[72px] ${AXEL_ROW_HOVER}`}
          >
            <span className="text-xl leading-none">{p.emoji ?? '💸'}</span>
            <span className={`text-[12px] font-medium leading-tight ${AXEL_TEXT_PRIMARY}`}>
              {p.label}
            </span>
            {p.valor != null && (
              <span className="font-mono text-[10px] tabular-nums text-accent">
                {p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            )}
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
            <input
              autoFocus
              value={pendingVal}
              onChange={(e) => setPendingVal(e.target.value)}
              placeholder="Valor (R$)"
              inputMode="decimal"
              className="mt-3 w-full border border-line rounded-sl bg-chrome px-3 py-2 font-mono text-ink"
              onKeyDown={(e) => e.key === 'Enter' && confirmPending()}
            />
            <button
              type="button"
              onClick={confirmPending}
              className={`mt-3 w-full py-2 font-mono text-[10px] uppercase ${AXEL_FILTER_PILL_ACTIVE}`}
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
