import { useEffect } from 'react'
import { useTaskStore } from '../../store/useTaskStore'
import { AxelCareNudge } from '../axel/AxelCareNudge'
import { AXEL_MOOD_CARE_DURATION_MS, isAxelMoodCareActive } from '../../lib/axelMoodCare'

// Mensagem do AXEL após humor — some sozinha em 25s

export function AxelPostMoodCare()
{
  const session = useTaskStore((s) => s.axelMoodCare)
  const clearAxelMoodCare = useTaskStore((s) => s.clearAxelMoodCare)
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)
  const userProfile = useTaskStore((s) => s.userProfile)

  const displayName = workspacePrefs.axel_calls_you
    || workspacePrefs.display_name
    || userProfile?.nome
    || ''

  const active = isAxelMoodCareActive(session)

  useEffect(() =>
  {
    if (!session || active)
    {
      return
    }
    clearAxelMoodCare()
  }, [session, active, clearAxelMoodCare])

  // Garante remoção no deadline mesmo sem re-render do componente
  useEffect(() =>
  {
    if (!session)
    {
      return
    }
    const restante = Math.max(0, session.until - Date.now())
    const t = window.setTimeout(() => clearAxelMoodCare(), restante)
    return () => window.clearTimeout(t)
  }, [session, clearAxelMoodCare])

  if (!active || !session)
  {
    return null
  }

  const remainingMs = Math.min(
    AXEL_MOOD_CARE_DURATION_MS,
    Math.max(0, session.until - Date.now()),
  )

  return (
    <div className="mb-1">
      <p className="sl-eyebrow text-axel mb-2">AXEL</p>
      <AxelCareNudge
        avatarStyle={workspacePrefs.avatar_style}
        displayName={displayName}
        moodLevel={session.mood}
        message={session.message}
        durationMs={remainingMs || AXEL_MOOD_CARE_DURATION_MS}
        bypassGate
        onDone={clearAxelMoodCare}
      />
    </div>
  )
}
