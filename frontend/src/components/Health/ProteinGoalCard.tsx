import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { Beef, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { PROTEINA_PRESET } from '../../constants/healthPresets'
import { snapshotNutricaoHoje, kcalFromProteinGrams } from '../../lib/healthNutrition'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import { DashboardCollapsible } from '../dashboard/DashboardCollapsible'

export function ProteinGoalCard()
{
  const habitos = useTaskStore((s) => s.habitos)
  const ensureHealthHabit = useTaskStore((s) => s.ensureHealthHabit)
  const incrementHabitoBy = useTaskStore((s) => s.incrementHabitoBy)
  const decrementHabito = useTaskStore((s) => s.decrementHabito)
  const updateHabitoMeta = useTaskStore((s) => s.updateHabitoMeta)
  const setHabitoProgress = useTaskStore((s) => s.setHabitoProgress)
  const patchHabitoConfig = useTaskStore((s) => s.updateHabitoConfig)

  const proteina = useMemo(() => habitos.find((h) => h.tipo === 'proteina'), [habitos])
  const step = proteina?.config?.incremento ?? 10
  const current = proteina?.progresso_atual ?? 0
  const goal = proteina?.meta_diaria ?? PROTEINA_PRESET.meta_diaria
  const [metaDraft, setMetaDraft] = useState(String(goal))
  const metaInputRef = useRef<HTMLInputElement>(null)
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0
  const done = current >= goal && goal > 0

  const nut = snapshotNutricaoHoje(habitos)
  const metaKcal = nut.metaKcal
  const [metaKcalDraft, setMetaKcalDraft] = useState(String(metaKcal))
  const metaKcalRef = useRef<HTMLInputElement>(null)

  useEffect(() =>
  {
    if (document.activeElement !== metaKcalRef.current)
    {
      setMetaKcalDraft(String(metaKcal))
    }
  }, [metaKcal])

  const commitMetaKcal = async () =>
  {
    const h = await ensureProteina()
    if (!h) return
    const next = Math.min(4000, Math.max(1200, parseInt(metaKcalDraft, 10) || metaKcal))
    setMetaKcalDraft(String(next))
    await patchHabitoConfig(h.id, { meta_kcal_diaria: next })
    toast.success(`Meta energia: ${next} kcal`)
  }

  const ensureProteina = useCallback(async () =>
  {
    return proteina ?? await ensureHealthHabit(PROTEINA_PRESET)
  }, [proteina, ensureHealthHabit])

  useEffect(() =>
  {
    if (document.activeElement !== metaInputRef.current)
    {
      setMetaDraft(String(goal))
    }
  }, [goal])

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
    const kcalNow = typeof h.config?.kcal_hoje === 'number' ? h.config.kcal_hoje : 0
    await patchHabitoConfig(h.id, { kcal_hoje: kcalNow + kcalFromProteinGrams(step) })
    const { emitCareRegistered } = await import('../../lib/healthVitality')
    emitCareRegistered()
    toast.success(`+${step}g de proteína`, { duration: 1500 })
  }

  const handleUndo = async () =>
  {
    if (!proteina || current <= 0) return
    await decrementHabito(proteina.id)
  }

  const commitMeta = async () =>
  {
    const h = await ensureProteina()
    if (!h) return
    const next = Math.min(300, Math.max(50, parseInt(metaDraft, 10) || goal))
    setMetaDraft(String(next))
    if (next !== h.meta_diaria)
    {
      await updateHabitoMeta(h.id, next)
      toast.success(`Meta diária: ${next}g`)
    }
  }

  const handleTotalManual = async (raw: string) =>
  {
    const h = await ensureProteina()
    if (!h) return
    const next = Math.max(0, parseInt(raw, 10) || 0)
    await setHabitoProgress(h.id, next)
  }

  return (
    <section className="rounded-sl border border-line bg-card overflow-hidden min-w-0">
      <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-line bg-health-muted/40">
        <div className="flex flex-wrap items-center gap-2 mb-1 min-w-0">
          <Beef className="w-4 h-4 text-health shrink-0" />
          <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-health">
            Proteína
          </h2>
          <span className={`sm:ml-auto font-mono text-[11px] tabular-nums ${AXEL_TEXT_SECONDARY}`}>
            {current}/{goal}g · {nut.kcal} kcal
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
          {done
            ? 'Boa! Meta do dia completa.'
            : `${Math.round(pct)}%. Toque nos atalhos abaixo ou ajuste quando quiser.`}
        </p>
        <div className="h-1.5 rounded-sl bg-chrome overflow-hidden mt-3" aria-hidden>
          <div
            className={`h-full rounded-sl transition-all duration-500 ${done ? 'bg-concluido' : 'bg-health'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <DashboardCollapsible
        title="Ajustar metas"
        subtitle="Proteína, energia e contadores manuais"
        borderless
        defaultOpen={false}
        className="px-4 sm:px-5 pb-4"
        bodyClassName="space-y-3 pt-2"
      >
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
          <button
            type="button"
            onClick={() => void handleUndo()}
            disabled={current <= 0}
            className="flex items-center justify-center gap-1 py-2.5 rounded-sl border border-line bg-chrome/30 text-ink-muted hover:text-ink disabled:opacity-30 font-mono text-[10px] uppercase min-h-[44px]"
          >
            <Minus size={14} />
            −{step}g
          </button>
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={done}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-sl border border-health/30 bg-health-muted text-ink font-mono text-[11px] uppercase tracking-wide hover:bg-health-muted/80 disabled:opacity-40 transition-colors active:scale-[0.98] min-h-[44px]"
          >
            <Plus size={16} />
            +{step}g
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 font-mono text-[10px] text-ink-muted">
            Meta proteína (g)
            <input
              ref={metaInputRef}
              type="number"
              min={50}
              max={300}
              step={5}
              value={metaDraft}
              onChange={(e) => setMetaDraft(e.target.value)}
              onBlur={() => void commitMeta()}
              onKeyDown={(e) => { if (e.key === 'Enter') void commitMeta() }}
              className="w-full bg-chrome border border-line rounded-sl px-2 py-1.5 text-ink text-center text-[12px] min-h-[40px]"
            />
          </label>
          <label className="flex flex-col gap-1 font-mono text-[10px] text-ink-muted">
            Meta energia (kcal)
            <input
              ref={metaKcalRef}
              type="number"
              min={1200}
              max={4000}
              step={50}
              value={metaKcalDraft}
              onChange={(e) => setMetaKcalDraft(e.target.value)}
              onBlur={() => void commitMetaKcal()}
              onKeyDown={(e) => { if (e.key === 'Enter') void commitMetaKcal() }}
              className="w-full bg-chrome border border-line rounded-sl px-2 py-1.5 text-ink text-center text-[12px] min-h-[40px]"
            />
          </label>
        </div>
        <p className="text-[11px] text-ink-muted text-center leading-relaxed">
          Metas salvam ao sair do campo. Contadores zeram a cada novo dia.
        </p>
      </DashboardCollapsible>
    </section>
  )
}
