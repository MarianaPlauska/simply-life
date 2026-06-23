import { useMemo, useState } from 'react'
import { Plus, Settings2 } from 'lucide-react'
import type { Category, CategoryGrupo } from '../../store/storeTypes'
import { CATEGORY_GRUPO_LABELS, CATEGORY_GRUPO_ORDER } from '../../lib/financeDefaultCategories'
import {
  getSubcategories,
  getTopLevelCategories,
} from '../../lib/financeCategoryTree'
import { dedupeCategories } from '../../lib/financeCategoryDedupe'
import { CategoryPill } from './categories/CategoryPill'
import { CategoryDeleteDialog } from './categories/CategoryDeleteDialog'
import {
  AXEL_CHIP_SELECT_ACTIVE,
  AXEL_CHIP_SELECT_IDLE,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const GRUPO_ORDER = CATEGORY_GRUPO_ORDER

interface CategoryPickerProps
{
  categories: Category[]
  tipo?: 'receita' | 'despesa'
  value: number | ''
  onChange: (id: number | '') => void
  compact?: boolean
  onAddCategory?: () => void
  onAddSubcategory?: (parentId: number) => void
  onRemoveCategory?: (id: number) => void | Promise<void>
  onQuickAddCategory?: (nome: string) => void | Promise<void>
  onManageCategories?: () => void
}

export function CategoryPicker({
  categories,
  tipo = 'despesa',
  value,
  onChange,
  compact: _compact = false,
  onAddCategory,
  onAddSubcategory,
  onRemoveCategory,
  onQuickAddCategory,
  onManageCategories,
}: CategoryPickerProps)
{
  const [quickNome, setQuickNome] = useState('')
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null)

  const uniqueCategories = useMemo(
    () => dedupeCategories(categories),
    [categories],
  )

  const parents = useMemo(
    () => getTopLevelCategories(uniqueCategories, tipo),
    [uniqueCategories, tipo],
  )

  const selectedParentId = useMemo(() =>
  {
    if (value === '') return null
    const cat = uniqueCategories.find((c) => c.id === value)
    if (!cat) return null
    return cat.parent_id ?? cat.id
  }, [uniqueCategories, value])

  const subs = useMemo(() =>
  {
    if (selectedParentId == null) return []
    return getSubcategories(uniqueCategories, selectedParentId)
  }, [uniqueCategories, selectedParentId])

  const grouped = useMemo(() =>
  {
    const map = new Map<CategoryGrupo, Category[]>()
    for (const g of GRUPO_ORDER) map.set(g, [])
    for (const c of parents)
    {
      const g = c.grupo ?? 'geral'
      map.get(g)?.push(c)
    }
    return GRUPO_ORDER
      .map((g) => ({ grupo: g, items: map.get(g) ?? [] }))
      .filter((block) => block.items.length > 0)
  }, [parents])

  const pickParent = (parent: Category) =>
  {
    const children = getSubcategories(uniqueCategories, parent.id)
    if (children.length === 0)
    {
      onChange(value === parent.id ? '' : parent.id)
      return
    }
    onChange(parent.id)
  }

  const requestRemove = (id: number) =>
  {
    const cat = uniqueCategories.find((c) => c.id === id)
    if (cat) setPendingDelete(cat)
  }

  const confirmRemove = () =>
  {
    if (!pendingDelete || !onRemoveCategory) return
    const id = pendingDelete.id
    setPendingDelete(null)
    void Promise.resolve(onRemoveCategory(id))
  }

  if (parents.length === 0)
  {
    return (
      <div className="space-y-2">
        <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
          Nenhuma categoria — crie uma abaixo
        </p>
        {onAddCategory && (
          <button
            type="button"
            onClick={onAddCategory}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sl border border-dashed border-line font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY} hover:border-accent/40 hover:text-accent`}
          >
            <Plus size={12} />
            Nova categoria
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2.5 rounded-sl bg-chrome/30 p-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {(onAddCategory || onRemoveCategory) && (
            <p className={`font-mono text-[9px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
              Toque para escolher · × excluir
            </p>
          )}
          {onManageCategories && (
            <button
              type="button"
              onClick={onManageCategories}
              className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-accent hover:underline shrink-0"
            >
              <Settings2 size={11} />
              Gerenciar nomes
            </button>
          )}
        </div>
        {grouped.map(({ grupo, items }) => (
          <div key={grupo}>
            <p className={`font-mono text-[9px] uppercase tracking-wide mb-1 ${AXEL_TEXT_SECONDARY}`}>
              {CATEGORY_GRUPO_LABELS[grupo]}
            </p>
            <div className="flex flex-wrap gap-1">
              {items.map((c) => (
                <CategoryPill
                  key={c.id}
                  category={c}
                  active={selectedParentId === c.id}
                  onSelect={() => pickParent(c)}
                  onRemove={onRemoveCategory ? requestRemove : undefined}
                />
              ))}
            </div>
          </div>
        ))}

        {selectedParentId != null && subs.length > 0 && (
          <div className="pt-1 border-t border-line/60">
            <p className={`font-mono text-[9px] uppercase tracking-wide mb-1 ${AXEL_TEXT_SECONDARY}`}>
              Detalhe
            </p>
            <div className="flex flex-wrap gap-1">
              {subs.map((sub) =>
              {
                const active = value === sub.id
                return (
                  <span key={sub.id} className="inline-flex items-center">
                    <button
                      type="button"
                      onClick={() => onChange(active ? selectedParentId : sub.id)}
                      className={active ? AXEL_CHIP_SELECT_ACTIVE : AXEL_CHIP_SELECT_IDLE}
                    >
                      {sub.nome}
                    </button>
                    {onRemoveCategory && (
                      <button
                        type="button"
                        onClick={() => requestRemove(sub.id)}
                        className="ml-0.5 p-0.5 text-ink-muted/60 hover:text-urgente"
                        aria-label={`Remover ${sub.nome}`}
                      >
                        ×
                      </button>
                    )}
                  </span>
                )
              })}
              {onAddSubcategory && (
                <button
                  type="button"
                  onClick={() => onAddSubcategory(selectedParentId)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-sl border border-dashed border-line font-mono text-[9px] uppercase text-ink-muted hover:text-accent"
                >
                  <Plus size={10} />
                  Sub
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 pt-1">
          {onQuickAddCategory && (
            <form
              className="flex w-full gap-1.5"
              onSubmit={(e) =>
              {
                e.preventDefault()
                const nome = quickNome.trim()
                if (!nome) return
                void Promise.resolve(onQuickAddCategory(nome)).then(() => setQuickNome(''))
              }}
            >
              <input
                value={quickNome}
                onChange={(e) => setQuickNome(e.target.value)}
                placeholder="Nova categoria…"
                className="flex-1 min-w-0 border border-line rounded-sl bg-card px-2.5 py-1.5 text-[12px] text-ink placeholder:text-ink-muted/60"
              />
              <button
                type="submit"
                disabled={!quickNome.trim()}
                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sl border border-line font-mono text-[9px] uppercase text-accent hover:bg-accent/10 disabled:opacity-40"
              >
                <Plus size={12} />
                Criar
              </button>
            </form>
          )}
          {onAddCategory && (
            <button
              type="button"
              onClick={onAddCategory}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sl border border-dashed border-line font-mono text-[9px] uppercase text-ink-muted hover:text-accent"
            >
              <Plus size={12} />
              Nova categoria
            </button>
          )}
          {onAddSubcategory && selectedParentId != null && subs.length === 0 && (
            <button
              type="button"
              onClick={() => onAddSubcategory(selectedParentId)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sl border border-dashed border-line font-mono text-[9px] uppercase text-ink-muted hover:text-accent"
            >
              <Plus size={12} />
              Subcategoria em {uniqueCategories.find((c) => c.id === selectedParentId)?.nome}
            </button>
          )}
        </div>
      </div>

      <CategoryDeleteDialog
        open={pendingDelete != null}
        categoryName={pendingDelete?.nome ?? ''}
        isSubcategory={pendingDelete?.parent_id != null}
        onConfirm={confirmRemove}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
