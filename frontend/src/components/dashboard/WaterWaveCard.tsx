import { useEffect, useMemo } from 'react'
import { Droplets, ChevronRight, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../../store/useTaskStore'
import { AGUA_PRESET } from '../../constants/healthPresets'
import { isAguaRitualComplete } from '../../lib/healthRitual'
import { WaterCupGrid } from '../Health/WaterCupGrid'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

// Widget de hidratação no dashboard — mesma grade de copos da página Saúde

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
  const setHabitoProgress = useTaskStore((s) => s.setHabitoProgress)
  const incrementHabito = useTaskStore((s) => s.incrementHabito)

  useEffect(() =>
  {
    void fetchHabitos()
  }, [fetchHabitos])

  const agua = useMemo(() => habitos.find((h) => h.tipo === 'agua'), [habitos])
  const current = agua?.progresso_atual ?? 0
  const goal = agua?.meta_diaria ?? 8
  const displayGoal = Math.max(goal, current)
  const extra = Math.max(0, current - goal)
  const done = current >= goal && goal > 0
  const ritualOk = isAguaRitualComplete(current, goal)

  const handleSetCups = async (next: number) =>
  {
    const ensured = agua ?? await ensureHealthHabit(AGUA_PRESET)
    if (!ensured) return
    await setHabitoProgress(ensured.id, next)
  }

  const handleQuickAdd = async () =>
  {
    if (!agua) return
    await incrementHabito(agua.id)
  }

  const statusLine = done
    ? extra > 0
      ? `Meta batida · +${extra} extra`
      : 'Meta completa — pode adicionar extras'
    : ritualOk
      ? 'Ritual ok — 80%'
      : `${Math.max(0, goal - current)} copo${goal - current !== 1 ? 's' : ''} restantes`

  return (
    <section
      className={`rounded-sl border border-line bg-card overflow-hidden flex flex-col ${hero ? 'p-4 sm:p-5' : 'p-4'} ${className}`}
      aria-label="Hidratação hoje"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Droplets size={hero ? 16 : 14} className="text-sky-400 shrink-0" strokeWidth={1.75} />
            <span className="font-mono uppercase tracking-[0.12em] text-sky-300/90 text-[10px]">
              Água hoje
            </span>
          </div>
          <p className={`font-display tabular-nums leading-none ${AXEL_TEXT_PRIMARY} ${hero ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>
            {current}
            <span className={`text-ink-muted font-normal ${hero ? 'text-base' : 'text-sm'}`}> / {goal}</span>
            {extra > 0 && (
              <span className={`text-sky-300 font-normal ${hero ? 'text-base' : 'text-sm'}`}> +{extra}</span>
            )}
          </p>
          <p className={`mt-1 ${AXEL_TEXT_SECONDARY} ${hero ? 'text-xs' : 'text-[11px]'}`}>
            {statusLine}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/saude#hidratacao')}
          className="shrink-0 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide px-2.5 py-1.5 rounded-sl border border-line text-ink-muted hover:text-ink hover:bg-chrome transition-colors"
        >
          Saúde
          <ChevronRight size={12} />
        </button>
      </div>

      {agua ? (
        <>
          <WaterCupGrid
            current={current}
            goal={displayGoal}
            baseGoal={goal}
            onSet={(n) => void handleSetCups(n)}
            compact={!hero}
          />
          <button
            type="button"
            onClick={() => void handleQuickAdd()}
            className={`mt-3 w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-sl font-mono text-[10px] uppercase tracking-wide border border-sky-500/25 bg-sky-500/10 text-sky-200 hover:bg-sky-500/15 transition-colors ${
              done ? 'border-dashed' : ''
            }`}
          >
            <Plus size={14} strokeWidth={2} />
            {done ? '+1 extra' : '+1 copo'}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => void ensureHealthHabit(AGUA_PRESET)}
          className="w-full py-3 rounded-sl border border-sky-500/25 bg-sky-500/10 text-sky-200 font-mono text-[11px] uppercase tracking-wide hover:bg-sky-500/15 transition-colors"
        >
          Ativar meta de 8 copos
        </button>
      )}
    </section>
  )
}
