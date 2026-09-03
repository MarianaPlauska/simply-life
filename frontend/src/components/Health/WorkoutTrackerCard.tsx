import { useNavigate } from 'react-router-dom'
import { Dumbbell, ChevronRight, Timer } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

// Atalho Academia - card touch-friendly alinhado ao AXEL

export function WorkoutTrackerCard()
{
  const navigate = useNavigate()
  const sessaoTreinoAtiva = useTaskStore((s) => s.sessaoTreinoAtiva)
  const sessoesTreinoHoje = useTaskStore((s) => s.sessoesTreinoHoje)

  const concluidas = sessoesTreinoHoje.filter((s) => s.concluido).length
  const emAndamento = Boolean(sessaoTreinoAtiva)

  return (
    <section className="rounded-sl border border-line bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => navigate('/saude#academia')}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5 min-h-[72px] text-left hover:bg-chrome/30 transition-colors active:scale-[0.99]"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-sl bg-chrome border border-line shrink-0">
            <Dumbbell className="w-4 h-4 text-ink-muted" />
          </div>
          <div className="min-w-0">
            <h2 className={`text-[14px] font-display font-medium ${AXEL_TEXT_PRIMARY}`}>
              Academia
            </h2>
            <p className={`text-[12px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
              Cronômetro, séries e evolução de carga
            </p>
            {(emAndamento || concluidas > 0) && (
              <p className="flex items-center gap-1.5 mt-2 font-mono text-[10px] text-ink-muted">
                <Timer size={11} />
                {emAndamento ? 'Treino em andamento' : `${concluidas} sessão${concluidas !== 1 ? 'ões' : ''} hoje`}
              </p>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-ink-muted shrink-0" />
      </button>
    </section>
  )
}
