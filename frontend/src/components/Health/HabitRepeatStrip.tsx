import { useTaskStore } from '../../store/useTaskStore'
import type { HabitoDiario } from '../../store/storeTypes'
import { useHabitHeatmap } from '../../hooks/useHabitHeatmap'
import { HabitHeatmap } from './HabitHeatmap'
import { AXEL_METRIC_HAIRLINE, AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY, AXEL_TOUCH_PRESS } from '../../constants/axelSurfaces'

const SKIP = new Set(['agua', 'proteina'])

interface HabitRowProps
{
  habito: HabitoDiario
  onIncrement: (id: number) => void
}

function HabitRow({ habito, onIncrement }: HabitRowProps)
{
  const { cells, loading } = useHabitHeatmap(habito.id)

  return (
    <li className="space-y-2 py-2 border-b border-line/50 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[13px] ${AXEL_TEXT_PRIMARY}`}>
          {habito.nome_exibicao} · {habito.progresso_atual}/{habito.meta_diaria}
        </span>
        <button
          type="button"
          disabled={habito.progresso_atual >= habito.meta_diaria}
          onClick={() => onIncrement(habito.id)}
          className={`text-[13px] font-medium text-accent min-h-11 ${AXEL_TOUCH_PRESS} disabled:opacity-40`}
        >
          +1
        </button>
      </div>
      <HabitHeatmap nome={habito.nome_exibicao} cells={cells} loading={loading} />
    </li>
  )
}

/** Hábitos com meta N - toque até completar o dia + heatmap mensal */
export function HabitRepeatStrip()
{
  const habitos = useTaskStore((s) => s.habitos)
  const incrementHabito = useTaskStore((s) => s.incrementHabito)
  const items = habitos.filter((h) => !SKIP.has(h.tipo) && h.meta_diaria > 0)

  if (items.length === 0) return null

  return (
    <section className={AXEL_METRIC_HAIRLINE} aria-label="Hábitos do dia">
      <p className={`font-mono text-[9px] uppercase tracking-[0.14em] ${AXEL_TEXT_SECONDARY}`}>
        Outros hábitos
      </p>
      <ul className="mt-2">
        {items.map((h) => (
          <HabitRow key={h.id} habito={h} onIncrement={(id) => void incrementHabito(id)} />
        ))}
      </ul>
    </section>
  )
}
