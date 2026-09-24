/**
 * Perfil de funcionamento: TDAH, autismo, ansiedade, depressão.
 * Cada traço liga ajustes que MUDAM o comportamento do app (não é rótulo):
 *  TDAH      → timer visual, avisos de tempo (cegueira temporal), pausa de hiperfoco,
 *              folga nas estimativas, poucas tarefas visíveis por vez
 *  Autismo   → modo previsível (o Axel propõe e pede ok, nunca muda sozinho),
 *              avisos antes de cada transição, menos animação, comemoração discreta
 *  Ansiedade → poucas tarefas visíveis, aviso antes das transições
 *  Depressão → poucas tarefas visíveis, comemoração discreta
 * A pessoa pode ajustar cada item depois; o perfil só dá o ponto de partida.
 * Não é diagnóstico e não pede laudo.
 */

export type NeuroTrait = 'tdah' | 'autismo' | 'ansiedade' | 'depressao'

export const NEURO_TRAITS: { id: NeuroTrait; label: string; hint: string }[] = [
  { id: 'tdah', label: 'TDAH', hint: 'Tempo que some, dificuldade de começar, hiperfoco.' },
  { id: 'autismo', label: 'Autismo', hint: 'Previsibilidade, avisos antes das mudanças, menos estímulo.' },
  { id: 'ansiedade', label: 'Ansiedade', hint: 'Menos coisa na tela, avisos com antecedência.' },
  { id: 'depressao', label: 'Depressão', hint: 'Dias menores, pouca cobrança.' },
]

export type NeuroSettings = {
  traits: NeuroTrait[]
  /** timer que encolhe (estilo Time Timer) na tela de foco */
  visualTimer: boolean
  /** avisos na metade, faltando 5 min e no fim */
  timeAlerts: boolean
  /** lembrar de pausar depois de X min seguidos (null = desligado) */
  hyperfocusGuardMin: number | null
  /** multiplica as estimativas no planejamento (1 = como estimado) */
  estimateFactor: number
  /** quantas tarefas aparecem por vez em "Agora e depois" */
  maxVisibleTasks: number
  /** o Axel propõe mudanças e espera um ok (nada muda sozinho) */
  predictableMode: boolean
  /** avisos antes da próxima atividade, em minutos (ex.: [10, 2]) */
  transitionWarningsMin: number[]
  /** sem animações de celebração/movimento */
  reduceMotion: boolean
  /** conclusões comemoradas sem pop-up e sem som */
  quietCelebrations: boolean
  /** Android: "agora / depois" fixo na barra de notificações (no lugar de um widget) */
  stickyPlan: boolean
  /** usar o tempo real aprendido (sessões de foco) no lugar da folga manual */
  useLearnedTimes: boolean
}

export const DEFAULT_NEURO_SETTINGS: NeuroSettings = {
  traits: [],
  visualTimer: true,
  timeAlerts: false,
  hyperfocusGuardMin: null,
  estimateFactor: 1,
  maxVisibleTasks: 5,
  predictableMode: false,
  transitionWarningsMin: [],
  reduceMotion: false,
  quietCelebrations: false,
  stickyPlan: false,
  useLearnedTimes: true,
}

/** Ponto de partida conforme os traços escolhidos (combina os de todos). */
export function neuroPreset(traits: NeuroTrait[]): NeuroSettings
{
  const s: NeuroSettings = { ...DEFAULT_NEURO_SETTINGS, traits: [...traits] }
  const warnings = new Set<number>()
  if (traits.includes('tdah'))
  {
    s.visualTimer = true
    s.timeAlerts = true
    s.hyperfocusGuardMin = 50
    s.estimateFactor = 1.25
    s.maxVisibleTasks = Math.min(s.maxVisibleTasks, 3)
    warnings.add(5)
  }
  if (traits.includes('autismo'))
  {
    s.visualTimer = true
    s.predictableMode = true
    s.reduceMotion = true
    s.quietCelebrations = true
    warnings.add(15)
    warnings.add(5)
  }
  if (traits.includes('ansiedade'))
  {
    s.maxVisibleTasks = Math.min(s.maxVisibleTasks, 3)
    warnings.add(10)
  }
  if (traits.includes('depressao'))
  {
    s.maxVisibleTasks = Math.min(s.maxVisibleTasks, 3)
    s.quietCelebrations = true
  }
  s.transitionWarningsMin = [...warnings].sort((a, b) => b - a)
  return s
}

