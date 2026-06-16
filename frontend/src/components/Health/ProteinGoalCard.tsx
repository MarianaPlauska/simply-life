import { useMemo } from 'react'
import { Beef, Plus, Minus } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { PROTEINA_PRESET } from '../../constants/healthPresets'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

// Meta de proteína — alinhado ao design AXEL, reset diário automático

export function ProteinGoalCard()
{
  const habitos = useTaskStore((s) => s.habitos)
  const ensureHealthHabit = useTaskStore((s) => s.ensureHealthHabit)
  const incrementHabito = useTaskStore((s) => s.incrementHabito)
  const decrementHabito = useTaskStore((s) => s.decrementHabito)
  const updateHabitoMeta = useTaskStore((s) => s.updateHabitoMeta)

  const proteina = useMemo(() => habitos.find((h) => h.tipo === 'proteina'), [habitos])
  const step = proteina?.config?.incremento ?? 10
  const current = proteina?.progresso_atual ?? 0
  const goal = proteina?.meta_diaria ?? 120
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0
  const done = proteina ? current >= goal : false

  const handleActivate = async () =>
  {
    await ensureHealthHabit(PROTEINA_PRESET)
    toast.success('Meta de proteína ativada — 120g/dia')
  }

  const handleAdd = async () =>
  {
    const ensured = proteina ?? await ensureHealthHabit(PROTEINA_PRESET)
    if (!ensured) return
    if (ensured.progresso_atual >= ensured.meta_diaria)
    {
      toast.info('Meta de proteína já atingida!')
      return
    }
    await incrementHabito(ensured.id)
    toast.success(`+${step}g de proteína`, { duration: 1500 })
  }

  const handleUndo = async () =>
  {
    if (!proteina || current <= 0) return
    await decrementHabito(proteina.id)
  }

  return (
    <section className="rounded-sl border border-line bg-card overflow-hidden">
      <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-line bg-gradient-to-br from-amber-950/20 via-card to-transparent">
        <div className="flex items-center gap-2 mb-1">
          <Beef className="w-4 h-4 text-amber-400 shrink-0" />
          <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-300/90">
            Proteína
          </h2>
          {proteina && (
            <span className={`ml-auto font-mono text-[11px] tabular-nums ${AXEL_TEXT_SECONDARY}`}>
              {current}/{goal}g
            </span>
          )}
        </div>
        <p className={`text-2xl font-display tabular-nums ${AXEL_TEXT_PRIMARY}`}>
          {current}
          <span className="text-base text-ink-muted font-normal"> / {goal}g</span>
        </p>
        <p className={`text-[12px] mt-1.5 ${AXEL_TEXT_SECONDARY}`}>
          {done ? 'Meta do dia completa.' : `${Math.round(pct)}% — registre por porção, sem pressa.`}
        </p>
        <div className="h-1.5 rounded-sl bg-chrome overflow-hidden mt-3" aria-hidden>
          <div
            className={`h-full rounded-sl transition-all duration-500 ${done ? 'bg-concluido' : 'bg-amber-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-3">
        {!proteina ? (
          <button
            type="button"
            onClick={() => void handleActivate()}
            className="w-full py-3.5 rounded-sl border border-amber-500/25 bg-amber-500/10 text-amber-200 font-mono text-[11px] uppercase tracking-wide hover:bg-amber-500/15 transition-colors"
          >
            Ativar meta de proteína (120g)
          </button>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
              <button
                type="button"
                onClick={() => void handleUndo()}
                disabled={current <= 0}
                className="flex items-center justify-center gap-1 py-2.5 rounded-sl border border-line bg-chrome/30 text-ink-muted hover:text-ink disabled:opacity-30 font-mono text-[10px] uppercase"
              >
                <Minus size={14} />
                Desfazer
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
                Meta
                <input
                  type="number"
                  min={50}
                  max={300}
                  step={10}
                  value={goal}
                  onChange={(e) => updateHabitoMeta(proteina.id, Math.max(50, parseInt(e.target.value, 10) || 120))}
                  className="w-14 bg-chrome border border-line rounded-sl px-1 py-0.5 text-ink text-center text-[11px]"
                />
              </label>
            </div>
            <p className="text-[11px] text-ink-muted text-center leading-relaxed">
              Contador zera automaticamente a cada novo dia.
            </p>
          </>
        )}
      </div>
    </section>
  )
}
