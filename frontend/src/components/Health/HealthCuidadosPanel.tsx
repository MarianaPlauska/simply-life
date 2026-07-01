import { Droplets, Dumbbell, Beef, Pill } from 'lucide-react'
import type { CuidadosTab } from '../../lib/healthRoute'
import { WaterTrackerCard } from './WaterTrackerCard'
import { ProteinGoalCard } from './ProteinGoalCard'
import { ProteinMealLog } from './ProteinMealLog'
import { AcademyView } from './AcademyView'
import { AcademyModeView } from './AcademyModeView'
import { MedicamentosView } from './MedicamentosView'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

const CUIDADOS_TABS: {
  id: CuidadosTab
  label: string
  short: string
  Icon: typeof Droplets
  color: string
  hint: string
}[] = [
  {
    id: 'hidratacao',
    label: 'Hidratação',
    short: 'Água',
    Icon: Droplets,
    color: 'text-sky-400',
    hint: 'Copos do dia e meta do ritual',
  },
  {
    id: 'alimentacao',
    label: 'Alimentação',
    short: 'Comida',
    Icon: Beef,
    color: 'text-amber-400',
    hint: 'Proteína por refeição',
  },
  {
    id: 'academia',
    label: 'Academia',
    short: 'Treino',
    Icon: Dumbbell,
    color: 'text-ink',
    hint: 'Plano, execução e histórico',
  },
  {
    id: 'medicamentos',
    label: 'Medicamentos',
    short: 'Meds',
    Icon: Pill,
    color: 'text-teal-400',
    hint: 'Agenda, cadastro e lembretes',
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
  const activeMeta = CUIDADOS_TABS.find((t) => t.id === active) ?? CUIDADOS_TABS[0]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[13px] font-semibold text-ink">Cuidados do dia</h2>
        <p className={`text-[11px] mt-1 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
          Um ritual por vez — água, comida, treino e medicamentos.
        </p>
      </div>

      <nav aria-label="Cuidados diários">
        <div className="flex gap-1 p-1 rounded-sl bg-chrome border border-line">
          {CUIDADOS_TABS.map(({ id, label, short, Icon, color }) =>
          {
            const ativo = active === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-1.5 sm:px-2 py-2 rounded-sl text-[10px] sm:text-[11px] font-mono whitespace-nowrap transition-colors min-h-[40px] ${
                  ativo
                    ? 'bg-card text-ink border border-line shadow-sm'
                    : 'text-ink-muted border border-transparent hover:text-ink'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${ativo ? color : ''}`} />
                <span className="sm:hidden">{short}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <p className={`text-[10px] font-mono uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
        {activeMeta.hint}
      </p>

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
