import { useEffect, useMemo, useRef, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { toast } from 'sonner'
import type { Category, CategoryGrupo } from '../../store/storeTypes'
import { CATEGORY_GRUPO_LABELS, CATEGORY_GRUPO_ORDER } from '../../lib/financeDefaultCategories'
import { getSubcategories, getTopLevelCategories } from '../../lib/financeCategoryTree'
import { FinanceCategoryIcon } from './financeCategoryIcons'
import { CategoryDeleteDialog } from './categories/CategoryDeleteDialog'
import {
  FINANCE_CATEGORY_ICON_IDS,
  FINANCE_CATEGORY_PRESET_COLORS,
} from '../../lib/financeCategoryPresets'
import {
  AXEL_BTN_PRIMARY,
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const PRESET_COLORS = FINANCE_CATEGORY_PRESET_COLORS

const GRUPOS = CATEGORY_GRUPO_ORDER

interface AddTarget
{
  grupo: CategoryGrupo
  parentId: number | null
}

interface Props
{
  onClose: () => void
  defaultParentId?: number | null
}

export function FinanceCategories({ onClose, defaultParentId = null }: Props)
{
  const categories = useTaskStore((s) => s.categories)
  const addCategory = useTaskStore((s) => s.addCategory)
  const updateCategory = useTaskStore((s) => s.updateCategory)
  const removeCategory = useTaskStore((s) => s.removeCategory)

  const [pendingDelete, setPendingDelete] = useState<Category | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingNome, setEditingNome] = useState('')

  const defaultParent = defaultParentId != null
    ? categories.find((c) => c.id === defaultParentId)
    : null

  const [addTarget, setAddTarget] = useState<AddTarget | null>(
    defaultParent
      ? { grupo: defaultParent.grupo ?? 'geral', parentId: defaultParentId }
      : null,
  )
  const [parentId, setParentId] = useState<number | null>(defaultParentId)
  const [form, setForm] = useState({
    nome: '',
    cor: PRESET_COLORS[0],
    icone: 'Wallet',
    tipo: 'despesa' as 'receita' | 'despesa',
    grupo: (defaultParent?.grupo ?? 'geral') as CategoryGrupo,
  })

  const groupRefs = useRef<Partial<Record<CategoryGrupo, HTMLDivElement | null>>>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  const parentCat = parentId != null
    ? categories.find((c) => c.id === parentId)
    : null

  useEffect(() =>
  {
    if (parentCat)
    {
      setForm((f) => ({
        ...f,
        cor: parentCat.cor,
        icone: parentCat.icone,
        tipo: parentCat.tipo,
        grupo: parentCat.grupo ?? 'geral',
      }))
    }
  }, [parentCat])

  useEffect(() =>
  {
    if (!addTarget) return
    const el = groupRefs.current[addTarget.grupo]
    if (el)
    {
      window.setTimeout(() =>
      {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 50)
    }
  }, [addTarget])

  const grouped = useMemo(() =>
  {
    const parents = getTopLevelCategories(categories)
    const map = new Map<CategoryGrupo, typeof parents>()
    for (const g of GRUPOS) map.set(g, [])
    for (const c of parents)
    {
      map.get(c.grupo ?? 'geral')?.push(c)
    }
    return GRUPOS.map((g) => ({ grupo: g, items: map.get(g) ?? [] }))
  }, [categories])

  const cancelAdd = () =>
  {
    setAddTarget(null)
    setParentId(null)
  }

  const startAdd = (pid: number | null = null, grupo: CategoryGrupo = 'geral') =>
  {
    const parent = pid != null ? categories.find((c) => c.id === pid) : null
    const targetGrupo = parent?.grupo ?? grupo
    setParentId(pid)
    setForm({
      nome: '',
      cor: parent?.cor ?? PRESET_COLORS[0],
      icone: parent?.icone ?? 'Wallet',
      tipo: parent?.tipo ?? 'despesa',
      grupo: targetGrupo,
    })
    setAddTarget({ grupo: targetGrupo, parentId: pid })
  }

  const handleAdd = async () =>
  {
    if (!form.nome.trim()) return
    try
    {
      await addCategory({
        ...form,
        parent_id: parentId,
      })
      const savedGrupo = form.grupo
      setForm({
        nome: '',
        cor: PRESET_COLORS[0],
        icone: 'Wallet',
        tipo: 'despesa',
        grupo: savedGrupo,
      })
      setParentId(null)
      setAddTarget(null)
      toast.success(parentId ? 'Subcategoria criada!' : 'Categoria criada!')
    }
    catch
    {
      toast.error('Erro ao criar categoria')
    }
  }

  const handleDelete = async (id: number) =>
  {
    try
    {
      await removeCategory(id)
      if (editingId === id) setEditingId(null)
      toast.success('Categoria removida')
    }
    catch
    {
      toast.error('Erro ao remover')
    }
  }

  const startRename = (cat: Category) =>
  {
    setEditingId(cat.id)
    setEditingNome(cat.nome)
  }

  const saveRename = async () =>
  {
    if (editingId == null) return
    const nome = editingNome.trim()
    if (!nome)
    {
      toast.error('Informe um nome')
      return
    }
    try
    {
      await updateCategory(editingId, { nome })
      setEditingId(null)
      toast.success('Nome atualizado')
    }
    catch
    {
      toast.error('Erro ao salvar')
    }
  }

  const isSubForm = parentId != null
  const showTopLevelForm = (grupo: CategoryGrupo) =>
    addTarget?.grupo === grupo && addTarget.parentId === null

  const renderAddForm = (grupo: CategoryGrupo) => (
    <div className="border-b border-accent/25 bg-accent/5 p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className={`text-[12px] sm:text-sm font-medium ${AXEL_TEXT_PRIMARY}`}>
          {isSubForm
            ? `Subcategoria em ${parentCat?.nome ?? '…'}`
            : `Nova em ${CATEGORY_GRUPO_LABELS[grupo]}`}
        </h4>
        <button
          type="button"
          onClick={cancelAdd}
          className={`font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY}`}
        >
          Cancelar
        </button>
      </div>

      <input
        type="text"
        value={form.nome}
        onChange={(e) => setForm({ ...form, nome: e.target.value })}
        placeholder={isSubForm ? 'Ex: Almoço barato, Aniversário...' : 'Ex: Netflix, Spotify...'}
        className="w-full border border-line rounded-sl bg-card px-3 py-2 text-sm text-ink"
        autoFocus
      />

      {!isSubForm && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {(['despesa', 'receita'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, tipo: t })}
                className={`px-2.5 py-1 rounded-sl font-mono text-[10px] uppercase ${
                  form.tipo === t ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
                }`}
              >
                {t === 'despesa' ? 'Gasto' : 'Receita'}
              </button>
            ))}
          </div>
          <div>
            <p className={`font-mono text-[9px] uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>Cor</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, cor: c })}
                  className={`w-6 h-6 rounded-full border-2 ${
                    form.cor === c ? 'border-ink scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <p className={`font-mono text-[9px] uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>Ícone</p>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-[min(28vh,180px)] overflow-y-auto custom-scrollbar pr-0.5">
              {FINANCE_CATEGORY_ICON_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setForm({ ...form, icone: id })}
                  className={`flex items-center justify-center w-8 h-8 rounded-sl border ${
                    form.icone === id
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-line bg-card text-ink-muted'
                  }`}
                >
                  <FinanceCategoryIcon name={id} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => void handleAdd()}
        disabled={!form.nome.trim()}
        className={`w-full py-2.5 font-mono text-[10px] uppercase ${AXEL_BTN_PRIMARY} disabled:opacity-50`}
      >
        Salvar categoria
      </button>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar"
      />

      <div className="relative w-full sm:max-w-2xl border border-line rounded-t-sl sm:rounded-sl bg-card shadow-2xl flex flex-col max-h-[min(90vh,100dvh)] sm:max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-line">
          <div>
            <h3 className={`text-base font-display ${AXEL_TEXT_PRIMARY}`}>Suas categorias</h3>
            <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
              Adicione pelo grupo · lápis para renomear
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-sl hover:bg-chrome transition-colors"
          >
            <X className="w-5 h-5 text-ink-muted" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {grouped.map(({ grupo, items }) => (
            <div
              key={grupo}
              ref={(el) => { groupRefs.current[grupo] = el }}
            >
              <p className={`font-mono text-[9px] uppercase tracking-widest mb-2 ${AXEL_TEXT_SECONDARY}`}>
                {CATEGORY_GRUPO_LABELS[grupo]}
              </p>
              <div className="border border-line rounded-sl overflow-hidden divide-y divide-line">
                {showTopLevelForm(grupo) && renderAddForm(grupo)}

                {items.length === 0 && !showTopLevelForm(grupo) && (
                  <p className={`px-3 py-4 text-[11px] ${AXEL_TEXT_SECONDARY}`}>Nenhuma neste grupo</p>
                )}

                {items.map((cat) =>
                {
                  const subs = getSubcategories(categories, cat.id)
                  const showSubForm = addTarget?.parentId === cat.id
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-chrome/50 group">
                        <div
                          className="w-8 h-8 rounded-sl flex items-center justify-center border border-line bg-card shrink-0"
                          style={{ color: cat.cor }}
                        >
                          <FinanceCategoryIcon name={cat.icone} className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingId === cat.id ? (
                            <input
                              autoFocus
                              value={editingNome}
                              onChange={(e) => setEditingNome(e.target.value)}
                              onKeyDown={(e) =>
                              {
                                if (e.key === 'Enter') void saveRename()
                                if (e.key === 'Escape') setEditingId(null)
                              }}
                              className="w-full border border-line rounded-sl bg-card px-2 py-1 text-[13px] text-ink"
                            />
                          ) : (
                            <p className={`text-[13px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>{cat.nome}</p>
                          )}
                          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>{cat.tipo}</p>
                        </div>
                        {editingId === cat.id ? (
                          <button
                            type="button"
                            onClick={() => void saveRename()}
                            className={`font-mono text-[8px] uppercase px-2 py-1 rounded-sl ${AXEL_BTN_PRIMARY}`}
                          >
                            Salvar
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startRename(cat)}
                              className="p-1.5 rounded-sl hover:bg-chrome text-ink-muted hover:text-accent"
                              aria-label={`Renomear ${cat.nome}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => startAdd(cat.id)}
                              className="font-mono text-[8px] uppercase px-2 py-1 rounded-sl border border-line text-ink-muted hover:text-accent"
                            >
                              + Sub
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDelete(cat)}
                              className="p-1.5 rounded-sl hover:bg-urgente/10 text-ink-muted hover:text-urgente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>

                      {showSubForm && renderAddForm(grupo)}

                      {subs.length > 0 && (
                        <ul className="bg-chrome/30 border-t border-line">
                          {subs.map((sub) => (
                            <li
                              key={sub.id}
                              className="flex items-center gap-2 pl-10 pr-3 py-2 hover:bg-chrome/50 group/sub"
                            >
                              {editingId === sub.id ? (
                                <input
                                  autoFocus
                                  value={editingNome}
                                  onChange={(e) => setEditingNome(e.target.value)}
                                  onKeyDown={(e) =>
                                  {
                                    if (e.key === 'Enter') void saveRename()
                                    if (e.key === 'Escape') setEditingId(null)
                                  }}
                                  className="flex-1 border border-line rounded-sl bg-card px-2 py-1 text-[12px] text-ink"
                                />
                              ) : (
                                <span className={`text-[12px] flex-1 ${AXEL_TEXT_PRIMARY}`}>{sub.nome}</span>
                              )}
                              {editingId === sub.id ? (
                                <button
                                  type="button"
                                  onClick={() => void saveRename()}
                                  className={`font-mono text-[8px] uppercase px-2 py-0.5 rounded-sl ${AXEL_BTN_PRIMARY}`}
                                >
                                  Salvar
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => startRename(sub)}
                                    className="p-1 rounded-sl hover:bg-chrome text-ink-muted hover:text-accent"
                                    aria-label={`Renomear ${sub.nome}`}
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPendingDelete(sub)}
                                    className="p-1 rounded-sl hover:bg-urgente/10 text-ink-muted hover:text-urgente"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}

                <button
                  type="button"
                  onClick={() => startAdd(null, grupo)}
                  className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 border-t border-line font-mono text-[10px] uppercase ${
                    showTopLevelForm(grupo)
                      ? 'text-accent bg-accent/5'
                      : `${AXEL_TEXT_SECONDARY} hover:bg-chrome/50 hover:text-accent`
                  } transition-colors`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar em {CATEGORY_GRUPO_LABELS[grupo]}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CategoryDeleteDialog
        open={pendingDelete != null}
        categoryName={pendingDelete?.nome ?? ''}
        isSubcategory={pendingDelete?.parent_id != null}
        onConfirm={() =>
        {
          if (!pendingDelete) return
          const id = pendingDelete.id
          setPendingDelete(null)
          void handleDelete(id)
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
