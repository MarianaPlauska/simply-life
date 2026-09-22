export type BoxBreathPhase = 'inhale' | 'holdIn' | 'exhale' | 'holdOut'

export const BOX_PHASE_SEC = 4
/** 8 ciclos × 16 s ≈ 2 min. */
export const BOX_CYCLE_COUNT = 8
export const BOX_PHASE_ORDER: BoxBreathPhase[] = ['inhale', 'holdIn', 'exhale', 'holdOut']

export function boxPhaseLabel(phase: BoxBreathPhase): string
{
  if (phase === 'inhale') return 'Inspire'
  if (phase === 'holdIn') return 'Segure'
  if (phase === 'exhale') return 'Expire'
  return 'Segure'
}

export function boxPhaseHint(phase: BoxBreathPhase): string
{
  if (phase === 'inhale') return 'Ar pelo nariz, barriga solta.'
  if (phase === 'holdIn') return 'Pulmões cheios, ombros baixos.'
  if (phase === 'exhale') return 'Solte o ar pela boca, sem pressa.'
  return 'Vazio suave. O próximo ciclo começa já.'
}

export function nextBoxPhase(phase: BoxBreathPhase): BoxBreathPhase
{
  const i = BOX_PHASE_ORDER.indexOf(phase)
  return BOX_PHASE_ORDER[(i + 1) % BOX_PHASE_ORDER.length]
}

export function boxPhaseIndex(phase: BoxBreathPhase): number
{
  return Math.max(0, BOX_PHASE_ORDER.indexOf(phase))
}

export function boxTotalSec(): number
{
  return BOX_CYCLE_COUNT * BOX_PHASE_ORDER.length * BOX_PHASE_SEC
}

export function boxElapsedSec(
  cycle: number,
  phase: BoxBreathPhase,
  remainingSec: number,
): number
{
  const doneCycles = Math.max(0, cycle - 1)
  const inPhase = BOX_PHASE_SEC - Math.max(0, remainingSec)
  return doneCycles * BOX_PHASE_ORDER.length * BOX_PHASE_SEC
    + boxPhaseIndex(phase) * BOX_PHASE_SEC
    + inPhase
}
