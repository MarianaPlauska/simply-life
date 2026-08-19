import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { HeartPulse, Droplets, Pill, Check } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { ritualHeadline, type RitualItemId } from '../../lib/healthRitual'
import { useHealthRitualSnapshot } from '../../hooks/useHealthRitualSnapshot'
import { AxelCareNudge } from '../axel/AxelCareNudge'
import type { MoodLevel } from '../../lib/axelCareMessages'

const ICONS: Record<RitualItemId, typeof HeartPulse> = {
  humor: HeartPulse,
  agua: Droplets,
  medicamentos: Pill,
}

export function HealthRitualStrip()
{
  const navigate = useNavigate()
  const location = useLocation()
  const fetchHumorHoje = useTaskStore((s) => s.fetchHumorHoje)
  const fetchMedicamentos = useTaskStore((s) => s.fetchMedicamentos)
  const fetchHabitos = useTaskStore((s) => s.fetchHabitos)
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)
  const userProfile = useTaskStore((s) => s.userProfile)
  const prevDoneRef = useRef<Record<RitualItemId, boolean>>({ humor: false, agua: false, medicamentos: false })
  const ritualHydratedRef = useRef(false)
  const [dataReady, setDataReady] = useState(false)
  const [celebrateMood, setCelebrateMood] = useState<MoodLevel | null>(null)
  const [celebrateKey, setCelebrateKey] = useState(0)

  const snapshot = useHealthRitualSnapshot()

  const displayName = workspacePrefs.axel_calls_you
    || workspacePrefs.display_name
    || userProfile?.nome
    || ''

  useEffect(() =>
  {
    let cancelled = false
    void (async () =>
    {
      await Promise.all([fetchHumorHoje(), fetchMedicamentos(), fetchHabitos()])
      if (!cancelled)
      {
        setDataReady(true)
      }
    })()
    return () =>
    {
      cancelled = true
    }
  }, [fetchHumorHoje, fetchMedicamentos, fetchHabitos])

  useEffect(() =>
  {
    if (!dataReady) return

    for (const item of snapshot.items)
    {
      if (!item.applies) continue
      const wasDone = prevDoneRef.current[item.id]
      if (
        item.id !== 'humor'
        && ritualHydratedRef.current
        && !wasDone
        && item.done
      )
      {
        setCelebrateMood(5)
        setCelebrateKey((k) => k + 1)
        break
      }
      prevDoneRef.current[item.id] = item.done
    }
    ritualHydratedRef.current = true
  }, [snapshot.items, dataReady])

  const isStreakSafeToday = useTaskStore((s) => s.isStreakSafeToday)
  const recordWellbeingForStreak = useTaskStore((s) => s.recordWellbeingForStreak)

  useEffect(() =>
  {
    if (isStreakSafeToday()) return
    if (snapshot.percent < 80) return
    const key = `ritual-streak-${new Date().toISOString().slice(0, 10)}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    const result = recordWellbeingForStreak()
    if (result.incremented)
    {
      import('sonner').then(({ toast }) =>
      {
        toast.success('Ritual de saúde: ofensiva do dia salva!', { duration: 4000 })
      })
    }
  }, [snapshot.percent, isStreakSafeToday, recordWellbeingForStreak])

  const headline = ritualHeadline(snapshot)

  const scrollOnDashboard = (itemId: RitualItemId) =>
  {
    if (location.pathname !== '/') return false
    const targetId = itemId === 'humor'
      ? 'dashboard-wellbeing'
      : itemId === 'agua'
        ? 'dashboard-water'
        : null
    if (!targetId) return false
    const el = document.getElementById(targetId)
    if (!el) return false
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return true
  }

  const handleRitualTap = (item: { id: RitualItemId; path: string }) =>
  {
    if (scrollOnDashboard(item.id))
    {
      return
    }
    navigate(item.path)
  }

  return (
    <section
      className={`sl-panel px-4 py-4 ${
        !snapshot.moodLoggedToday ? 'sl-panel-emphasis' : ''
      }`}
      aria-label="Seu cuidado hoje"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-ui-caption uppercase tracking-[0.14em] text-accent">
            Seu cuidado hoje
          </p>
          <p className="text-ui-title text-ink leading-snug mt-1">{headline}</p>
        </div>
        <span className="shrink-0 rounded-full border border-line bg-chrome px-2 py-1 font-mono text-ui-caption text-ink-muted tabular-nums">
          {snapshot.doneCount} de {snapshot.totalApplicable}
        </span>
      </div>

      {celebrateMood !== null && (
        <AxelCareNudge
          key={celebrateKey}
          avatarStyle={workspacePrefs.avatar_style}
          displayName={displayName}
          streak
          durationMs={5000}
          className="mt-3"
          onDone={() => setCelebrateMood(null)}
        />
      )}

      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2 mt-3">
        {snapshot.items.filter((i) => i.applies).map((item) =>
        {
          const Icon = ICONS[item.id]
          const inProgress = !item.done && item.progress > 0
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleRitualTap(item)}
              className={`
                min-h-14 flex items-center gap-2.5 px-3 py-2.5 rounded-sl border text-left transition-colors
                ${item.done
                  ? 'border-concluido/30 bg-concluido/10 text-concluido'
                  : inProgress
                    ? 'border-sky-500/35 bg-sky-500/10 text-sky-300'
                    : item.id === 'humor'
                      ? 'border-accent/40 bg-accent-muted text-ink hover:border-accent'
                      : 'border-line bg-chrome/50 text-ink-muted hover:text-ink hover:border-ink-muted/50'}
              `}
            >
              <span className="shrink-0">
                {item.done ? <Check size={18} /> : <Icon size={18} strokeWidth={1.75} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-ui-body font-semibold">{item.label}</span>
                <span className="block text-ui-caption leading-snug opacity-80 truncate">{item.done ? 'Concluído hoje' : item.detail}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-3" aria-label={`${snapshot.percent}% do cuidado de hoje concluído`}>
        <div className="h-2 rounded-full bg-chrome overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${snapshot.percent}%` }}
          />
        </div>
        <p className="text-ui-caption text-ink-muted mt-1">
          {snapshot.percent}% concluído hoje
        </p>
      </div>
    </section>
  )
}
