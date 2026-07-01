import { useMemo } from 'react'
import {
  Droplets, HeartPulse, Pill, Beef,
} from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { buildHealthRitual, ritualHeadline, isAguaRitualComplete, aguaDisplaySnapshot } from '../../lib/healthRitual'
import { countDoseProgress } from '../../lib/medicamentosSchedule'
import { snapshotNutricaoHoje } from '../../lib/healthNutrition'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import { HealthQuickTile } from './HealthQuickTile'

// Hub "Hoje" — visão leve no celular: ritual + atalhos de 1 toque (padrão Finch/Rise)

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
  const aguaCopos = agua?.progresso_atual ?? 0
  const aguaMeta = agua?.meta_diaria ?? 8
  const doseProgress = countDoseProgress(medicamentos, medicamentoTomadas)
  const medsTomados = doseProgress.tomados

  const snapshot = useMemo(
    () => buildHealthRitual({
      humorHojeCount: humorHojeLista.length,
      aguaCopos,
      aguaMeta,
      medicamentosTotal: doseProgress.total || medicamentos.length,
      medicamentosTomados: medsTomados,
    }),
    [humorHojeLista.length, aguaCopos, aguaMeta, medicamentos.length, doseProgress, medsTomados],
  )

  const headline = ritualHeadline(snapshot)
  const aguaOk = isAguaRitualComplete(aguaCopos, aguaMeta)
  const aguaSnap = aguaDisplaySnapshot(aguaCopos, aguaMeta)
  const proteinaPct = proteina && proteina.meta_diaria > 0
    ? Math.min(100, Math.round((proteina.progresso_atual / proteina.meta_diaria) * 100))
    : 0
  const nut = snapshotNutricaoHoje(habitos)

  return (
    <div className="space-y-4">
      <section className="rounded-sl border border-line bg-card p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent mb-1">
              Ritual de hoje
            </p>
            <p className={`text-[14px] sm:text-[15px] leading-snug ${AXEL_TEXT_PRIMARY}`}>
              {headline}
            </p>
            <p className={`text-[11px] mt-1.5 ${AXEL_TEXT_SECONDARY}`}>
              {snapshot.doneCount}/{snapshot.totalApplicable} cuidados · progresso parcial conta
            </p>
            {habitosStreaks.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {habitosStreaks.slice(0, 4).map((s) => (
                  <span
                    key={s.habito_id}
                    className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sl bg-chrome/50 text-accent"
                  >
                    {s.nome_exibicao} · {s.streak_dias}d
                  </span>
                ))}
              </div>
            )}
          </div>
          <div
            className="shrink-0 w-14 h-14 rounded-full border-2 border-line flex items-center justify-center relative"
            aria-hidden
          >
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-chrome" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                className="stroke-accent transition-all duration-500"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${snapshot.percent} 100`}
                pathLength={100}
              />
            </svg>
            <span className="font-mono text-[11px] tabular-nums text-ink">{snapshot.percent}%</span>
          </div>
        </div>

        <div className="h-1.5 rounded-sl bg-chrome overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${snapshot.percent}%` }}
          />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <HealthQuickTile
          icon={Droplets}
          label="Água"
          value={`${aguaSnap.copos}/${aguaSnap.ritualCopos}`}
          sub={aguaOk ? 'Ritual ok' : `${aguaSnap.ritualPct}% do ritual`}
          tone="sky"
          done={aguaOk}
          onClick={() => onSelectTab('hidratacao')}
        />
        <HealthQuickTile
          icon={HeartPulse}
          label="Humor"
          value={humorHojeLista.length > 0 ? `${humorHojeLista.length} registro${humorHojeLista.length !== 1 ? 's' : ''}` : 'Como está?'}
          sub={humorHojeLista.length > 0 ? 'Registrado hoje' : '1 toque basta'}
          tone="accent"
          done={humorHojeLista.length > 0}
          onClick={() => onSelectTab('bem_estar')}
        />
        <HealthQuickTile
          icon={Pill}
          label="Medicamentos"
          value={medicamentos.length > 0 ? `${medsTomados}/${medicamentos.length}` : 'Nenhum'}
          sub={medicamentos.length > 0 ? 'Prioridade no Kanban' : 'Cadastre se precisar'}
          tone="teal"
          done={medicamentos.length > 0 && medsTomados >= medicamentos.length}
          onClick={() => onSelectTab('medicamentos')}
        />
        <HealthQuickTile
          icon={Beef}
          label="Proteína"
          value={proteina ? `${proteina.progresso_atual}g` : 'Ativar'}
          sub={proteina ? `${nut.kcal} kcal · ${proteinaPct}% prot.` : 'Meta diária'}
          tone="amber"
          done={proteina ? proteina.progresso_atual >= proteina.meta_diaria : false}
          onClick={() => onSelectTab('alimentacao')}
        />
      </div>

      <p className="text-[11px] text-ink-muted text-center leading-relaxed px-2">
        Vitalidade conecta com Kanban e Dashboard — medicamentos atrasados sobem na fila do AXEL.
      </p>
    </div>
  )
}
