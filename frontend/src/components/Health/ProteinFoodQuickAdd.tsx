import { useCallback, useMemo, useState } from 'react'
import { Minus, Pencil, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  ALIMENTOS_PROTEINA,
  type ProteinFood,
  type RefeicaoId,
} from '../../constants/proteinFoods'
import { kcalFromProteinGrams } from '../../lib/healthNutrition'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

interface ProteinFoodQuickAddProps
{
  refeicao: RefeicaoId
  customFoods: ProteinFood[]
  onAdd: (gramas: number, label: string, kcal?: number) => Promise<void>
  onRemove: (gramas: number, kcal?: number) => Promise<void>
  onSaveCustom: (foods: ProteinFood[]) => Promise<void>
}

function newCustomId(): string
{
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function scaleKcal(food: ProteinFood, gramas: number): number
{
  if (food.gramas <= 0) return kcalFromProteinGrams(gramas)
  return Math.round((food.kcal / food.gramas) * gramas)
}

export function ProteinFoodQuickAdd({
  refeicao,
  customFoods: customFoodsRaw,
  onAdd,
  onRemove,
  onSaveCustom,
}: ProteinFoodQuickAddProps)
{
  const customFoods = Array.isArray(customFoodsRaw) ? customFoodsRaw : []
  const catalog = ALIMENTOS_PROTEINA[refeicao]
  const allFoods = useMemo(
    () => [...catalog, ...customFoods],
    [catalog, customFoods],
  )

  const [portions, setPortions] = useState<Record<string, number>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formNome, setFormNome] = useState('')
  const [formGramas, setFormGramas] = useState('')

  const gramsFor = useCallback(
    (food: ProteinFood) => portions[food.id] ?? food.gramas,
    [portions],
  )

  const bumpPortion = (food: ProteinFood, delta: number) =>
  {
    const base = portions[food.id] ?? food.gramas
    const step = Math.max(1, Math.round(food.gramas / 10))
    const next = Math.max(1, Math.min(300, base + delta * step))
    setPortions((prev) => ({ ...prev, [food.id]: next }))
  }

  const handleAdd = async (food: ProteinFood) =>
  {
    const g = gramsFor(food)
    const kcal = scaleKcal(food, g)
    await onAdd(g, food.nome, kcal)
    toast.success(`+${g}g · ${food.nome}`, { duration: 1500 })
  }

  const handleRemove = async (food: ProteinFood) =>
  {
    const g = gramsFor(food)
    const kcal = scaleKcal(food, g)
    await onRemove(g, kcal)
    toast.info(`-${g}g · ${food.nome}`, { duration: 1500 })
  }

  const startEdit = (food: ProteinFood) =>
  {
    if (!food.id.startsWith('custom_')) return
    setEditingId(food.id)
    setFormNome(food.nome)
    setFormGramas(String(food.gramas))
    setShowForm(true)
  }

  const resetForm = () =>
  {
    setShowForm(false)
    setEditingId(null)
    setFormNome('')
    setFormGramas('')
  }

  const submitCustom = async () =>
  {
    const nome = formNome.trim()
    const gramas = parseInt(formGramas, 10)
    if (!nome || !gramas || gramas <= 0)
    {
      toast.error('Informe nome e gramas válidas')
      return
    }

    const kcal = kcalFromProteinGrams(gramas)
    let next: ProteinFood[]

    if (editingId)
    {
      next = customFoods.map((f) =>
        f.id === editingId ? { ...f, nome, gramas, kcal } : f,
      )
    }
    else
    {
      next = [...customFoods, { id: newCustomId(), nome, gramas, kcal }]
    }

    await onSaveCustom(next)
    resetForm()
    toast.success(editingId ? 'Alimento atualizado' : 'Alimento salvo')
  }

  const deleteCustom = async (id: string) =>
  {
    const next = customFoods.filter((f) => f.id !== id)
    await onSaveCustom(next)
    if (editingId === id) resetForm()
    toast.success('Alimento removido')
  }

  return (
    <div className="pt-2 border-t border-line space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>Atalhos e porções</p>
        <button
          type="button"
          onClick={() =>
          {
            resetForm()
            setShowForm((v) => !v)
          }}
          className="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-200 hover:underline min-h-[32px] px-1"
        >
          {showForm ? 'Fechar' : '+ Alimento'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-sl border border-line bg-elevated p-3 space-y-2">
          <p className={`text-[11px] font-medium ${AXEL_TEXT_PRIMARY}`}>
            {editingId ? 'Editar alimento' : 'Novo alimento'}
          </p>
          <input
            type="text"
            value={formNome}
            onChange={(e) => setFormNome(e.target.value)}
            placeholder="Nome (ex.: Whey caseiro)"
            className="w-full px-3 py-2 rounded-sl border border-line bg-elevated text-[12px] text-ink outline-none focus:border-amber-500/40 min-h-[44px]"
          />
          <input
            type="number"
            min={1}
            max={300}
            value={formGramas}
            onChange={(e) => setFormGramas(e.target.value)}
            placeholder="Proteína por porção (g)"
            className="w-full px-3 py-2 rounded-sl border border-line bg-elevated text-[12px] text-ink outline-none focus:border-amber-500/40 min-h-[44px]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void submitCustom()}
              className="flex-1 py-2 rounded-sl border border-amber-500/30 bg-amber-500/10 text-[11px] font-mono uppercase text-amber-700 dark:text-amber-200 min-h-[44px]"
            >
              {editingId ? 'Salvar' : 'Adicionar à lista'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-2 rounded-sl border border-line text-ink-muted min-h-[44px]"
                aria-label="Cancelar edição"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {allFoods.map((food) =>
        {
          const g = gramsFor(food)
          const isCustom = food.id.startsWith('custom_')
          return (
            <li
              key={food.id}
              className="flex items-stretch gap-1.5 rounded-sl border border-line bg-elevated overflow-hidden"
            >
              <button
                type="button"
                onClick={() => void handleAdd(food)}
                className="flex-1 min-w-0 px-2.5 py-2 text-left hover:bg-amber-500/5 transition-colors min-h-[48px]"
              >
                <span className="block text-[11px] text-ink truncate">{food.nome}</span>
                <span className="font-mono text-[9px] text-ink-muted tabular-nums">porção {g}g</span>
              </button>

              <div className="flex items-center border-l border-line shrink-0">
                <button
                  type="button"
                  onClick={() => bumpPortion(food, -1)}
                  className="sl-touch px-2 py-2 text-ink-muted hover:text-ink hover:bg-chrome/60 min-h-[48px] min-w-[40px]"
                  aria-label={`Menos proteína · ${food.nome}`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[10px] text-ink tabular-nums w-8 text-center">{g}</span>
                <button
                  type="button"
                  onClick={() => bumpPortion(food, 1)}
                  className="sl-touch px-2 py-2 text-ink-muted hover:text-ink hover:bg-chrome/60 min-h-[48px] min-w-[40px]"
                  aria-label={`Mais proteína · ${food.nome}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-col border-l border-line shrink-0 justify-center gap-0.5 px-1">
                <button
                  type="button"
                  onClick={() => void handleAdd(food)}
                  className="sl-touch px-2 py-1 rounded-sl text-[9px] font-mono uppercase text-amber-700 dark:text-amber-200 hover:bg-amber-500/10 min-h-[22px]"
                >
                  + dia
                </button>
                <button
                  type="button"
                  onClick={() => void handleRemove(food)}
                  className="sl-touch px-2 py-1 rounded-sl text-[9px] font-mono uppercase text-ink-muted hover:text-urgente hover:bg-urgente/5 min-h-[22px]"
                >
                  - dia
                </button>
              </div>

              {isCustom && (
                <div className="flex flex-col border-l border-line shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(food)}
                    className="sl-touch px-2 py-1.5 text-ink-muted hover:text-ink min-h-[24px]"
                    aria-label={`Editar ${food.nome}`}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteCustom(food.id)}
                    className="sl-touch px-2 py-1.5 text-ink-muted hover:text-urgente min-h-[24px]"
                    aria-label={`Excluir ${food.nome}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
