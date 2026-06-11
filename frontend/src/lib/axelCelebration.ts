import confetti from 'canvas-confetti'

// Celebrações — confetti, som leve, marcos de ofensiva

export const STREAK_MILESTONES = [7, 30, 100] as const

export type CelebrationKind = 'task' | 'streak' | 'main_quest' | 'quest' | 'milestone'

function reducedMotion(): boolean
{
  return document.documentElement.classList.contains('reduce-motion')
}

export function playCelebrationChime(): void
{
  if (reducedMotion()) return

  try
  {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.value = 0.04
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.stop(ctx.currentTime + 0.26)
  }
  catch
  {
    // áudio opcional
  }
}

export function fireConfetti(kind: CelebrationKind = 'task'): void
{
  if (reducedMotion()) return

  const palette = kind === 'milestone'
    ? ['#f97316', '#fbbf24', '#C17F3A', '#22d3ee']
    : ['#C17F3A', '#9A5B1A', '#22d3ee', '#86efac']

  void confetti({
    particleCount: kind === 'milestone' ? 120 : 48,
    spread: kind === 'milestone' ? 80 : 55,
    origin: { y: 0.72 },
    colors: palette,
    disableForReducedMotion: true,
  })
}

export function celebrateTaskComplete(options: {
  streakIncremented?: boolean
  streakCount?: number
  mainQuest?: boolean
}): void
{
  fireConfetti(options.mainQuest ? 'main_quest' : 'task')
  playCelebrationChime()

  if (options.streakIncremented && options.streakCount)
  {
    const milestone = STREAK_MILESTONES.find((m) => m === options.streakCount)
    if (milestone)
    {
      fireConfetti('milestone')
      window.dispatchEvent(new CustomEvent('axel-milestone', {
        detail: { days: milestone },
      }))
      return
    }
  }

  if (options.streakIncremented)
  {
    fireConfetti('streak')
  }
}
