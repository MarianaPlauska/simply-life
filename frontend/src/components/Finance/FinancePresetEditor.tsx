import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import type { ExpensePreset } from '../../lib/financeExpensePresets'
import { createPresetId } from '../../lib/financeExpensePresets'
import {
  AXEL_BTN_PRIMARY,
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

interface FinancePresetEditorProps
{
  onClose: () => void
}

export function FinancePresetEditor({ onClose }: FinancePresetEditorProps)
{
  const presets = useTaskStore((s) => s.expensePresets)
  const saveExpensePresets = useTaskStore((s) => s.saveExpensePresets)
  const categories = useTaskStore((s) => s.categories).filter((c) => c.tipo === 'despesa')

  const [draft, setDraft] = useState({
    label: '',
    emoji: '💸',
    valor: '',
    categoria_id: '' as string,
    status_pagamento: 'pago' as 'pago' | 'pendente',
  })

  const handleAdd = () =>
  {
    if (!draft.label.trim())
    {
      toast.error('Dê um nome ao atalho')
      return
    }

    const catId = draft.categoria_id ? Number(draft.categoria_id) : undefined
    const cat = catId ? categories.find((c) => c.id === catId) : undefined
    const val = draft.valor ? parseFloat(draft.valor.replace(',', '.')) : undefined

    const next: ExpensePreset[] = [
      ...presets,
      {
        id: createPresetId(),
        label: draft.label.trim(),
        emoji: draft.emoji || '💸',
        valor: val && !Number.isNaN(val) ? val : undefined,
        categoria_id: catId,
        categoria: cat?.nome,
        status_pagamento: draft.status_pagamento,
      },
    ]

    saveExpensePresets(next)
    setDraft({ label: '', emoji: '💸', valor: '', categoria_id: '', status_pagamento: 'pago' })
    toast.success('Atalho adicionado')
  }

  const handleRemove = (id: string) =>
  {
    saveExpensePresets(presets.filter((p) => p.id !== id))
  }

  const handleReset = () =>
  {
    if (!confirm('Restaurar atalhos padrão? Seus customizados serão substituídos.')) return
    saveExpensePresets(null)
    toast.success('Atalhos padrão restaurados')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Fechar" />
      <div className="relative w-full sm:max-w-md border border-line rounded-sl bg-card shadow-xl max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-line shrink-0">
          <h2 className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
            Atalhos de gasto
          </h2>
          <button type="button" onClick={onClose} className="text-ink-muted hover:text-ink p-1">
            <X size={18} />
          </button>
        </header>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-12 gap-2">
            <input
              value={draft.emoji}
              onChange={(e) => setDraft({ ...draft, emoji: e.target.value.slice(0, 2) })}
              className="col-span-2 border border-line rounded-sl bg-chrome px-2 py-2 text-center text-lg"
              aria-label="Emoji"
            />
            <input
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              placeholder="Nome — ex: Padaria"
              className="col-span-6 border border-line rounded-sl bg-chrome px-3 py-2 text-sm text-ink"
            />
            <input
              value={draft.valor}
              onChange={(e) => setDraft({ ...draft, valor: e.target.value })}
              placeholder="R$"
              inputMode="decimal"
              className="col-span-4 border border-line rounded-sl bg-chrome px-3 py-2 text-sm font-mono text-ink"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={draft.categoria_id}
              onChange={(e) => setDraft({ ...draft, categoria_id: e.target.value })}
              className="flex-1 min-w-[140px] border border-line rounded-sl bg-chrome px-2 py-2 text-[11px] font-mono text-ink"
            >
              <option value="">Categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            <select
              value={draft.status_pagamento}
              onChange={(e) => setDraft({
                ...draft,
                status_pagamento: e.target.value as 'pago' | 'pendente',
              })}
              className="border border-line rounded-sl bg-chrome px-2 py-2 text-[11px] font-mono text-ink"
            >
              <option value="pago">Desconta saldo</option>
              <option value="pendente">Só anotar</option>
            </select>
            <button
              type="button"
              onClick={handleAdd}
              className={`inline-flex items-center gap-1 px-3 py-2 font-mono text-[10px] uppercase ${AXEL_BTN_PRIMARY}`}
            >
              <Plus size={14} />
              Adicionar
            </button>
          </div>

          <ul className="border border-line rounded-sl divide-y divide-line max-h-[240px] overflow-y-auto">
            {presets.map((p) => (
              <li
                key={p.id}
                className={`flex items-center gap-3 px-3 py-2.5 ${AXEL_ROW_HOVER}`}
              >
                <span className="text-lg w-8 text-center">{p.emoji ?? '💸'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${AXEL_TEXT_PRIMARY}`}>{p.label}</p>
                  <p className={`font-mono text-[10px] ${AXEL_TEXT_SECONDARY}`}>
                    {p.valor != null
                      ? p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : 'Valor na hora'}
                    {p.categoria ? ` · ${p.categoria}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(p.id)}
                  className="text-ink-muted hover:text-urgente p-1"
                  aria-label={`Remover ${p.label}`}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handleReset}
            className="w-full font-mono text-[10px] uppercase text-ink-muted hover:text-accent py-2"
          >
            Restaurar padrões
          </button>
        </div>
      </div>
    </div>
  )
}
