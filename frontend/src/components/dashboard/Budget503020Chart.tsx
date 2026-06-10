import { MOCK_BUDGET_503020 } from '../../data/mockDashboardData'
import { ORION_PROGRESS } from '../../constants/orionSurfaces'

// Mini gráfico de barras — meta vs real da regra 50-30-20

interface BudgetCategory
{
  id: string
  label: string
  meta: number
  real: number
  barClass: string
}

const BAR_MAX_H = 56

function buildCategories(progresso: typeof MOCK_BUDGET_503020.progresso): BudgetCategory[]
{
  return [
    {
      id: 'nec',
      label: 'Nec.',
      meta: MOCK_BUDGET_503020.necessidades,
      real: progresso.necessidades,
      barClass: 'bg-gradient-to-t from-indigo-600 to-indigo-400',
    },
    {
      id: 'des',
      label: 'Des.',
      meta: MOCK_BUDGET_503020.desejos,
      real: progresso.desejos,
      barClass: 'bg-gradient-to-t from-purple-600 to-purple-400',
    },
    {
      id: 'res',
      label: 'Res.',
      meta: MOCK_BUDGET_503020.reserva,
      real: progresso.reserva,
      barClass: 'bg-gradient-to-t from-violet-700 to-violet-500',
    },
  ]
}

export function Budget503020Chart()
{
  const { progresso } = MOCK_BUDGET_503020
  const categories = buildCategories(progresso)

  return (
    <div aria-label="Gráfico da regra 50-30-20: meta versus gasto real">
      <div className="flex items-end justify-between gap-2 sm:gap-4 h-[72px] mb-3">
        {categories.map((cat) =>
        {
          const metaH = Math.max(4, Math.round((cat.meta / 100) * BAR_MAX_H))
          const realH = Math.max(4, Math.round((cat.real / 100) * BAR_MAX_H))

          return (
            <div key={cat.id} className="flex-1 flex flex-col items-center min-w-0">
              <div className="flex items-end justify-center gap-1.5 h-[56px] w-full">
                <div
                  className="w-[38%] max-w-[14px] rounded-t-sm bg-zinc-200 border border-zinc-300 dark:bg-zinc-800/90 dark:border-zinc-700/50"
                  style={{ height: metaH }}
                  title={`Meta ${cat.meta}%`}
                  aria-hidden="true"
                />
                <div
                  className={`w-[38%] max-w-[14px] rounded-t-sm ${cat.barClass}`}
                  style={{ height: realH }}
                  title={`Real ${cat.real}%`}
                  aria-hidden="true"
                />
              </div>
              <span className="mt-2 text-[10px] text-zinc-500 tabular-nums truncate w-full text-center">
                {cat.label}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-600 tracking-tight">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-zinc-200 border border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700/50" />
          Meta
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-sm ${ORION_PROGRESS}`} />
          Gasto real
        </span>
        {categories.map((cat) => (
          <span key={cat.id} className="tabular-nums">
            {cat.label} {cat.real}%
          </span>
        ))}
      </div>
    </div>
  )
}
