import { useState } from 'react'
import { X, Plus, Trash2, Check, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import type { ExpensePreset } from '../../lib/financeExpensePresets'
import { createPresetId } from '../../lib/financeExpensePresets'
import { resolvePresetIcon } from '../../lib/financePresetIcons'
import {
  AXEL_BTN_PRIMARY,
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { MoneyInput } from '../ui/MoneyInput'
import { formatCentsToBrl, parseMoneyInputToNumber } from '../../lib/currencyInput'

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
    valor: '',
    categoria_id: '' as string,
    status_pagamento: 'pago' as 'pago' | 'pendente',
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState({
    label: '',
    valor: '',
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
    const val = draft.valor ? parseMoneyInputToNumber(draft.valor) : undefined

    const next: ExpensePreset[] = [
      ...presets,
      {
        id: createPresetId(),
        label: draft.label.trim(),
        icon: 'wallet',
        valor: val && !Number.isNaN(val) ? val : undefined,
        categoria_id: catId,
        categoria: cat?.nome,
        status_pagamento: draft.status_pagamento,
      },
    ]

    saveExpensePresets(next)
    setDraft({ label: '', valor: '', categoria_id: '', status_pagamento: 'pago' })
    toast.success('Atalho adicionado')
  }

  const startEdit = (p: ExpensePreset) =>
  {
    setEditingId(p.id)
    setEditDraft({
      label: p.label,
      valor: p.valor != null ? formatCentsToBrl(Math.round(p.valor * 100)) : '',
    })
  }

  const saveEdit = () =>
  {
    if (!editingId) return
    if (!editDraft.label.trim())
    {
      toast.error('Nome obrigatório')
      return
    }

    const val = editDraft.valor
      ? parseMoneyInputToNumber(editDraft.valor)
      : undefined

    const next = presets.map((p) =>
    {
      if (p.id !== editingId) return p
      return {
        ...p,
        label: editDraft.label.trim(),
        valor: val && !Number.isNaN(val) && val > 0 ? val : undefined,
      }
    })

    saveExpensePresets(next)
    setEditingId(null)
    toast.success('Atalho atualizado')
  }

  const handleRemove = (id: string) =>
  {
    saveExpensePresets(presets.filter((p) => p.id !== id))
    if (editingId === id) setEditingId(null)
  }

  const handleReset = () =>
  {
    if (!confirm('Restaurar atalhos padrão? Seus customizados serão substituídos.')) return
    saveExpensePresets(null)
    setEditingId(null)
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
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              placeholder="Nome - ex: Padaria"
              className="col-span-8 border border-line rounded-sl bg-chrome px-3 py-2 text-sm text-ink"
            />
            <MoneyInput
              value={draft.valor}
              onChange={(v) => setDraft({ ...draft, valor: v })}
              placeholder="R$ opcional"
              className="col-span-4 text-sm"
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

          <ul className="border border-line rounded-sl divide-y divide-line max-h-[280px] overflow-y-auto">
            {presets.map((p) =>
            {
              const isEditing = editingId === p.id
              return (
                <li key={p.id} className={`px-3 py-2.5 ${AXEL_ROW_HOVER}`}>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2">
                        <input
                          value={editDraft.label}
                          onChange={(e) => setEditDraft({ ...editDraft, label: e.target.value })}
                          className="col-span-8 border border-line rounded-sl bg-chrome px-2 py-1.5 text-sm text-ink"
                        />
                        <MoneyInput
                          value={editDraft.valor}
                          onChange={(v) => setEditDraft({ ...editDraft, valor: v })}
                          placeholder="R$"
                          className="col-span-4 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={saveEdit}
                          className={`inline-flex items-center gap-1 px-2 py-1 font-mono text-[9px] uppercase ${AXEL_BTN_PRIMARY}`}
                        >
                          <Check size={12} />
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="font-mono text-[9px] uppercase text-ink-muted"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {(() =>
                      {
                        const Icon = resolvePresetIcon(p)
                        return <Icon size={16} className="text-ink-muted shrink-0 w-8" />
                      })()}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${AXEL_TEXT_PRIMARY}`}>{p.label}</p>
                        <p className={`font-mono text-[10px] ${AXEL_TEXT_SECONDARY}`}>
                          {p.valor != null
                            ? p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            : 'Sem valor fixo'}
                          {p.categoria ? ` · ${p.categoria}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="text-ink-muted hover:text-accent p-1"
                        aria-label={`Editar ${p.label}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(p.id)}
                        className="text-ink-muted hover:text-urgente p-1"
                        aria-label={`Remover ${p.label}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          <button
            type="button"
            onClick={handleReset}
            className="w-full font-mono text-[10px] uppercase text-ink-muted hover:text-accent py-2"
          >
            Restaurar padrões (sem valores fixos)
          </button>
        </div>
      </div>
    </div>
  )
}
