import { useEffect, useRef } from 'react'
import { useFocusStore } from '../store/focusStore'
import { usePrefsStore } from '../store/prefsStore'
import { useAuthStore } from '../store/authStore'
import { setFocusingUntil } from '../lib/presence'

/**
 * Foco junto: com a preferência ligada, avisa os amigos até quando estou
 * focando. Grava só quando começa, pausa ou termina (não a cada segundo).
 */
export function useFocusPresence(): void
{
  const share = usePrefsStore((s) => Boolean(s.prefs.share_focus_status))
  const isGuest = useAuthStore((s) => s.isGuest)
  const running = useFocusStore((s) => s.running)
  const phase = useFocusStore((s) => s.phase)
  const last = useRef<string | null | undefined>(undefined)

  useEffect(() =>
  {
    if (isGuest) return
    const focusing = share && running && phase === 'focus'
    const until = focusing
      ? new Date(Date.now() + useFocusStore.getState().remainingSec * 1000).toISOString()
      : null
    // desligar a preferência no meio do foco também limpa
    if (until === null && last.current === null) return
    last.current = until
    void setFocusingUntil(until)
  }, [share, running, phase, isGuest])
}
