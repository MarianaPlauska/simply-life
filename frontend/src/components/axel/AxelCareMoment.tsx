import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AxelCompanionAvatar } from '../Onboarding/AxelCompanionAvatar'
import type { AvatarStyleId } from '../../lib/axelAvatarPresets'
import { iniciaisDe } from '../../lib/axelAvatarPresets'
import type { MoodLevel } from '../../lib/axelCareMessages'
import { pickMoodCareMessage, pickStreakCareMessage } from '../../lib/axelCareMessages'

export type AxelCareReaction = 'care' | 'celebrate' | 'listen'

interface AxelCareMomentProps
{
  avatarStyle: AvatarStyleId
  displayName?: string
  /** Humor 1-5 ou omitir para mensagem de ofensiva */
  moodLevel?: MoodLevel
  streak?: boolean
  /** Duração visível em ms */
  durationMs?: number
  onDone?: () => void
  className?: string
}

const REACTION_BY_MOOD: Record<MoodLevel, AxelCareReaction> = {
  1: 'listen',
  2: 'care',
  3: 'care',
  4: 'celebrate',
  5: 'celebrate',
}

export function AxelCareMoment({
  avatarStyle,
  displayName,
  moodLevel,
  streak = false,
  durationMs = 5200,
  onDone,
  className = '',
}: AxelCareMomentProps)
{
  const [visible, setVisible] = useState(true)
  const message = streak
    ? pickStreakCareMessage()
    : pickMoodCareMessage(moodLevel ?? 3)
  const reaction: AxelCareReaction = streak
    ? 'celebrate'
    : REACTION_BY_MOOD[moodLevel ?? 3]

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
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className={`flex items-start gap-3 rounded-sl border border-accent/30 bg-accent-muted/50 p-3 sm:p-4 ${className}`}
          role="status"
          aria-live="polite"
        >
          <div
            className={`shrink-0 axel-care-${reaction}`}
            aria-hidden
          >
            <AxelCompanionAvatar
              style={avatarStyle}
              initials={initials}
              size={48}
            />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent mb-1">
              AXEL · com você
            </p>
            <p className="text-[13px] sm:text-[14px] text-ink leading-relaxed">
              {message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Dispara um momento de cuidado e retorna chave para remount */
export function useAxelCareMomentKey()
{
  const [key, setKey] = useState(0)
  const trigger = () => setKey((k) => k + 1)
  return { key, trigger }
}
