import { Droplets, Dumbbell, Beef, Pill } from 'lucide-react'
import type { CuidadosTab } from '../../lib/healthRoute'
import { WaterTrackerCard } from './WaterTrackerCard'
import { ProteinGoalCard } from './ProteinGoalCard'
import { ProteinMealLog } from './ProteinMealLog'
import { AcademyView } from './AcademyView'
import { AcademyModeView } from './AcademyModeView'
import { MedicamentosView } from './MedicamentosView'
import { useTaskStore } from '../../store/useTaskStore'

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
    color: 'text-health',
  },
  {
    id: 'alimentacao',
    label: 'Alimentação',
    short: 'Comida',
    Icon: Beef,
    color: 'text-health',
  },
  {
    id: 'academia',
    label: 'Academia',
    short: 'Treino',
    Icon: Dumbbell,
    color: 'text-health',
  },
  {
    id: 'medicamentos',
    label: 'Medicamentos',
    short: 'Meds',
    Icon: Pill,
    color: 'text-health',
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
    <div className="space-y-4 min-w-0">
      <nav aria-label="Cuidados diários" className="relative z-10">
        <div className="grid grid-cols-4 gap-0.5">
          {CUIDADOS_TABS.map(({ id, label, short, Icon, color }) =>
          {
            const ativo = active === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className={`inline-flex items-center justify-center gap-1 px-1 py-1.5 text-[12px] sm:text-[13px] font-sans transition-colors border-b-2 min-h-[44px] min-w-0 ${
                  ativo
                    ? 'border-ink text-ink font-semibold'
                    : 'border-transparent text-ink-muted hover:text-ink hover:border-line'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${ativo ? color : ''}`} />
                <span className="sm:hidden truncate">{short}</span>
                <span className="hidden sm:inline truncate">{label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {active === 'hidratacao' && (
        <section className="w-full min-w-0 overflow-x-hidden">
          <WaterTrackerCard />
        </section>
      )}

      {active === 'alimentacao' && (
        <section className="grid grid-cols-1 gap-4 w-full min-w-0 overflow-x-hidden">
          <ProteinGoalCard />
          <ProteinMealLog />
        </section>
      )}

      {active === 'academia' && (
        <section className="min-w-0 overflow-x-hidden">
          {sessaoTreinoAtiva ? (
            <AcademyModeView />
          ) : (
            <AcademyView />
          )}
        </section>
      )}

      {active === 'medicamentos' && (
        <section className="min-w-0 overflow-x-hidden">
          <MedicamentosView />
        </section>
      )}
    </div>
  )
}
