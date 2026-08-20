import { Beef, Flame } from 'lucide-react'
import { snapshotNutricaoHoje } from '../../lib/healthNutrition'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_TEXT_SECONDARY, AXEL_METRIC_HAIRLINE } from '../../constants/axelSurfaces'

/** Faixa no topo de Saúde — proteína e kcal consumidos hoje */
export function HealthNutritionStrip()
{
  const habitos = useTaskStore((s) => s.habitos)
  const nut = snapshotNutricaoHoje(habitos)
  const temRegistro = nut.gramas > 0 || nut.kcal > 0

  return (
    <section
      className={`${AXEL_METRIC_HAIRLINE} flex flex-wrap items-center gap-x-4 gap-y-2`}
      aria-label="Nutrição de hoje"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Beef className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-wide text-ink-muted">Proteína</p>
          <p className="text-[13px] font-display tabular-nums text-ink leading-none">
            {nut.gramas}g
            <span className="text-ink-muted text-[11px] font-normal"> / {nut.metaGramas}g</span>
          </p>
        </div>
        <div className="w-12 h-1 rounded-sl bg-chrome overflow-hidden shrink-0" aria-hidden>
          <div className="h-full bg-amber-500 transition-all" style={{ width: `${nut.pctProteina}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-2 min-w-0">
        <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-wide text-ink-muted">Energia</p>
          <p className="text-[13px] font-display tabular-nums text-ink leading-none">
            {nut.kcal}
            <span className="text-ink-muted text-[11px] font-normal"> / {nut.metaKcal} kcal</span>
          </p>
        </div>
        <div className="w-12 h-1 rounded-sl bg-chrome overflow-hidden shrink-0" aria-hidden>
          <div className="h-full bg-rose-500/80 transition-all" style={{ width: `${nut.pctKcal}%` }} />
        </div>
      </div>

      {!temRegistro && (
        <p className={`text-[10px] w-full sm:w-auto sm:ml-auto ${AXEL_TEXT_SECONDARY}`}>
          Registre em Cuidados → Alimentação
        </p>
      )}
    </section>
  )
}
