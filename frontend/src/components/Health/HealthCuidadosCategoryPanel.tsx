import { Droplets, Dumbbell, Beef, Pill } from 'lucide-react'
import type { CuidadosTab } from '../../lib/healthRoute'
import { WaterTrackerCard } from './WaterTrackerCard'
import { ProteinQuickCapture } from './ProteinQuickCapture'
import { AcademyView } from './AcademyView'
import { AcademyModeView } from './AcademyModeView'
import { MedicamentosView } from './MedicamentosView'
import { useTaskStore } from '../../store/useTaskStore'

interface HealthCuidadosCategoryPanelProps
{
  active: CuidadosTab
}

/** Detalhe de uma categoria - sob demanda, após chips */
export function HealthCuidadosCategoryPanel({ active }: HealthCuidadosCategoryPanelProps)
{
  const sessaoTreinoAtiva = useTaskStore((s) => s.sessaoTreinoAtiva)

  return (
    <div className="min-w-0 border-t border-line/80 pt-4">
      {active === 'hidratacao' && (
        <section className="w-full min-w-0 overflow-x-hidden" aria-label="Hidratação">
          <WaterTrackerCard />
        </section>
      )}

      {active === 'alimentacao' && (
        <section className="w-full min-w-0 overflow-x-hidden" aria-label="Alimentação">
          <ProteinQuickCapture />
        </section>
      )}

      {active === 'academia' && (
        <section className="min-w-0 overflow-x-hidden" aria-label="Academia">
          {sessaoTreinoAtiva ? (
            <AcademyModeView />
          ) : (
            <AcademyView />
          )}
        </section>
      )}

      {active === 'medicamentos' && (
        <section className="min-w-0 overflow-x-hidden" aria-label="Medicamentos">
          <MedicamentosView />
        </section>
      )}
    </div>
  )
}

/** Ícones exportados para empty states futuros */
export const CUIDADOS_ICONS = { Droplets, Dumbbell, Beef, Pill }
