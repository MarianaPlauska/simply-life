import { useEffect, useMemo } from 'react'
import { Droplets, ChevronRight, Plus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../../store/useTaskStore'
import { AGUA_PRESET } from '../../constants/healthPresets'
import { isAguaRitualComplete } from '../../lib/healthRitual'
import { WaterCupGrid } from '../Health/WaterCupGrid'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import {
  DEFAULT_ML_POR_COPO,
  metaMl,
  mlPorCopo,
  registrosMl,
  totalMlHoje,
} from '../../lib/waterHydration'

interface WaterWaveCardProps
{
  hero?: boolean
  className?: string
}

export function WaterWaveCard({ hero = true, className = '' }: WaterWaveCardProps)
{
  const navigate = useNavigate()
  const habitos = useTaskStore((s) => s.habitos)
  const fetchHabitos = useTaskStore((s) => s.fetchHabitos)
  const ensureHealthHabit = useTaskStore((s) => s.ensureHealthHabit)
  const setAguaRegistros = useTaskStore((s) => s.setAguaRegistros)
  const updateHabitoConfig = useTaskStore((s) => s.updateHabitoConfig)

  useEffect(() =>
  {
    void fetchHabitos()
    void ensureHealthHabit(AGUA_PRESET)
  }, [fetchHabitos, ensureHealthHabit])

  const agua = useMemo(() => habitos.find((h) => h.tipo === 'agua'), [habitos])
  const entries = useMemo(() => registrosMl(agua), [agua])
  const current = entries.length
  const goal = agua?.meta_diaria ?? 8
  const defaultMl = mlPorCopo(agua)
  const totalMl = totalMlHoje(agua)
  const metaTotalMl = metaMl(agua)
  const displayGoal = Math.max(goal, current)
  const extra = Math.max(0, current - goal)
  const done = current >= goal && goal > 0
  const ritualOk = isAguaRitualComplete(current, goal)

  const persistEntries = async (next: number[]) =>
  {
    const ensured = agua ?? await ensureHealthHabit(AGUA_PRESET)
    if (!ensured) return
    await setAguaRegistros(ensured.id, next)
  }

  const handleDefaultMl = async (ml: number) =>
  {
    if (!agua) return
    await updateHabitoConfig(agua.id, { ml_por_copo: ml })
  }

  const handleQuickAdd = async () =>
  {
    await persistEntries([...entries, defaultMl])
  }

  const handleClear = async () =>
  {
    await persistEntries([])
  }

  const statusLine = done
    ? extra > 0
      ? `Meta batida · +${extra} extra · ${totalMl} ml`
      : `Meta completa — ${totalMl} ml hoje`
    : ritualOk
      ? `Ritual ok — ${totalMl} / ${metaTotalMl} ml`
      : `${Math.max(0, goal - current)} copo${goal - current !== 1 ? 's' : ''} · ${totalMl} ml`

  return (
    <section
      className={`sl-panel overflow-hidden flex flex-col ${hero ? 'p-4 sm:p-5' : 'p-4'} ${className}`}
      aria-label="Hidratação hoje"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Droplets size={hero ? 16 : 14} className="text-accent shrink-0" strokeWidth={1.75} />
            <span className="font-mono uppercase tracking-[0.12em] text-accent text-[10px]">
              Água hoje
            </span>
          </div>
          <p className={`font-display tabular-nums leading-none ${AXEL_TEXT_PRIMARY} ${hero ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>
            {totalMl}
            <span className={`text-ink-muted font-normal ${hero ? 'text-base' : 'text-sm'}`}> ml</span>
            <span className={`text-ink-muted font-normal ${hero ? 'text-base' : 'text-sm'}`}> · {current}/{goal}</span>
          </p>
          <p className={`mt-1 ${AXEL_TEXT_SECONDARY} ${hero ? 'text-xs' : 'text-[11px]'}`}>
            {statusLine}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {current > 0 && (
            <button
              type="button"
              onClick={() => void handleClear()}
              className="inline-flex items-center justify-center w-8 h-8 rounded-sl border border-line text-ink-muted hover:text-atencao hover:border-atencao/40 hover:bg-atencao/5 transition-colors"
              title="Zerar água de hoje"
              aria-label="Zerar água de hoje"
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/saude#hidratacao')}
            className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide px-2.5 py-1.5 rounded-sl border border-line text-ink-muted hover:text-ink hover:bg-chrome transition-colors"
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
            onEntriesChange={(n) => void persistEntries(n)}
            onDefaultMlChange={(ml) => void handleDefaultMl(ml)}
            compact={!hero}
          />
          <button
            type="button"
            onClick={() => void handleQuickAdd()}
            className={`mt-3 w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-sl font-mono text-[10px] uppercase tracking-wide border border-accent/25 bg-accent-muted text-ink hover:bg-accent-muted/80 transition-colors ${
              done ? 'border-dashed' : ''
            }`}
          >
            <Plus size={14} strokeWidth={2} />
            {done ? `+${defaultMl} ml extra` : `+${defaultMl} ml`}
          </button>
        </>
      ) : (
        <div className="space-y-3">
          <WaterCupGrid
            entries={[]}
            goal={8}
            baseGoal={8}
            defaultMl={DEFAULT_ML_POR_COPO}
            onEntriesChange={() => void ensureHealthHabit(AGUA_PRESET)}
            compact={!hero}
          />
          <button
            type="button"
            onClick={() => void ensureHealthHabit(AGUA_PRESET)}
            className="w-full py-3 rounded-sl border border-accent/25 bg-accent-muted text-ink font-mono text-[11px] uppercase tracking-wide hover:bg-accent-muted/80 transition-colors"
          >
            Ativar meta de 8 copos
          </button>
        </div>
      )}
    </section>
  )
}
