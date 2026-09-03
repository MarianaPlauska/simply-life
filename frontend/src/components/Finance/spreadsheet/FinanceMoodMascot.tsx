import { motion, AnimatePresence } from 'framer-motion'
import type { SpreadsheetMood } from '../../../lib/financeSpreadsheetMood'

const MOOD_FACE: Record<SpreadsheetMood, { mouth: string; eyeY: number; blush: boolean }> = {
  great: { mouth: 'M 28 38 Q 40 46 52 38', eyeY: 30, blush: true },
  ok: { mouth: 'M 30 40 L 50 40', eyeY: 30, blush: false },
  tight: { mouth: 'M 30 42 Q 40 38 50 42', eyeY: 31, blush: false },
  stressed: { mouth: 'M 30 44 Q 40 36 50 44', eyeY: 32, blush: false },
}

interface FinanceMoodMascotProps
{
  mood: SpreadsheetMood
  headline: string
  className?: string
  size?: 'sm' | 'lg'
  showLabel?: boolean
  /** Contas a vencer em 48h - badge no mascote */
  billAlertCount?: number
}

export function FinanceMoodMascot({
  mood,
  headline,
  className = '',
  size = 'sm',
  showLabel = true,
  billAlertCount = 0,
}: FinanceMoodMascotProps)
{
  const face = MOOD_FACE[mood]
  const px = size === 'lg' ? 72 : 56

  return (
    <div className={`flex items-end gap-2 shrink-0 ${className}`}>
      <motion.div
        className="relative shrink-0"
        animate={{ y: mood === 'great' ? [0, -3, 0] : 0 }}
        transition={{ repeat: mood === 'great' ? Infinity : 0, duration: 2.2, ease: 'easeInOut' }}
      >
        {billAlertCount > 0 && (
          <motion.span
            className="absolute -top-0.5 -right-0.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-urgente px-1 text-[9px] font-bold text-white shadow-sm"
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            aria-label={`${billAlertCount} conta${billAlertCount > 1 ? 's' : ''} vence${billAlertCount > 1 ? 'm' : ''} em 48 horas`}
          >
            {billAlertCount > 9 ? '9+' : billAlertCount}
          </motion.span>
        )}
        <svg
          width={px}
          height={px}
          viewBox="0 0 80 80"
          aria-hidden="true"
          className="drop-shadow-sm"
        >
          <motion.circle
            cx="40"
            cy="40"
            r="34"
            fill="currentColor"
            className="text-accent/20"
            animate={{ scale: mood === 'stressed' ? [1, 0.97, 1] : 1 }}
            transition={{ repeat: mood === 'stressed' ? Infinity : 0, duration: 1.8 }}
          />
          <circle cx="40" cy="40" r="30" className="fill-card stroke-line" strokeWidth="2" />
          <motion.ellipse
            cx="28"
            cy={face.eyeY}
            rx="4"
            ry={mood === 'stressed' ? 5 : 4}
            className="fill-ink"
            animate={{ scaleY: mood === 'great' ? [1, 0.2, 1] : 1 }}
            transition={{ repeat: mood === 'great' ? Infinity : 0, duration: 3.5, repeatDelay: 2 }}
          />
          <motion.ellipse
            cx="52"
            cy={face.eyeY}
            rx="4"
            ry={mood === 'stressed' ? 5 : 4}
            className="fill-ink"
            animate={{ scaleY: mood === 'great' ? [1, 0.2, 1] : 1 }}
            transition={{ repeat: mood === 'great' ? Infinity : 0, duration: 3.5, repeatDelay: 2 }}
          />
          {face.blush && (
            <>
              <circle cx="22" cy="36" r="5" className="fill-urgente/15" />
              <circle cx="58" cy="36" r="5" className="fill-urgente/15" />
            </>
          )}
          <motion.path
            d={face.mouth}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="text-ink"
            key={mood}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.35 }}
          />
          {mood === 'stressed' && (
            <motion.path
              d="M 58 18 L 64 12 M 64 18 L 58 12"
              stroke="currentColor"
              strokeWidth="2"
              className="text-atencao"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            />
          )}
        </svg>
      </motion.div>
      {showLabel && (
        <AnimatePresence mode="wait">
          <motion.p
            key={headline}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="font-mono text-[9px] uppercase tracking-wide text-ink-muted max-w-[72px] leading-tight pb-1"
          >
            {headline}
          </motion.p>
        </AnimatePresence>
      )}
    </div>
  )
}
