import { useEffect, useMemo } from 'react'
import { Droplets, ChevronRight, Plus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../../store/useTaskStore'
import { AGUA_PRESET } from '../../constants/healthPresets'
import { isAguaRitualComplete } from '../../lib/healthRitual'
import { WaterCupGrid } from '../Health/WaterCupGrid'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import {
  DEFAULT_AGUA_COPOS,
  DEFAULT_ML_POR_COPO,
  META_AGUA_ML,
  metaMl,
  mlPorCopo,
  ML_OPCOES,
  formatLiters,
  registrosMl,
  resolveMlPresets,
  totalMlHoje,
} from '../../lib/waterHydration'
import { promoteAguaMetaTo2L, saveAguaDefaultMl, saveAguaMlPreset } from '../../lib/waterHydrationActions'

interface WaterWaveCardProps
{
  hero?: boolean
  /** Sem caixa — entra no ritual da home */
  embedded?: boolean
  className?: string
}

export function WaterWaveCard({ hero = true, embedded = false, className = '' }: WaterWaveCardProps)
{
  const navigate = useNavigate()
  const habitos = useTaskStore((s) => s.habitos)
  const ensureHealthHabit = useTaskStore((s) => s.ensureHealthHabit)
  const setAguaRegistros = useTaskStore((s) => s.setAguaRegistros)

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

  useEffect(() =>
  {
    if (!agua) return
    void promoteAguaMetaTo2L(agua)
  }, [agua])

  useEffect(() =>
  {
    void (async () =>
    {
      const ensured = await ensureHealthHabit(AGUA_PRESET)
      if (!ensured) return

      const cached = registrosMl(ensured)
      if (cached.length === 0) return

      const remoteLen = ensured.config?.registros_ml?.length ?? 0
      if (remoteLen >= cached.length) return

      await setAguaRegistros(ensured.id, cached)
    })()
  }, [ensureHealthHabit, setAguaRegistros])

  const persistEntries = async (next: number[]) =>
  {
    const ensured = agua ?? await ensureHealthHabit(AGUA_PRESET)
    if (!ensured) return
    await setAguaRegistros(ensured.id, next)
  }

  const handleDefaultMl = async (ml: number) =>
  {
    await saveAguaDefaultMl(agua, ml)
  }

  const patchMlPresets = async (action: 'add' | 'remove', ml: number) =>
  {
    await saveAguaMlPreset(agua, action, ml)
  }

  const handleQuickAdd = async () =>
  {
    await persistEntries([...entries, defaultMl])
  }

  const handleClear = async () =>
  {
    await persistEntries([])
  }

  const litrosLine = `${formatLiters(totalMl)} de ${formatLiters(metaTotalMl)}`

  const statusLine = done
    ? extra > 0
      ? `Meta batida · +${extra} extra · ${totalMl} ml`
      : `Meta completa — ${totalMl} ml hoje`
    : ritualOk
      ? `Ritual ok — ${totalMl} / ${metaTotalMl} ml`
      : `${Math.max(0, goal - current)} copo${goal - current !== 1 ? 's' : ''} · ${totalMl} ml`

  if (embedded)
  {
    return (
      <div className={className} aria-label="Hidratação hoje">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-[13px] ${AXEL_TEXT_SECONDARY}`}>
            {litrosLine} · {current}/{goal} copos
          </p>
          <button
            type="button"
            onClick={() => void handleQuickAdd()}
            className="shrink-0 inline-flex min-h-11 items-center justify-center gap-1 text-[14px] font-semibold text-health hover:text-ink active:scale-95 transition-colors"
          >
            <Plus size={17} strokeWidth={2} aria-hidden="true" />
            {defaultMl} ml
          </button>
        </div>
        <div className="mt-2">
          <WaterCupGrid
            entries={entries}
            goal={displayGoal}
            baseGoal={goal}
            defaultMl={defaultMl}
            mlPresets={mlPresets}
            onEntriesChange={(next) => void persistEntries(next)}
            compact
          />
        </div>
      </div>
    )
  }

  if (!hero)
  {
    const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0

    return (
      <section className={`sl-panel p-3 sm:p-4 ${className}`} aria-label="Hidratação hoje">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Droplets size={16} className="text-health shrink-0" strokeWidth={1.75} />
              <p className="sl-eyebrow">Água hoje</p>
            </div>
            <p className="sl-metric text-health mt-2">
              {current}<span className="text-[1rem] font-normal text-ink-muted">/{goal}</span>
            </p>
            <p className={`mt-0.5 text-ui-caption ${AXEL_TEXT_SECONDARY}`}>
              {litrosLine}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleQuickAdd()}
            className="shrink-0 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-sl border border-health/30 bg-health-muted px-3 text-[14px] font-semibold text-ink hover:bg-health-muted/80 active:scale-95 transition-colors"
          >
            <Plus size={17} strokeWidth={2} aria-hidden="true" />
            {defaultMl} ml
          </button>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-chrome" aria-label={`${pct}% da meta de hidratação`}>
          <div className="h-full bg-health transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3">
          <WaterCupGrid
            entries={entries}
            goal={displayGoal}
            baseGoal={goal}
            defaultMl={defaultMl}
            mlPresets={mlPresets}
            onEntriesChange={(next) => void persistEntries(next)}
            compact
          />
        </div>
        <button
          type="button"
          onClick={() => navigate('/saude#hidratacao')}
          className="mt-2 inline-flex items-center gap-1 text-ui-caption text-ink-muted hover:text-accent"
        >
          Ajustar meta ou quantidade
          <ChevronRight size={13} aria-hidden="true" />
        </button>
      </section>
    )
  }

  return (
    <section
      className={`sl-panel overflow-hidden flex flex-col ${hero ? 'p-4 sm:p-5' : 'p-3'} ${className}`}
      aria-label="Hidratação hoje"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Droplets size={hero ? 16 : 14} className="text-health shrink-0" strokeWidth={1.75} />
            <span className="font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-health">
              Água hoje
            </span>
          </div>
          <p className={`font-display tabular-nums leading-none ${AXEL_TEXT_PRIMARY} ${hero ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>
            {formatLiters(totalMl)}
            <span className={`text-ink-muted font-normal ${hero ? 'text-base' : 'text-sm'}`}> / {formatLiters(metaTotalMl)}</span>
          </p>
          <p className={`mt-1 ${AXEL_TEXT_SECONDARY} ${hero ? 'text-xs' : 'text-[12px]'}`}>
            {current}/{goal} copos · {statusLine}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {current > 0 && (
            <button
              type="button"
              onClick={() => void handleClear()}
              className="inline-flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-sl border border-line text-ink-muted hover:text-atencao hover:border-atencao/40 hover:bg-atencao/5 transition-colors"
              title="Zerar água de hoje"
              aria-label="Zerar água de hoje"
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/saude#hidratacao')}
            className="inline-flex items-center gap-1 font-mono text-[11px] sm:text-[10px] uppercase tracking-wide px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-sl border border-line text-ink-muted hover:text-ink hover:bg-chrome transition-colors"
          >
            Saúde
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {agua ? (
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
            compact={!hero}
          />
          <button
            type="button"
            onClick={() => void handleQuickAdd()}
            className={`mt-3 w-full sm:w-auto sm:max-w-[9.5rem] inline-flex items-center justify-center gap-1.5 sm:gap-1 py-2 sm:py-1.5 px-3 sm:px-2.5 rounded-sl text-[13px] font-medium border border-health/30 bg-health-muted text-ink hover:bg-health-muted/80 transition-colors ${
              done ? 'border-dashed' : ''
            }`}
          >
            <Plus size={14} strokeWidth={2} className="sm:w-3 sm:h-3" />
            {done ? `+${defaultMl} ml extra` : `+${defaultMl} ml`}
          </button>
        </>
      ) : (
        <div className="space-y-3">
          <WaterCupGrid
            entries={[]}
            goal={DEFAULT_AGUA_COPOS}
            baseGoal={DEFAULT_AGUA_COPOS}
            defaultMl={DEFAULT_ML_POR_COPO}
            mlPresets={[...ML_OPCOES]}
            onEntriesChange={() => void ensureHealthHabit(AGUA_PRESET)}
            compact={!hero}
          />
          <button
            type="button"
            onClick={() => void ensureHealthHabit(AGUA_PRESET)}
            className="w-full py-3 rounded-sl border border-health/30 bg-health-muted text-ink text-[13px] font-medium hover:bg-health-muted/80 transition-colors"
          >
            Ativar meta de {formatLiters(META_AGUA_ML)}
          </button>
        </div>
      )}
    </section>
  )
}
