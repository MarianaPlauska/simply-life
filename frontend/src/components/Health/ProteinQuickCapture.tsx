import { ProteinGoalCard } from './ProteinGoalCard'
import { ProteinMealLog } from './ProteinMealLog'

/** Alimentação — resumo + 1-toque primeiro; metas e journal sob demanda */
export function ProteinQuickCapture()
{
  return (
    <div className="space-y-4 w-full min-w-0">
      <ProteinGoalCard />
      <ProteinMealLog />
    </div>
  )
}
