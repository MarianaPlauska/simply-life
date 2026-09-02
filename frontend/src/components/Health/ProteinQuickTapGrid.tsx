import { ALIMENTOS_PROTEINA, type RefeicaoId } from '../../constants/proteinFoods'
import { MODULE_WASH, MODULE_METRIC } from '../../constants/axelSurfaces'

interface ProteinQuickTapGridProps
{
  refeicao: RefeicaoId
  onAdd: (gramas: number, label: string, kcal: number) => Promise<void>
  busy?: boolean
}

/** Atalhos 1-toque — padrão da hidratação */
export function ProteinQuickTapGrid({ refeicao, onAdd, busy = false }: ProteinQuickTapGridProps)
{
  const foods = ALIMENTOS_PROTEINA[refeicao].slice(0, 4)

  return (
    <div className="grid grid-cols-2 gap-2">
      {foods.map((food) => (
        <button
          key={food.id}
          type="button"
          disabled={busy}
          onClick={() => void onAdd(food.gramas, food.nome, food.kcal)}
          className="text-left rounded-sl border border-line bg-chrome/30 px-3 py-2.5 min-h-[56px] hover:bg-health-muted/50 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <span className="block text-[13px] font-medium text-ink leading-snug line-clamp-2">
            {food.nome}
          </span>
          <span className={`inline-block mt-1.5 ${MODULE_WASH.health} px-1.5 py-0.5`}>
            <span className={`${MODULE_METRIC.health} text-[14px]`}>
              +{food.gramas}g
            </span>
          </span>
        </button>
      ))}
    </div>
  )
}
