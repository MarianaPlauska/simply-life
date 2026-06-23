import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { HeartPulse, Droplets, Pill, Check, Circle } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { buildHealthRitual, ritualHeadline, type RitualItemId } from '../../lib/healthRitual'
import { countDoseProgress } from '../../lib/medicamentosSchedule'
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
  const humorHojeLista = useTaskStore((s) => s.humorHojeLista)
  const medicamentos = useTaskStore((s) => s.medicamentos)
  const medicamentoTomadas = useTaskStore((s) => s.medicamentoTomadas)
  const habitos = useTaskStore((s) => s.habitos)
  const aguaCopos = useTaskStore((s) => s.habitos.find((h) => h.tipo === 'agua')?.progresso_atual ?? 0)
  const aguaMeta = useTaskStore((s) => s.habitos.find((h) => h.tipo === 'agua')?.meta_diaria ?? 8)
  const fetchHumorHoje = useTaskStore((s) => s.fetchHumorHoje)
  const fetchMedicamentos = useTaskStore((s) => s.fetchMedicamentos)
  const fetchHabitos = useTaskStore((s) => s.fetchHabitos)
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)
  const userProfile = useTaskStore((s) => s.userProfile)
  const prevDoneRef = useRef<Record<RitualItemId, boolean>>({ humor: false, agua: false, medicamentos: false })
  const ritualHydratedRef = useRef(false)
  const [celebrateMood, setCelebrateMood] = useState<MoodLevel | null>(null)
  const [celebrateKey, setCelebrateKey] = useState(0)

  const displayName = workspacePrefs.axel_calls_you
    || workspacePrefs.display_name
    || userProfile?.nome
    || ''

  useEffect(() =>
  {
    void fetchHumorHoje()
    void fetchMedicamentos()
    void fetchHabitos()
  }, [fetchHumorHoje, fetchMedicamentos, fetchHabitos])

  const snapshot = useMemo(() =>
  {
    const dose = countDoseProgress(medicamentos, medicamentoTomadas)
    return buildHealthRitual({
      humorHojeCount: humorHojeLista.length,
      aguaCopos,
      aguaMeta,
      medicamentosTotal: dose.total || medicamentos.length,
      medicamentosTomados: dose.tomados,
    })
  }, [humorHojeLista.length, aguaCopos, aguaMeta, medicamentos, medicamentoTomadas, habitos])

  useEffect(() =>
  {
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
  }, [snapshot.items])

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
        toast.success('Ritual de saúde — ofensiva do dia salva!', { duration: 4000 })
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
    <div
      className={`sl-panel px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 ${
        !snapshot.moodLoggedToday ? 'sl-panel-emphasis' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent">
            Ritual de saúde · hoje
          </p>
          <span className="font-mono text-[9px] text-ink-muted tabular-nums">
            {snapshot.doneCount}/{snapshot.totalApplicable}
          </span>
        </div>
        <p className="text-[13px] text-ink leading-snug">{headline}</p>
        {celebrateMood !== null && (
          <AxelCareNudge
            key={celebrateKey}
            avatarStyle={workspacePrefs.avatar_style}
            displayName={displayName}
            streak
            durationMs={5000}
            className="mt-2"
            onDone={() => setCelebrateMood(null)}
          />
        )}
        <p className="text-[11px] text-ink-muted mt-0.5">
          Tudo fica guardado no seu perfil — só você vê.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {snapshot.items.filter((i) => i.applies).map((item) =>
        {
          const Icon = ICONS[item.id]
          const inProgress = !item.done && item.progress > 0
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleRitualTap(item)}
              title={item.detail}
              className={`
                flex items-center gap-1.5 px-2.5 py-1.5 rounded-sl border text-[11px] transition-colors
                ${item.done
                  ? 'border-concluido/30 bg-concluido/10 text-concluido'
                  : inProgress
                    ? 'border-sky-500/35 bg-sky-500/10 text-sky-300'
                    : item.id === 'humor'
                      ? 'border-accent/40 bg-accent-muted text-ink hover:border-accent'
                      : 'border-line bg-chrome/50 text-ink-muted hover:text-ink hover:border-ink-muted/50'}
              `}
            >
              {item.done ? <Check size={12} /> : <Circle size={12} className="opacity-50" />}
              <Icon size={12} strokeWidth={1.75} />
              <span className="font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>

      <div className="hidden sm:block w-16 shrink-0">
        <div className="h-1.5 rounded-sl bg-chrome overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${snapshot.percent}%` }}
          />
        </div>
        <p className="font-mono text-[9px] text-ink-muted text-center mt-1 tabular-nums">
          {snapshot.percent}%
        </p>
      </div>
    </div>
  )
}
