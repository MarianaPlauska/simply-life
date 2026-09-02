import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { ritualHeadline, type RitualItemId } from '../../lib/healthRitual'
import { useHealthRitualSnapshot } from '../../hooks/useHealthRitualSnapshot'
import { AxelCareNudge } from '../axel/AxelCareNudge'
import { WaterWaveCard } from '../dashboard/WaterWaveCard'
import { friendlyCallName } from '../../lib/friendlyCallName'
import type { MoodLevel } from '../../lib/axelCareMessages'
import { ModuleSection } from '../ui/ModuleSection'
import { ActionFeedbackNumber } from '../ui/ActionFeedbackNumber'

export function HealthRitualStrip()
{
  const navigate = useNavigate()
  const location = useLocation()
  const fetchHumorHoje = useTaskStore((s) => s.fetchHumorHoje)
  const humorHojeLista = useTaskStore((s) => s.humorHojeLista)
  const fetchMedicamentos = useTaskStore((s) => s.fetchMedicamentos)
  const fetchHabitos = useTaskStore((s) => s.fetchHabitos)
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)
  const userProfile = useTaskStore((s) => s.userProfile)
  const prevDoneRef = useRef<Record<RitualItemId, boolean>>({ humor: false, agua: false, medicamentos: false })
  const ritualHydratedRef = useRef(false)
  const [dataReady, setDataReady] = useState(false)
  const [celebrateMood, setCelebrateMood] = useState<MoodLevel | null>(null)
  const [celebrateKey, setCelebrateKey] = useState(0)
  const [ritualPulse, setRitualPulse] = useState(0)

  const snapshot = useHealthRitualSnapshot()
  const prevDoneCountRef = useRef(snapshot.doneCount)

  const displayName = friendlyCallName(
    workspacePrefs.axel_calls_you,
    workspacePrefs.display_name,
    userProfile?.nome,
  )

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
    prevDoneCountRef.current = snapshot.doneCount
  }, [snapshot.items, dataReady, snapshot.doneCount])

  useEffect(() =>
  {
    if (!ritualHydratedRef.current)
    {
      return
    }
    if (snapshot.doneCount > prevDoneCountRef.current)
    {
      setRitualPulse((k) => k + 1)
    }
    prevDoneCountRef.current = snapshot.doneCount
  }, [snapshot.doneCount])

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
  const prioritizeMood = location.pathname === '/' && humorHojeLista.length === 0

  // Humor pendente: check-in acima da dobra já cobre — evita bloco repetido no mobile
  if (prioritizeMood)
  {
    return null
  }

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

  const ritualItems = snapshot.items.filter((i) =>
  {
    if (!i.applies || i.id === 'agua')
    {
      return false
    }
    // Humor já está no check-in acima — não repetir a linha
    if (i.id === 'humor' && location.pathname === '/')
    {
      return false
    }
    return true
  })

  return (
    <ModuleSection tone="health" label="Cuidado hoje" className="min-w-0">
      <p className="sl-body font-medium text-ink leading-snug">
        {headline}
        {snapshot.totalApplicable > 0 && (
          <span className="sl-body-muted ml-2">
            ·{' '}
            <ActionFeedbackNumber pulseToken={ritualPulse} className="text-health font-medium">
              {snapshot.doneCount}/{snapshot.totalApplicable}
            </ActionFeedbackNumber>
          </span>
        )}
      </p>

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

      {ritualItems.length > 0 && (
        <ul className="mt-2" role="list">
          {ritualItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleRitualTap(item)}
                className="w-full min-h-12 flex items-center gap-3 py-2 text-left"
              >
                <span
                  className={`
                    shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
                    ${item.done
                      ? 'border-concluido bg-concluido/20 text-concluido'
                      : 'border-line text-transparent'}
                  `}
                  aria-hidden
                >
                  {item.done && <Check size={14} strokeWidth={2.5} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block sl-body font-medium text-ink">
                    {item.label}
                  </span>
                  <span className="block sl-body-muted truncate">
                    {item.done ? 'Concluído hoje' : item.detail}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div id="dashboard-water" className="mt-3 scroll-mt-20">
        <WaterWaveCard embedded className="mt-0" />
      </div>
    </ModuleSection>
  )
}