export function normalizeNeuroSettings(raw: unknown): NeuroSettings
{
  if (!raw || typeof raw !== 'object') return DEFAULT_NEURO_SETTINGS
  const r = raw as Record<string, unknown>
  const traits = Array.isArray(r.traits)
    ? (r.traits.filter((t) => NEURO_TRAITS.some((x) => x.id === t)) as NeuroTrait[])
    : []
  const num = (v: unknown, min: number, max: number, dflt: number) =>
  {
    const n = Number(v)
    return Number.isFinite(n) && n >= min && n <= max ? n : dflt
  }
  const guard = r.hyperfocusGuardMin == null ? null : num(r.hyperfocusGuardMin, 15, 240, 50)
  return {
    traits,
    visualTimer: r.visualTimer !== false,
    timeAlerts: Boolean(r.timeAlerts),
    hyperfocusGuardMin: guard,
    estimateFactor: num(r.estimateFactor, 1, 2, 1),
    maxVisibleTasks: Math.round(num(r.maxVisibleTasks, 1, 10, 5)),
    predictableMode: Boolean(r.predictableMode),
    transitionWarningsMin: Array.isArray(r.transitionWarningsMin)
      ? r.transitionWarningsMin.map(Number).filter((n) => n >= 1 && n <= 60).slice(0, 3)
      : [],
    reduceMotion: Boolean(r.reduceMotion),
    quietCelebrations: Boolean(r.quietCelebrations),
    stickyPlan: Boolean(r.stickyPlan),
    useLearnedTimes: r.useLearnedTimes !== false,
  }
}

// ---------------------------------------------------------------------------
// Timer visual: marcos de tempo (cegueira temporal) e pausa de hiperfoco
// ---------------------------------------------------------------------------

export type TimerMilestone = 'metade' | 'faltam5' | 'fim' | 'hiperfoco'

export const TIMER_MILESTONE_COPY: Record<TimerMilestone, string> = {
  metade: 'Metade do tempo já passou.',
  faltam5: 'Faltam 5 minutos.',
  fim: 'O tempo acabou. Pode parar aqui ou continuar mais um pouco.',
  hiperfoco: 'Você está há bastante tempo seguido. Que tal uma pausa de 5 minutos: água, alongar, olhar longe?',
}

/**
 * Marcos atingidos entre o último tick e agora (para avisar uma vez só).
 * planned/elapsed em segundos; guardMin = pausa de hiperfoco.
 */
export function timerMilestonesCrossed(
  plannedSec: number,
  prevElapsedSec: number,
  elapsedSec: number,
  opts: { timeAlerts: boolean; hyperfocusGuardMin: number | null },
): TimerMilestone[]
{
  const out: TimerMilestone[] = []
  const crossed = (mark: number) => mark > 0 && prevElapsedSec < mark && elapsedSec >= mark
  if (opts.timeAlerts && plannedSec >= 10 * 60)
  {
    if (crossed(plannedSec / 2)) out.push('metade')
    if (crossed(plannedSec - 5 * 60)) out.push('faltam5')
  }
  if (plannedSec > 0 && crossed(plannedSec)) out.push('fim')
  if (opts.hyperfocusGuardMin != null && crossed(opts.hyperfocusGuardMin * 60)) out.push('hiperfoco')
  return out
}

/** Fração restante (1 → 0) para o disco que encolhe. */
export function timerRemainingFraction(plannedSec: number, elapsedSec: number): number
{
  if (plannedSec <= 0) return 0
  return Math.max(0, Math.min(1, 1 - elapsedSec / plannedSec))
}
