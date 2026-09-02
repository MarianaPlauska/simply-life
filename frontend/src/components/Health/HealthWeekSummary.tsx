import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Droplets, Pill } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { useHealthRitualSnapshot } from '../../hooks/useHealthRitualSnapshot'
import { aguaDisplaySnapshot } from '../../lib/healthRitual'
import { buildDosesHoje, proximaDosePendente } from '../../lib/medicamentosSchedule'
import { MoodWeekSparkline } from '../wellbeing/MoodWeekSparkline'
import {
  AXEL_LINK,
  AXEL_METRIC_HAIRLINE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
  MODULE_HERO,
  MODULE_WASH,
} from '../../constants/axelSurfaces'

/** Resumo da semana — humor, água hoje e ritual (dados reais) */
export function HealthWeekSummary()
{
  const humorSemana = useTaskStore((s) => s.humorSemanaAgregado)
  const habitos = useTaskStore((s) => s.habitos)
  const medicamentos = useTaskStore((s) => s.medicamentos)
  const medicamentoTomadas = useTaskStore((s) => s.medicamentoTomadas)
  const ritual = useHealthRitualSnapshot()

  const agua = useMemo(() =>
  {
    const h = habitos.find((item) => item.tipo === 'agua')
    if (!h) return null
    const copos = h.config?.registros_ml?.length ?? h.progresso_atual ?? 0
    const meta = h.meta_diaria || 8
    return aguaDisplaySnapshot(copos, meta)
  }, [habitos])

  const proximaDose = useMemo(() =>
  {
    if (!medicamentos.length) return null
    const doses = buildDosesHoje(medicamentos, medicamentoTomadas)
    const pendente = proximaDosePendente(doses)
    if (!pendente || pendente.status === 'tomado') return null
    return pendente
  }, [medicamentos, medicamentoTomadas])

  return (
    <section className={AXEL_METRIC_HAIRLINE} aria-label="Resumo da semana">
      <p className="sl-section-label mb-2">Semana</p>

      {humorSemana.length > 0 ? (
        <div className="mb-3">
          <p className={`text-[12px] mb-1.5 ${AXEL_TEXT_SECONDARY}`}>Humor</p>
          <MoodWeekSparkline dias={humorSemana} />
        </div>
      ) : (
        <p className={`text-[12px] mb-3 ${AXEL_TEXT_SECONDARY}`}>
          Sem humor esta semana — registre quando quiser.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className={`text-[12px] mb-1 ${AXEL_TEXT_SECONDARY}`}>Água hoje</p>
          {agua ? (
            <>
              <div className={MODULE_WASH.health}>
                <p className={`${MODULE_HERO.health} text-[22px]`}>
                  {agua.copos}/{agua.meta}
                </p>
              </div>
              <p className={`text-[11px] mt-1 flex items-center gap-1 ${AXEL_TEXT_SECONDARY}`}>
                <Droplets className="w-3 h-3 text-health" aria-hidden />
                copos
              </p>
            </>
          ) : (
            <p className={`text-[12px] ${AXEL_TEXT_SECONDARY}`}>Sem meta de água</p>
          )}
        </div>
        <div>
          <p className={`text-[12px] mb-1 ${AXEL_TEXT_SECONDARY}`}>Ritual</p>
          <div className={MODULE_WASH.health}>
            <p className={`${MODULE_HERO.health} text-[22px]`}>
              {ritual.doneCount}/{ritual.totalApplicable}
            </p>
          </div>
          <p className={`text-[11px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
            {ritual.percent}% do dia
          </p>
        </div>
      </div>

      {proximaDose && (
        <div className="border-t border-line pt-2.5">
          <p className={`text-[12px] flex items-center gap-1.5 ${AXEL_TEXT_PRIMARY}`}>
            <Pill className="w-3.5 h-3.5 text-health shrink-0" aria-hidden />
            Próxima dose · {proximaDose.horario}
          </p>
          <p className={`text-[12px] mt-0.5 truncate ${AXEL_TEXT_SECONDARY}`}>
            {proximaDose.nome}
          </p>
          <Link
            to="/saude#cuidados-medicamentos"
            className={`inline-flex items-center min-h-[44px] mt-0.5 text-[13px] font-medium ${AXEL_LINK}`}
          >
            Ver medicamentos
          </Link>
        </div>
      )}
    </section>
  )
}
