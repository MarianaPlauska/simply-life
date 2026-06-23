import { useMemo } from 'react'
import { Beef, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { PROTEINA_PRESET } from '../../constants/healthPresets'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

export function ProteinGoalCard()
{
  const habitos = useTaskStore((s) => s.habitos)
  const ensureHealthHabit = useTaskStore((s) => s.ensureHealthHabit)
  const incrementHabitoBy = useTaskStore((s) => s.incrementHabitoBy)
  const decrementHabito = useTaskStore((s) => s.decrementHabito)
  const updateHabitoMeta = useTaskStore((s) => s.updateHabitoMeta)
  const setHabitoProgress = useTaskStore((s) => s.setHabitoProgress)

  const proteina = useMemo(() => habitos.find((h) => h.tipo === 'proteina'), [habitos])
  const step = proteina?.config?.incremento ?? 10
  const current = proteina?.progresso_atual ?? 0
  const goal = proteina?.meta_diaria ?? PROTEINA_PRESET.meta_diaria
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0
  const done = current >= goal && goal > 0

  const ensureProteina = async () =>
  {
    return proteina ?? await ensureHealthHabit(PROTEINA_PRESET)
  }

  const handleAdd = async () =>
  {
    const h = await ensureProteina()
    if (!h) return
    if (h.progresso_atual >= h.meta_diaria)
    {
      toast.info('Meta de proteína já atingida!')
      return
    }
    await incrementHabitoBy(h.id, step)
    toast.success(`+${step}g de proteína`, { duration: 1500 })
  }

  const handleUndo = async () =>
  {
    if (!proteina || current <= 0) return
    await decrementHabito(proteina.id)
  }

  const handleMeta = async (raw: string) =>
  {
    const h = await ensureProteina()
    if (!h) return
    const next = Math.max(50, parseInt(raw, 10) || goal)
    await updateHabitoMeta(h.id, next)
  }

  const handleTotalManual = async (raw: string) =>
  {
    const h = await ensureProteina()
    if (!h) return
    const next = Math.max(0, parseInt(raw, 10) || 0)
    await setHabitoProgress(h.id, next)
  }

  return (
    <section className="rounded-sl border border-line bg-card overflow-hidden">
      <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-line bg-gradient-to-br from-amber-950/20 via-card to-transparent">
        <div className="flex items-center gap-2 mb-1">
          <Beef className="w-4 h-4 text-amber-400 shrink-0" />
          <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-300/90">
            Proteína
          </h2>
          <span className={`ml-auto font-mono text-[11px] tabular-nums ${AXEL_TEXT_SECONDARY}`}>
            {current}/{goal}g
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <input
            type="number"
            min={0}
            max={500}
            value={current || ''}
            onChange={(e) => void handleTotalManual(e.target.value)}
            className={`w-20 bg-transparent text-2xl font-display tabular-nums ${AXEL_TEXT_PRIMARY} outline-none border-b border-transparent focus:border-line`}
            aria-label="Total de proteína hoje em gramas"
          />
          <span className="text-base text-ink-muted font-normal">/ {goal}g</span>
        </div>
        <p className={`text-[12px] mt-1.5 ${AXEL_TEXT_SECONDARY}`}>
          {done ? 'Meta do dia completa.' : `${Math.round(pct)}% — use as refeições abaixo ou ajuste manual.`}
        </p>
        <div className="h-1.5 rounded-sl bg-chrome overflow-hidden mt-3" aria-hidden>
          <div
            className={`h-full rounded-sl transition-all duration-500 ${done ? 'bg-concluido' : 'bg-amber-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-3">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
          <button
            type="button"
            onClick={() => void handleUndo()}
            disabled={current <= 0}
            className="flex items-center justify-center gap-1 py-2.5 rounded-sl border border-line bg-chrome/30 text-ink-muted hover:text-ink disabled:opacity-30 font-mono text-[10px] uppercase"
          >
            <Minus size={14} />
            −{step}g
          </button>
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={done}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-sl border border-amber-500/30 bg-amber-500/10 text-amber-200 font-mono text-[11px] uppercase tracking-wide hover:bg-amber-500/15 disabled:opacity-40 transition-colors active:scale-[0.98]"
          >
            <Plus size={16} />
            +{step}g
          </button>
          <label className="flex flex-col items-end gap-0.5 font-mono text-[10px] text-ink-muted justify-self-end">
            Meta/dia
            <input
              type="number"
              min={50}
              max={300}
              step={5}
              value={goal}
              onChange={(e) => void handleMeta(e.target.value)}
              className="w-16 bg-chrome border border-line rounded-sl px-1 py-0.5 text-ink text-center text-[11px]"
            />
          </label>
        </div>
        <p className="text-[11px] text-ink-muted text-center leading-relaxed">
          Contador zera a cada novo dia. Refeições somam automaticamente.
        </p>
      </div>
    </section>
  )
}
