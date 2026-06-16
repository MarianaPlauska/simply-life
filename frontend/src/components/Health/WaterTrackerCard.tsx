import { useMemo } from 'react'
import { Droplets, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { AGUA_PRESET } from '../../constants/healthPresets'
import { isAguaRitualComplete } from '../../lib/healthRitual'
import { WaterCupGrid } from './WaterCupGrid'
import {
  AXEL_BTN_PRIMARY,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

// Hidratação — copos como interação principal, calmo para uso diário

export function WaterTrackerCard()
{
  const habitos = useTaskStore((s) => s.habitos)
  const ensureHealthHabit = useTaskStore((s) => s.ensureHealthHabit)
  const setHabitoProgress = useTaskStore((s) => s.setHabitoProgress)
  const incrementHabito = useTaskStore((s) => s.incrementHabito)
  const updateHabitoMeta = useTaskStore((s) => s.updateHabitoMeta)

  const agua = useMemo(() => habitos.find((h) => h.tipo === 'agua'), [habitos])
  const current = agua?.progresso_atual ?? 0
  const goal = agua?.meta_diaria ?? 8
  const displayGoal = Math.max(goal, current)
  const extra = Math.max(0, current - goal)
  const done = current >= goal && goal > 0
  const ritualOk = isAguaRitualComplete(current, goal)
  const restante = Math.max(0, goal - current)

  const handleActivate = async () =>
  {
    await ensureHealthHabit(AGUA_PRESET)
    toast.success('Meta de água ativada — 8 copos por dia')
  }

  const handleSetCups = async (next: number) =>
  {
    const ensured = agua ?? await ensureHealthHabit(AGUA_PRESET)
    if (!ensured) return
    await setHabitoProgress(ensured.id, next)
  }

  const handleQuickAdd = async () =>
  {
    if (!agua) return
    const wasBeyond = current >= goal
    await incrementHabito(agua.id)
    toast.success(wasBeyond ? '+1 copo extra' : '+1 copo', { duration: 1500 })
  }

  return (
    <section
      className="rounded-sl border border-line bg-card overflow-hidden shadow-sm"
      aria-label="Hidratação"
      id="hidratacao"
    >
      <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-line bg-gradient-to-br from-sky-950/20 via-card to-transparent">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.75} />
              <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-sky-300/90">
                Hidratação
              </h2>
            </div>
            <p className={`text-2xl sm:text-3xl font-display tabular-nums leading-none ${AXEL_TEXT_PRIMARY}`}>
              {current}
              <span className="text-base sm:text-lg text-ink-muted font-normal">
                {' / '}{goal} copos
                {extra > 0 && (
                  <span className="text-sky-300"> +{extra}</span>
                )}
              </span>
            </p>
            <p className={`text-[12px] sm:text-[13px] mt-2 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
              {done
                ? extra > 0
                  ? 'Meta batida — continue registrando se quiser.'
                  : 'Meta do dia completa — pode adicionar copos extras.'
                : ritualOk
                  ? 'Ritual ok (80%) — siga no seu ritmo, sem pressa.'
                  : restante === 1
                    ? 'Falta 1 copo. Toque no copo ou use o atalho abaixo.'
                    : 'Toque nos copos para registrar. Linha tracejada = ritual (80%).'}
            </p>
          </div>
          {agua && (
            <label className="shrink-0 flex flex-col items-end gap-0.5 font-mono text-[10px] text-ink-muted">
              Meta
              <input
                type="number"
                min={4}
                max={20}
                value={goal}
                onChange={(e) => updateHabitoMeta(agua.id, Math.max(4, parseInt(e.target.value, 10) || 8))}
                className="w-12 bg-chrome border border-line rounded-sl px-1 py-0.5 text-ink text-center text-[11px]"
              />
            </label>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {!agua ? (
          <button
            type="button"
            onClick={() => void handleActivate()}
            className={`w-full py-4 font-mono text-[11px] uppercase tracking-wide ${AXEL_BTN_PRIMARY}`}
          >
            Começar meta de 8 copos
          </button>
        ) : (
          <>
            <WaterCupGrid
              current={current}
              goal={displayGoal}
              baseGoal={goal}
              onSet={(n) => void handleSetCups(n)}
            />

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between pt-1">
              <button
                type="button"
                onClick={() => void handleQuickAdd()}
                className={`flex-1 sm:flex-none sm:min-w-[140px] inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-sl font-mono text-[11px] uppercase tracking-wide transition-all active:scale-[0.98] border border-sky-500/25 bg-sky-500/10 text-sky-200 hover:bg-sky-500/15 ${
                  done ? 'border-dashed' : ''
                }`}
              >
                <Plus size={16} strokeWidth={2} />
                {done ? '+1 extra' : '+1 copo'}
              </button>
              <p className="text-[11px] text-ink-muted text-center sm:text-right leading-relaxed">
                Novo dia zera o contador automaticamente.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
