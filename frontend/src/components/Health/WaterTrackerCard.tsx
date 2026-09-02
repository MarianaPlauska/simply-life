import { useEffect, useMemo } from 'react'
import { Droplets, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { AGUA_PRESET } from '../../constants/healthPresets'
import { isAguaRitualComplete } from '../../lib/healthRitual'
import { WaterCupGrid } from './WaterCupGrid'
import {
  DEFAULT_AGUA_COPOS,
  DEFAULT_ML_POR_COPO,
  formatLiters,
  META_AGUA_ML,
  metaMl,
  mlPorCopo,
  registrosMl,
  resolveMlPresets,
  totalMlHoje,
} from '../../lib/waterHydration'
import { promoteAguaMetaTo2L, saveAguaDefaultMl, saveAguaMlPreset } from '../../lib/waterHydrationActions'
import { emitCareRegistered } from '../../lib/healthVitality'
import {
  AXEL_BTN_PRIMARY,
  AXEL_METRIC_HAIRLINE,
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
  const goal = agua?.meta_diaria ?? DEFAULT_AGUA_COPOS
  const defaultMl = mlPorCopo(agua)
  const mlPresets = useMemo(() => resolveMlPresets(agua), [agua])
  const totalMl = totalMlHoje(agua)
  const metaTotalMl = metaMl(agua)
  const displayGoal = Math.max(goal, current)
  const extra = Math.max(0, current - goal)
  const done = current >= goal && goal > 0
  const ritualOk = isAguaRitualComplete(current, goal)
  const restante = Math.max(0, goal - current)

  useEffect(() =>
  {
    if (!agua) return
    void promoteAguaMetaTo2L(agua)
  }, [agua])

  const handleActivate = async () =>
  {
    await ensureHealthHabit(AGUA_PRESET)
    toast.success(`Meta de água ativada: ${formatLiters(META_AGUA_ML)}`)
  }

  const persistEntries = async (next: number[]) =>
  {
    const ensured = agua ?? await ensureHealthHabit(AGUA_PRESET)
    if (!ensured) return
    const prevLen = entries.length
    await setAguaRegistros(ensured.id, next)
    if (next.length > prevLen)
    {
      emitCareRegistered()
    }
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
      className="space-y-4 min-w-0 w-full overflow-x-hidden"
      aria-label="Hidratação"
      id="hidratacao"
    >
      <div className="flex flex-col gap-3 min-w-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Droplets className="w-4 h-4 text-health shrink-0" strokeWidth={1.75} />
            <h2 className="font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-health">
              Hidratação
            </h2>
          </div>
          <p className={`text-2xl sm:text-3xl font-display tabular-nums leading-none break-words ${AXEL_TEXT_PRIMARY}`}>
            {formatLiters(totalMl)}
            <span className="text-base sm:text-lg text-ink-muted font-normal"> / {formatLiters(metaTotalMl)}</span>
          </p>
          <p className={`text-[12px] sm:text-[13px] mt-2 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
            {current}/{goal} copos
            {extra > 0 ? ` · +${extra} extra` : ''}
            {' · '}
            {done
              ? extra > 0
                ? `meta batida`
                : `meta do dia`
              : ritualOk
                ? `ritual ok (80%)`
                : restante === 1
                  ? `falta 1 copo`
                  : `${restante} copos restantes`}
          </p>
        </div>
        {agua && (
          <div className="flex items-center gap-2 sm:shrink-0">
            {current > 0 && (
              <button
                type="button"
                onClick={() => void handleClear()}
                className="inline-flex items-center justify-center w-11 h-11 rounded-sl text-ink-muted hover:text-atencao transition-colors"
                title="Zerar água de hoje"
                aria-label="Zerar água de hoje"
              >
                <X size={15} strokeWidth={2} />
              </button>
            )}
            <label className="flex flex-col items-start sm:items-end gap-0.5 font-mono text-[10px] text-ink-muted">
              Meta copos
              <input
                type="number"
                min={4}
                max={20}
                value={goal}
                onChange={(e) =>
                {
                  void updateHabitoMeta(agua.id, Math.max(4, parseInt(e.target.value, 10) || 8))
                }}
                className="w-14 bg-transparent border-b border-line px-1 py-0.5 text-ink text-center text-[11px]"
              />
            </label>
          </div>
        )}
      </div>

      <div className={`${AXEL_METRIC_HAIRLINE} space-y-4`}>
        {!agua ? (
          <button
            type="button"
            onClick={() => void handleActivate()}
            className={`w-full py-4 font-mono text-[11px] uppercase tracking-wide ${AXEL_BTN_PRIMARY}`}
          >
            Começar meta de {formatLiters(META_AGUA_ML)}
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
                className={`self-start inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-sl font-mono text-[11px] uppercase tracking-wide transition-all active:scale-[0.98] border border-health/30 bg-health-muted text-ink hover:bg-health-muted/80 ${
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
