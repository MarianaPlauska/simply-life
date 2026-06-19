import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AxelCompanionAvatar } from '../Onboarding/AxelCompanionAvatar'
import type { AvatarStyleId } from '../../lib/axelAvatarPresets'
import { iniciaisDe } from '../../lib/axelAvatarPresets'
import type { MoodLevel } from '../../lib/axelCareMessages'
import { pickMoodCareMessage, pickStreakCareMessage } from '../../lib/axelCareMessages'

interface AxelCareNudgeProps
{
  avatarStyle: AvatarStyleId
  displayName?: string
  moodLevel?: MoodLevel
  streak?: boolean
  durationMs?: number
  onDone?: () => void
  className?: string
}

/** Reação compacta — não ocupa a tela, só confirma presença do AXEL */
export function AxelCareNudge({
  avatarStyle,
  displayName,
  moodLevel,
  streak = false,
  durationMs = 4000,
  onDone,
  className = '',
}: AxelCareNudgeProps)
{
  const [visible, setVisible] = useState(true)
  const message = streak
    ? pickStreakCareMessage()
    : pickMoodCareMessage(moodLevel ?? 3)
  const reaction = streak || (moodLevel ?? 3) >= 4
    ? 'celebrate'
    : (moodLevel ?? 3) <= 1
      ? 'listen'
      : 'care'

  useEffect(() =>
  {
    const t = window.setTimeout(() =>
    {
      setVisible(false)
      onDone?.()
    }, durationMs)
    return () => window.clearTimeout(t)
  }, [durationMs, onDone])

  const initials = iniciaisDe(displayName ?? '')

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -2 }}
          transition={{ duration: 0.25 }}
          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-sl border border-accent/25 bg-accent-muted/40 ${className}`}
          role="status"
          aria-live="polite"
        >
          <div className={`shrink-0 axel-care-${reaction}`} aria-hidden>
            <AxelCompanionAvatar style={avatarStyle} initials={initials} size={32} />
          </div>
          <p className="text-[12px] text-ink leading-snug min-w-0">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
