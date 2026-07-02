import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import type { Transaction, VirtualCard } from '../../store/storeTypes'
import { FormFieldLabel } from '../ui/FormFieldLabel'
import {
  AXEL_BTN_PRIMARY_COMPACT,
  AXEL_FIELD_INPUT,
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface CardInvoiceQuickItemsProps
{
  card: VirtualCard
  items: Transaction[]
}

/** Lançar e editar itens da fatura sem sair do painel */
export function CardInvoiceQuickItems({ card, items }: CardInvoiceQuickItemsProps)
{
  const addTransaction = useTaskStore((s) => s.addTransaction)
  const patchTransaction = useTaskStore((s) => s.patchTransaction)
  const removeTransaction = useTaskStore((s) => s.removeTransaction)

  const [desc, setDesc] = useState('')
  const [valor, setValor] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editValor, setEditValor] = useState('')

  const today = new Date().toISOString().slice(0, 10)

  const parseValor = (raw: string): number | null =>
  {
    const n = parseFloat(raw.replace(',', '.'))
    if (Number.isNaN(n) || n <= 0) return null
    return n
  }

  const handleAdd = async () =>
  {
    const v = parseValor(valor)
    if (!desc.trim() || v == null)
    {
      toast.error('Preencha descrição e valor')
      return
    }

    await addTransaction({
      descricao: desc.trim(),
      valor: v,
      categoria: 'Contas',
      data: today,
      tipo: 'despesa',
      status_pagamento: 'pendente',
      card_id: card.id,
      forma_pagamento: 'cartao',
    })

    setDesc('')
    setValor('')
    toast.success('Item adicionado à fatura')
  }

  const startEdit = (tx: Transaction) =>
  {
    setEditingId(tx.id)
    setEditDesc(tx.descricao)
    setEditValor(String(tx.valor).replace('.', ','))
  }

  const saveEdit = async () =>
  {
    if (editingId == null) return
    const v = parseValor(editValor)
    if (!editDesc.trim() || v == null)
    {
      toast.error('Preencha descrição e valor')
      return
    }

    await patchTransaction(editingId, {
      descricao: editDesc.trim(),
      valor: v,
    })
    setEditingId(null)
    toast.success('Item atualizado')
  }

  const handleRemove = (id: number) =>
  {
    removeTransaction(id)
    if (editingId === id) setEditingId(null)
    toast.success('Item removido')
  }

  return (
    <div className="border-b border-line px-3 sm:px-4 py-3 space-y-3 shrink-0">
      <div>
        <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
          Itens da fatura
        </p>
        <p className={`text-[10px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
          Adicione ou edite compras aqui — sem abrir outro modal.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-end">
        <label className="block space-y-1 min-w-0">
          <FormFieldLabel required>Descrição</FormFieldLabel>
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Ex.: Mercado, Uber…"
            className={`w-full ${AXEL_FIELD_INPUT}`}
          />
        </label>
        <label className="block space-y-1 sm:w-28">
          <FormFieldLabel required>Valor</FormFieldLabel>
          <input
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            className={`w-full font-mono ${AXEL_FIELD_INPUT}`}
          />
        </label>
        <button
          type="button"
          onClick={() => void handleAdd()}
          className={`inline-flex items-center justify-center gap-1 min-h-[44px] px-3 ${AXEL_BTN_PRIMARY_COMPACT}`}
        >
          <Plus size={12} />
          Adicionar
        </button>
      </div>

      {items.length > 0 && (
        <ul className="divide-y divide-line rounded-sl border border-line overflow-hidden max-h-[min(240px,32dvh)] overflow-y-auto custom-scrollbar">
          {items.map((tx) =>
          {
            const isEditing = editingId === tx.id
            if (isEditing)
            {
              return (
                <li key={tx.id} className="px-3 py-2.5 bg-chrome/40 space-y-2">
                  <input
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className={`w-full ${AXEL_FIELD_INPUT}`}
                  />
                  <div className="flex gap-2">
                    <input
                      inputMode="decimal"
                      value={editValor}
                      onChange={(e) => setEditValor(e.target.value)}
                      className={`flex-1 font-mono ${AXEL_FIELD_INPUT}`}
                    />
                    <button
                      type="button"
                      onClick={() => void saveEdit()}
                      className={`shrink-0 px-3 ${AXEL_BTN_PRIMARY_COMPACT}`}
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="shrink-0 px-2 font-mono text-[9px] uppercase text-ink-muted"
                    >
                      Cancelar
                    </button>
                  </div>
                </li>
              )
            }

            return (
              <li
                key={tx.id}
                className={`px-3 py-2.5 flex items-center justify-between gap-2 ${AXEL_ROW_HOVER}`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`text-[12px] truncate ${AXEL_TEXT_PRIMARY}`}>{tx.descricao}</p>
                  <p className={`font-mono text-[9px] ${AXEL_TEXT_SECONDARY}`}>
                    {tx.data.slice(0, 10).split('-').reverse().join('/')}
                  </p>
                </div>
                <span className="font-mono text-[12px] tabular-nums text-urgente shrink-0">
                  -{fmt(tx.valor)}
                </span>
                <div className="flex gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(tx)}
                    className="p-1.5 rounded-sl text-ink-muted hover:text-accent"
                    aria-label="Editar item"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(tx.id)}
                    className="p-1.5 rounded-sl text-ink-muted hover:text-urgente"
                    aria-label="Remover item"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
