import { useNavigate } from 'react-router-dom'
import { Dumbbell, ChevronRight } from 'lucide-react'

// Atalho para Modo Academia — preview monocromático, sem card pesado

export function WorkoutTrackerCard()
{
  const navigate = useNavigate()

  return (
    <section
      data-academy-mode
      className="border-t border-zinc-900 pt-6 text-zinc-200"
    >
      <button
        type="button"
        onClick={() => navigate('/foco')}
        className="group w-full flex items-center justify-between text-left"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell className="w-3.5 h-3.5 text-zinc-500" />
            <h2 className="text-[14px] font-semibold tracking-tighter text-zinc-200">
              Modo Academia
            </h2>
          </div>
          <p className="text-[12px] text-zinc-500 tracking-tight">
            Flow state · cronômetro gigante · check-in com uma mão
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
      </button>
    </section>
  )
}
