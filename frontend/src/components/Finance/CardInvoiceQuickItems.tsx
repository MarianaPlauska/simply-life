import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import type { Transaction, VirtualCard } from '../../store/storeTypes'
import { FormFieldLabel } from '../ui/FormFieldLabel'
import { MoneyInput } from '../ui/MoneyInput'
import {
  cardCategoryNome,
  loadCardCategories,
  type CardCategory,
} from '../../lib/financeCardCategories'
import { parseMoneyInputToNumber } from '../../lib/currencyInput'
import { CardCategoryPicker } from './CardCategoryPicker'
import { CardCategoriesModal } from './CardCategoriesModal'
import { FinanceCategoryIcon } from './financeCategoryIcons'
import {
  AXEL_BTN_PRIMARY_COMPACT,
  AXEL_FIELD_INPUT,
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function resolveCategoryNome(
  categorias: CardCategory[],
  categoriaId: string,
  legacyCategoria?: string,
): string
{
  const cat = categorias.find((c) => c.id === categoriaId)
  if (cat) return cardCategoryNome(cat)
  if (legacyCategoria)
  {
    const semEmoji = legacyCategoria.replace(/^[\p{Emoji}\s]+/u, '').trim()
    if (semEmoji) return semEmoji
  }
  return 'Outros'
}

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
  const [categoriaId, setCategoriaId] = useState('')
  const [categorias, setCategorias] = useState<CardCategory[]>(() => loadCardCategories(card.id))
  const [pinVersion, setPinVersion] = useState(0)
  const [catModal, setCatModal] = useState<'manage' | 'add' | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editValor, setEditValor] = useState('')
  const [editCatId, setEditCatId] = useState('')

  const today = new Date().toISOString().slice(0, 10)

  const categoriaAtual = useMemo(
    () => categorias.find((c) => c.id === categoriaId) ?? categorias[0],
    [categorias, categoriaId],
  )

  const parseValor = (raw: string): number | null =>
  {
    const n = parseMoneyInputToNumber(raw)
    if (!Number.isFinite(n) || n <= 0) return null
    return n
  }

  const refreshCategories = () =>
  {
    setCategorias(loadCardCategories(card.id))
    setPinVersion((v) => v + 1)
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
      categoria: cardCategoryNome(categoriaAtual),
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
    setEditValor(tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    const match = categorias.find((c) => c.nome === tx.categoria || tx.categoria?.endsWith(c.nome))
    setEditCatId(match?.id ?? categorias[0]?.id ?? '')
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

    const cat = categorias.find((c) => c.id === editCatId)
    await patchTransaction(editingId, {
      descricao: editDesc.trim(),
      valor: v,
      categoria: cardCategoryNome(cat),
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

      <CardCategoryPicker
        cardId={card.id}
        value={categoriaId || categorias[0]?.id || ''}
        onChange={setCategoriaId}
        pinVersion={pinVersion}
        onManageCategories={() => setCatModal('manage')}
        onAddCategory={() => setCatModal('add')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_7rem_auto] gap-2">
        <label className="block space-y-1 min-w-0">
          <FormFieldLabel required>Descrição</FormFieldLabel>
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Ex.: Mercado, Uber…"
            className={`w-full min-h-[44px] ${AXEL_FIELD_INPUT}`}
          />
        </label>
        <label className="block space-y-1">
          <FormFieldLabel required>Valor</FormFieldLabel>
          <MoneyInput value={valor} onChange={setValor} className="w-full min-h-[44px]" />
        </label>
        <div className="flex flex-col gap-1 sm:pt-[1.35rem]">
          <button
            type="button"
            onClick={() => void handleAdd()}
            className={`inline-flex items-center justify-center gap-1 min-h-[44px] h-[44px] px-3 ${AXEL_BTN_PRIMARY_COMPACT}`}
          >
            <Plus size={12} />
            Adicionar
          </button>
        </div>
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
                  <div className="flex flex-wrap gap-1">
                    {categorias.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setEditCatId(cat.id)}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] border ${
                          editCatId === cat.id ? 'border-accent text-accent' : 'border-line text-ink-muted'
                        }`}
                      >
                        <FinanceCategoryIcon name={cat.icone} className="w-3 h-3" />
                        {cat.nome}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <MoneyInput
                      value={editValor}
                      onChange={setEditValor}
                      className="flex-1"
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

            const catNome = resolveCategoryNome(categorias, '', tx.categoria)

            return (
              <li
                key={tx.id}
                className={`px-3 py-2.5 flex items-center justify-between gap-2 ${AXEL_ROW_HOVER}`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`text-[12px] truncate ${AXEL_TEXT_PRIMARY}`}>{tx.descricao}</p>
                  <p className={`font-mono text-[9px] ${AXEL_TEXT_SECONDARY}`}>
                    {tx.data.slice(0, 10).split('-').reverse().join('/')}
                    {catNome ? ` · ${catNome}` : ''}
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

      {catModal && (
        <CardCategoriesModal
          cardId={card.id}
          cardNome={card.nome}
          autoOpenAdd={catModal === 'add'}
          onClose={() => setCatModal(null)}
          onChanged={refreshCategories}
        />
      )}
    </div>
  )
}
