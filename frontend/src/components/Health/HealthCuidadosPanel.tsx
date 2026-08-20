import { Droplets, Dumbbell, Beef, Pill } from 'lucide-react'
import type { CuidadosTab } from '../../lib/healthRoute'
import { WaterTrackerCard } from './WaterTrackerCard'
import { ProteinGoalCard } from './ProteinGoalCard'
import { ProteinMealLog } from './ProteinMealLog'
import { AcademyView } from './AcademyView'
import { AcademyModeView } from './AcademyModeView'
import { MedicamentosView } from './MedicamentosView'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_NAV_SUB_ACTIVE, AXEL_NAV_SUB_IDLE } from '../../constants/axelSurfaces'

const CUIDADOS_TABS: {
  id: CuidadosTab
  label: string
  short: string
  Icon: typeof Droplets
  color: string
}[] = [
  {
    id: 'hidratacao',
    label: 'Hidratação',
    short: 'Água',
    Icon: Droplets,
    color: 'text-sky-400',
  },
  {
    id: 'alimentacao',
    label: 'Alimentação',
    short: 'Comida',
    Icon: Beef,
    color: 'text-amber-400',
  },
  {
    id: 'academia',
    label: 'Academia',
    short: 'Treino',
    Icon: Dumbbell,
    color: 'text-ink',
  },
  {
    id: 'medicamentos',
    label: 'Medicamentos',
    short: 'Meds',
    Icon: Pill,
    color: 'text-accent',
  },
]

interface HealthCuidadosPanelProps
{
  active: CuidadosTab
  onSelect: (tab: CuidadosTab) => void
}

export function HealthCuidadosPanel({ active, onSelect }: HealthCuidadosPanelProps)
{
  const sessaoTreinoAtiva = useTaskStore((s) => s.sessaoTreinoAtiva)

  return (
    <div className="space-y-4">
      <nav aria-label="Cuidados diários">
        <div className="flex gap-0.5 overflow-x-auto scrollbar-none -mx-0.5">
          {CUIDADOS_TABS.map(({ id, label, short, Icon, color }) =>
          {
            const ativo = active === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className={`${ativo ? AXEL_NAV_SUB_ACTIVE : AXEL_NAV_SUB_IDLE} min-h-[44px]`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${ativo ? color : ''}`} />
                <span className="sm:hidden">{short}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {active === 'hidratacao' && (
        <section className="w-full">
          <WaterTrackerCard />
        </section>
      )}

      {active === 'alimentacao' && (
        <section className="grid grid-cols-1 gap-4 w-full">
          <ProteinGoalCard />
          <ProteinMealLog />
        </section>
      )}

      {active === 'academia' && (
        <section>
          {sessaoTreinoAtiva ? (
            <AcademyModeView />
          ) : (
            <AcademyView />
          )}
        </section>
      )}

      {active === 'medicamentos' && (
        <section>
          <MedicamentosView />
        </section>
      )}
    </div>
  )
}
