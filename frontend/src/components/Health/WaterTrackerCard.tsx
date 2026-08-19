import { useMemo } from 'react'
import { Droplets, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { AGUA_PRESET } from '../../constants/healthPresets'
import { isAguaRitualComplete } from '../../lib/healthRitual'
import { WaterCupGrid } from './WaterCupGrid'
import {
  DEFAULT_ML_POR_COPO,
  metaMl,
  mlPorCopo,
  registrosMl,
  resolveMlPresets,
  totalMlHoje,
} from '../../lib/waterHydration'
import { saveAguaDefaultMl, saveAguaMlPreset } from '../../lib/waterHydrationActions'
import {
  AXEL_BTN_PRIMARY,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

export function WaterTrackerCard()
{
  const habitos = useTaskStore((s) => s.habitos)
  const ensureHealthHabit = useTaskStore((s) => s.ensureHealthHabit)
  const setAguaRegistros = useTaskStore((s) => s.setAguaRegistros)
  const updateHabitoMeta = useTaskStore((s) => s.updateHabitoMeta)

  const agua = useMemo(() => habitos.find((h) => h.tipo === 'agua'), [habitos])
  const entries = useMemo(() => registrosMl(agua), [agua])
  const current = entries.length
  const goal = agua?.meta_diaria ?? 8
  const defaultMl = mlPorCopo(agua)
  const mlPresets = useMemo(() => resolveMlPresets(agua), [agua])
  const totalMl = totalMlHoje(agua)
  const metaTotalMl = metaMl(agua)
  const displayGoal = Math.max(goal, current)
  const extra = Math.max(0, current - goal)
  const done = current >= goal && goal > 0
  const ritualOk = isAguaRitualComplete(current, goal)
  const restante = Math.max(0, goal - current)

  const handleActivate = async () =>
  {
    await ensureHealthHabit(AGUA_PRESET)
    toast.success('Meta de água ativada: 8 copos por dia')
  }

  const persistEntries = async (next: number[]) =>
  {
    const ensured = agua ?? await ensureHealthHabit(AGUA_PRESET)
    if (!ensured) return
    await setAguaRegistros(ensured.id, next)
  }

  const handleQuickAdd = async () =>
  {
    if (!agua) return
    const wasBeyond = current >= goal
    await persistEntries([...entries, defaultMl])
    toast.success(wasBeyond ? `+${defaultMl} ml extra` : `+${defaultMl} ml`, { duration: 3500 })
  }

  const handleDefaultMl = async (ml: number) =>
  {
    await saveAguaDefaultMl(agua, ml)
  }

  const patchMlPresets = async (action: 'add' | 'remove', ml: number) =>
  {
    await saveAguaMlPreset(agua, action, ml)
  }

  const handleClear = async () =>
  {
    await persistEntries([])
    toast.message('Água de hoje zerada')
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
              <Droplets className="w-4 h-4 text-accent shrink-0" strokeWidth={1.75} />
              <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                Hidratação
              </h2>
            </div>
            <p className={`text-2xl sm:text-3xl font-display tabular-nums leading-none ${AXEL_TEXT_PRIMARY}`}>
              {totalMl}
              <span className="text-base sm:text-lg text-ink-muted font-normal"> ml</span>
              <span className="text-base sm:text-lg text-ink-muted font-normal">
                {' · '}{current}/{goal} copos
                {extra > 0 && (
                  <span className="text-sky-300"> +{extra}</span>
                )}
              </span>
            </p>
            <p className={`text-[12px] sm:text-[13px] mt-2 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
              {done
                ? extra > 0
                  ? `Meta batida: ${totalMl} ml hoje.`
                  : `Meta do dia: ${totalMl} / ${metaTotalMl} ml.`
                : ritualOk
                  ? `Ritual ok (80%): ${totalMl} ml.`
                  : restante === 1
                    ? `Falta 1 copo · ${totalMl} ml.`
                    : `${restante} copos restantes · ${totalMl} ml.`}
            </p>
          </div>
          {agua && (
            <div className="shrink-0 flex items-start gap-2">
              {current > 0 && (
                <button
                  type="button"
                  onClick={() => void handleClear()}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-sl border border-line text-ink-muted hover:text-atencao hover:border-atencao/40 transition-colors"
                  title="Zerar água de hoje"
                  aria-label="Zerar água de hoje"
                >
                  <X size={15} strokeWidth={2} />
                </button>
              )}
              <label className="flex flex-col items-end gap-0.5 font-mono text-[10px] text-ink-muted">
              Meta copos
              <input
                type="number"
                min={4}
                max={20}
                value={goal}
                onChange={(e) => updateHabitoMeta(agua.id, Math.max(4, parseInt(e.target.value, 10) || 8))}
                className="w-12 bg-chrome border border-line rounded-sl px-1 py-0.5 text-ink text-center text-[11px]"
              />
            </label>
            </div>
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
              entries={entries}
              goal={displayGoal}
              baseGoal={goal}
              defaultMl={defaultMl}
              mlPresets={mlPresets}
              onEntriesChange={(n) => void persistEntries(n)}
              onDefaultMlChange={(ml) => void handleDefaultMl(ml)}
              onAddMlPreset={(ml) => void patchMlPresets('add', ml)}
              onRemoveMlPreset={(ml) => void patchMlPresets('remove', ml)}
            />

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between pt-1">
              <button
                type="button"
                onClick={() => void handleQuickAdd()}
                className={`flex-1 sm:flex-none sm:max-w-[9.5rem] inline-flex items-center justify-center gap-2 sm:gap-1 py-2.5 sm:py-1.5 px-4 sm:px-2.5 rounded-sl font-mono text-[11px] sm:text-[9px] uppercase tracking-wide transition-all active:scale-[0.98] border border-sky-500/25 bg-sky-500/10 text-sky-200 hover:bg-sky-500/15 ${
                  done ? 'border-dashed' : ''
                }`}
              >
                <Plus size={16} strokeWidth={2} className="sm:w-3.5 sm:h-3.5" />
                {done ? `+${defaultMl} ml extra` : `+${defaultMl} ml`}
              </button>
              <p className="text-[11px] text-ink-muted text-center sm:text-right leading-relaxed">
                Padrão {defaultMl || DEFAULT_ML_POR_COPO} ml · toque em copo cheio para editar · Gerenciar para valores customizados.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
