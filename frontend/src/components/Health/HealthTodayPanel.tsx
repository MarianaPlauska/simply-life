import {
  Droplets, HeartPulse, Pill, Beef,
} from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { ritualHeadline, isAguaRitualComplete, aguaDisplaySnapshot } from '../../lib/healthRitual'
import { useHealthRitualSnapshot } from '../../hooks/useHealthRitualSnapshot'
import { countDoseProgress } from '../../lib/medicamentosSchedule'
import { snapshotNutricaoHoje } from '../../lib/healthNutrition'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import { HealthQuickTile } from './HealthQuickTile'
import { HabitRepeatStrip } from './HabitRepeatStrip'

interface HealthTodayPanelProps
{
  onSelectTab: (tab: string) => void
}

export function HealthTodayPanel({ onSelectTab }: HealthTodayPanelProps)
{
  const humorHojeLista = useTaskStore((s) => s.humorHojeLista)
  const medicamentos = useTaskStore((s) => s.medicamentos)
  const medicamentoTomadas = useTaskStore((s) => s.medicamentoTomadas)
  const habitos = useTaskStore((s) => s.habitos)
  const habitosStreaks = useTaskStore((s) => s.habitosStreaks)

  const agua = habitos.find((h) => h.tipo === 'agua')
  const proteina = habitos.find((h) => h.tipo === 'proteina')
  const aguaMeta = agua?.meta_diaria ?? 10
  const doseProgress = countDoseProgress(medicamentos, medicamentoTomadas)
  const medsTomados = doseProgress.tomados

  const snapshot = useHealthRitualSnapshot()
  const aguaCopos = agua?.progresso_atual ?? 0
  const headline = ritualHeadline(snapshot)
  const aguaOk = isAguaRitualComplete(aguaCopos, aguaMeta)
  const aguaSnap = aguaDisplaySnapshot(aguaCopos, aguaMeta)
  const nut = snapshotNutricaoHoje(habitos)

  return (
    <div className="space-y-5">
      <section>
        <p className="sl-section-label">Cuidado de hoje</p>
        <p className={`mt-1 text-[1.125rem] font-display font-medium leading-snug ${AXEL_TEXT_PRIMARY}`}>
          {headline}
        </p>
        <p className={`text-[13px] mt-1.5 ${AXEL_TEXT_SECONDARY}`}>
          {snapshot.doneCount} de {snapshot.totalApplicable} — o que falta cabe hoje
        </p>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-chrome"
          aria-label={`${snapshot.percent}% do cuidado de hoje`}
        >
          <div
            className="h-full bg-health transition-all duration-500"
            style={{ width: `${snapshot.percent}%` }}
          />
        </div>
        {habitosStreaks.length > 0 && (
          <p className={`mt-2 text-[13px] ${AXEL_TEXT_SECONDARY}`}>
            {habitosStreaks.slice(0, 3).map((s) => `${s.nome_exibicao} ${s.streak_dias}d`).join(' · ')}
          </p>
        )}
      </section>

      <div>
        <HealthQuickTile
          icon={HeartPulse}
          label="Humor"
          value={humorHojeLista.length > 0 ? 'Registrado hoje' : 'Como você está?'}
          sub={humorHojeLista.length > 0 ? 'Ver o diário' : 'Um toque'}
          done={humorHojeLista.length > 0}
          onClick={() => onSelectTab('diario')}
        />
        <HealthQuickTile
          icon={Droplets}
          label="Água"
          value={`${aguaSnap.copos} de ${aguaSnap.ritualCopos} copos`}
          sub={aguaOk ? 'Ritual ok' : 'Toque para beber'}
          done={aguaOk}
          onClick={() => onSelectTab('hidratacao')}
        />
        <HealthQuickTile
          icon={Pill}
          label="Medicamentos"
          value={medicamentos.length > 0 ? `${medsTomados} de ${medicamentos.length} doses` : 'Nada cadastrado'}
          sub={medicamentos.length > 0 ? 'Agenda de hoje' : 'Cadastre se precisar'}
          done={medicamentos.length > 0 && medsTomados >= medicamentos.length}
          onClick={() => onSelectTab('medicamentos')}
        />
        <HealthQuickTile
          icon={Beef}
          label="Comida"
          value={proteina ? `${proteina.progresso_atual}g proteína` : 'Sem meta ainda'}
          sub={proteina ? `${nut.kcal} kcal` : 'Ativar alimentação'}
          done={proteina ? proteina.progresso_atual >= proteina.meta_diaria : false}
          onClick={() => onSelectTab('alimentacao')}
        />
      </div>

      <HabitRepeatStrip />
    </div>
  )
}
