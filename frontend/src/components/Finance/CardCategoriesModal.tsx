import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Pin, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  loadCardCategories,
  removeCardCategory,
  upsertCardCategory,
  type CardCategory,
} from '../../lib/financeCardCategories'
import {
  getPinnedCardCategoryIds,
  isCardCategoryPinned,
  pinCardCategory,
  unpinCardCategory,
} from '../../lib/financeCardCategoryPins'
import { FinanceCategoryIcon } from './financeCategoryIcons'
import { FINANCE_CATEGORY_ICON_IDS } from '../../lib/financeCategoryPresets'
import {
  AXEL_BTN_PRIMARY_COMPACT,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

interface CardCategoriesModalProps
{
  cardId: string
  cardNome: string
  onClose: () => void
  autoOpenAdd?: boolean
  onChanged?: () => void
}

export function CardCategoriesModal({
  cardId,
  cardNome,
  onClose,
  autoOpenAdd = false,
  onChanged,
}: CardCategoriesModalProps)
{
  const [categorias, setCategorias] = useState<CardCategory[]>(() => loadCardCategories(cardId))
  const [pinTick, setPinTick] = useState(0)
  const [showAdd, setShowAdd] = useState(autoOpenAdd)
  const [form, setForm] = useState({ nome: '', icone: 'Wallet' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingNome, setEditingNome] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() =>
  {
    setMounted(true)
  }, [])

  const refresh = () =>
  {
    setCategorias(loadCardCategories(cardId))
    onChanged?.()
  }

  useEffect(() =>
  {
    if (autoOpenAdd)
    {
      setShowAdd(true)
    }
  }, [autoOpenAdd])

  const pinnedIds = getPinnedCardCategoryIds(cardId)
  void pinTick

  const togglePin = (cat: CardCategory) =>
  {
    if (isCardCategoryPinned(cardId, cat.id))
    {
      unpinCardCategory(cardId, cat.id)
      toast.success('Removido dos atalhos')
    }
    else
    {
      pinCardCategory(cardId, cat.id)
      toast.success('Fixado nos atalhos')
    }
    setPinTick((t) => t + 1)
    onChanged?.()
  }

  const handleAdd = () =>
  {
    if (!form.nome.trim())
    {
      toast.error('Informe o nome da categoria')
      return
    }
    upsertCardCategory(cardId, {
      nome: form.nome.trim(),
      icone: form.icone,
    })
    refresh()
    setForm({ nome: '', icone: 'Wallet' })
    setShowAdd(false)
    toast.success('Categoria criada')
  }

  const saveEdit = (cat: CardCategory) =>
  {
    if (!editingNome.trim())
    {
      toast.error('Nome inválido')
      return
    }
    upsertCardCategory(cardId, { id: cat.id, nome: editingNome.trim(), icone: cat.icone })
    setEditingId(null)
    refresh()
    toast.success('Categoria atualizada')
  }

  const handleRemove = (cat: CardCategory) =>
  {
    removeCardCategory(cardId, cat.id)
    unpinCardCategory(cardId, cat.id)
    refresh()
    toast.success('Categoria removida')
  }

  if (!mounted)
  {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md max-h-[min(85dvh,520px)] flex flex-col rounded-t-sl sm:rounded-sl border border-line bg-card shadow-xl">
        <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-line shrink-0">
          <div className="min-w-0">
            <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
              Categorias do cartão
            </p>
            <p className={`text-sm font-medium truncate ${AXEL_TEXT_PRIMARY}`}>{cardNome}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-sl text-ink-muted hover:text-ink"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 py-3 space-y-2">
          <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
            Toque no ícone de pin para fixar nos atalhos da fatura.
          </p>

          <ul className="space-y-1.5">
            {categorias.map((cat) =>
            {
              const pinned = pinnedIds.includes(cat.id)
              const editing = editingId === cat.id
              return (
                <li
                  key={cat.id}
                  className="flex items-center gap-2 rounded-sl border border-line bg-chrome/30 px-2 py-1.5"
                >
                  <FinanceCategoryIcon name={cat.icone} className="w-4 h-4 shrink-0 text-accent" />
                  {editing ? (
                    <input
                      value={editingNome}
                      onChange={(e) => setEditingNome(e.target.value)}
                      className="flex-1 min-w-0 text-sm border border-line rounded-sl bg-card px-2 py-1"
                      autoFocus
                    />
                  ) : (
                    <span className={`flex-1 min-w-0 text-sm truncate ${AXEL_TEXT_PRIMARY}`}>
                      {cat.nome}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => togglePin(cat)}
                    className={`p-1.5 rounded-sl ${pinned ? 'text-accent' : 'text-ink-muted hover:text-accent'}`}
                    aria-label={pinned ? 'Remover dos atalhos' : 'Fixar nos atalhos'}
                  >
                    <Pin size={14} className={pinned ? 'fill-current' : ''} />
                  </button>
                  {editing ? (
                    <button
                      type="button"
                      onClick={() => saveEdit(cat)}
                      className="font-mono text-[9px] uppercase text-accent px-1"
                    >
                      Salvar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                      {
                        setEditingId(cat.id)
                        setEditingNome(cat.nome)
                      }}
                      className="font-mono text-[9px] uppercase text-ink-muted hover:text-accent px-1"
                    >
                      Editar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(cat)}
                    className="p-1.5 rounded-sl text-ink-muted hover:text-urgente"
                    aria-label={`Excluir ${cat.nome}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              )
            })}
          </ul>

          {showAdd ? (
            <div className="rounded-sl border border-line bg-chrome/40 p-3 space-y-3">
              <label className="block space-y-1">
                <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Nome</span>
                <input
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex.: Parcelado, Presente, Mercado…"
                  className="w-full border border-line rounded-sl bg-card px-3 py-2 text-sm"
                  autoFocus
                />
              </label>
              <div>
                <p className={`font-mono text-[9px] uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>Ícone</p>
                <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto custom-scrollbar">
                  {FINANCE_CATEGORY_ICON_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, icone: id }))}
                      className={`p-2 rounded-sl border ${
                        form.icone === id
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-line text-ink-muted hover:border-accent/30'
                      }`}
                      aria-label={id}
                    >
                      <FinanceCategoryIcon name={id} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 min-h-[40px] px-3 font-mono text-[10px] uppercase border border-line rounded-sl text-ink-muted hover:text-ink hover:bg-chrome/50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  className={`flex-1 min-h-[40px] px-3 ${AXEL_BTN_PRIMARY_COMPACT}`}
                >
                  Criar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sl border border-dashed border-line font-mono text-[9px] uppercase text-ink-muted hover:text-accent min-h-[36px]"
            >
              <Plus size={12} />
              Nova categoria
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
