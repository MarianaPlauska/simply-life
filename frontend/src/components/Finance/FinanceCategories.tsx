import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { toast } from 'sonner'
import type { CategoryGrupo } from '../../store/storeTypes'
import { CATEGORY_GRUPO_LABELS } from '../../lib/financeDefaultCategories'
import { getSubcategories, getTopLevelCategories } from '../../lib/financeCategoryTree'
import { FinanceCategoryIcon, FINANCE_CATEGORY_ICONS } from './financeCategoryIcons'
import {
  AXEL_BTN_PRIMARY,
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const PRESET_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
]

const GRUPOS: CategoryGrupo[] = ['casa', 'contas', 'futuro', 'geral']

interface Props
{
  onClose: () => void
  defaultParentId?: number | null
}

export function FinanceCategories({ onClose, defaultParentId = null }: Props)
{
  const categories = useTaskStore((s) => s.categories)
  const addCategory = useTaskStore((s) => s.addCategory)
  const removeCategory = useTaskStore((s) => s.removeCategory)

  const [isAdding, setIsAdding] = useState(defaultParentId != null)
  const [parentId, setParentId] = useState<number | null>(defaultParentId)
  const [form, setForm] = useState({
    nome: '',
    cor: PRESET_COLORS[0],
    icone: 'Wallet',
    tipo: 'despesa' as 'receita' | 'despesa',
    grupo: 'geral' as CategoryGrupo,
  })

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

  const startAdd = (pid: number | null = null) =>
  {
    setParentId(pid)
    setForm({
      nome: '',
      cor: PRESET_COLORS[0],
      icone: 'Wallet',
      tipo: 'despesa',
      grupo: 'geral',
    })
    setIsAdding(true)
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
      setForm({
        nome: '',
        cor: PRESET_COLORS[0],
        icone: 'Wallet',
        tipo: 'despesa',
        grupo: 'geral',
      })
      setParentId(null)
      setIsAdding(false)
      toast.success(parentId ? 'Subcategoria criada!' : 'Categoria criada!')
    }
    catch
    {
      toast.error('Erro ao criar categoria')
    }
  }

  const handleDelete = async (id: number) =>
  {
    if (!confirm('Excluir? Subcategorias e lançamentos podem ficar órfãos.')) return
    try
    {
      await removeCategory(id)
      toast.success('Removido')
    }
    catch
    {
      toast.error('Erro ao remover')
    }
  }

  const isSubForm = parentId != null

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
              Categorias e subcategorias — ex: Alimentação › Aniversário
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {isAdding ? (
            <div className="border border-line rounded-sl bg-chrome/40 p-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className={`text-sm font-medium ${AXEL_TEXT_PRIMARY}`}>
                  {isSubForm
                    ? `Subcategoria em ${parentCat?.nome ?? '…'}`
                    : 'Nova categoria'}
                </h4>
                <button
                  type="button"
                  onClick={() =>
                  {
                    setIsAdding(false)
                    setParentId(null)
                  }}
                  className={`font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY}`}
                >
                  Cancelar
                </button>
              </div>

              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder={isSubForm ? 'Ex: Almoço barato, Aniversário...' : 'Ex: Alimentação, Transporte...'}
                className="w-full border border-line rounded-sl bg-card px-3 py-2 text-sm text-ink"
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
                    <p className={`font-mono text-[9px] uppercase mb-1.5 ${AXEL_TEXT_SECONDARY}`}>Grupo</p>
                    <div className="flex flex-wrap gap-1.5">
                      {GRUPOS.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setForm({ ...form, grupo: g })}
                          className={`px-2.5 py-1 rounded-sl font-mono text-[10px] uppercase ${
                            form.grupo === g ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
                          }`}
                        >
                          {CATEGORY_GRUPO_LABELS[g]}
                        </button>
                      ))}
                    </div>
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
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
                      {Object.keys(FINANCE_CATEGORY_ICONS).map((id) => (
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
                Salvar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => startAdd(null)}
              className="w-full py-4 border-2 border-dashed border-line rounded-sl flex flex-col items-center gap-2 text-ink-muted hover:border-accent/40 hover:text-accent transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="text-[12px] font-medium">Nova categoria</span>
            </button>
          )}

          {grouped.map(({ grupo, items }) => (
            <div key={grupo}>
              <p className={`font-mono text-[9px] uppercase tracking-widest mb-2 ${AXEL_TEXT_SECONDARY}`}>
                {CATEGORY_GRUPO_LABELS[grupo]}
              </p>
              <div className="border border-line rounded-sl overflow-hidden divide-y divide-line">
                {items.length === 0 && (
                  <p className={`px-3 py-4 text-[11px] ${AXEL_TEXT_SECONDARY}`}>Nenhuma neste grupo</p>
                )}
                {items.map((cat) =>
                {
                  const subs = getSubcategories(categories, cat.id)
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
                          <p className={`text-[13px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>{cat.nome}</p>
                          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>{cat.tipo}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => startAdd(cat.id)}
                          className="font-mono text-[8px] uppercase px-2 py-1 rounded-sl border border-line text-ink-muted hover:text-accent"
                        >
                          + Sub
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(cat.id)}
                          className="p-1.5 rounded-sl hover:bg-urgente/10 text-ink-muted hover:text-urgente opacity-70 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {subs.length > 0 && (
                        <ul className="bg-chrome/30 border-t border-line">
                          {subs.map((sub) => (
                            <li
                              key={sub.id}
                              className="flex items-center gap-2 pl-10 pr-3 py-2 hover:bg-chrome/50 group/sub"
                            >
                              <span className={`text-[12px] flex-1 ${AXEL_TEXT_PRIMARY}`}>{sub.nome}</span>
                              <button
                                type="button"
                                onClick={() => void handleDelete(sub.id)}
                                className="p-1 rounded-sl hover:bg-urgente/10 text-ink-muted hover:text-urgente opacity-70 sm:opacity-0 sm:group-hover/sub:opacity-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
