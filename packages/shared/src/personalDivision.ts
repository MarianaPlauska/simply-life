import { localTodayIso } from './dates'
import { addDaysIso } from './taskPrompt'
import { weekStartIso } from './chamaRewards'

/**
 * Divisão contra você mesmo. Toda segunda começa uma semana com um alvo de XP
 * tirado da sua própria média (últimas 4 semanas). Bateu, sobe um degrau.
 * Não bateu, fica onde está: nunca desce. Sem comparação com ninguém.
 */
export const PERSONAL_DIVISION_START_TARGET = 60
const MIN_TARGET = 40
/** alvo = média × 1,05: um passo pequeno além do que você já faz */
const STRETCH = 1.05

export const PERSONAL_DIVISIONS = [
  'Semente',
  'Broto',
  'Muda',
  'Raiz',
  'Tronco',
  'Galho',
  'Copa',
  'Árvore',
  'Bosque',
  'Floresta',
] as const

export function divisionName(step: number): string
{
  const i = Math.max(0, Math.min(PERSONAL_DIVISIONS.length - 1, step))
  const base = PERSONAL_DIVISIONS[i]!
  const extra = step - (PERSONAL_DIVISIONS.length - 1)
  return extra > 0 ? `${base} ${extra + 1}` : base
}

export type DivisionWeek = {
  start: string
  xp: number
  target: number
  hit: boolean
  /** degrau ao fim da semana */
  step: number
}

export type PersonalDivision = {
  step: number
  name: string
  /** semana em andamento */
  current: { start: string; xp: number; target: number; pct: number; hit: boolean }
  /** semanas encerradas, da mais recente para a mais antiga */
  history: DivisionWeek[]
  lastWeek: DivisionWeek | null
}

function targetFrom(previous: number[]): number
{
  const last = previous.slice(-4).filter((x) => x > 0)
  if (last.length === 0) return PERSONAL_DIVISION_START_TARGET
  const avg = last.reduce((a, b) => a + b, 0) / last.length
  return Math.max(MIN_TARGET, Math.round((avg * STRETCH) / 5) * 5)
}

export function buildPersonalDivision(weekXp: Record<string, number>, ref = new Date()): PersonalDivision
{
  const thisWeek = weekStartIso(localTodayIso(ref))
  const weeks = Object.keys(weekXp).filter((w) => w < thisWeek).sort()
  const history: DivisionWeek[] = []
  const xps: number[] = []
  let step = 0

  if (weeks.length)
  {
    for (let w = weeks[0]!; w < thisWeek; w = addDaysIso(w, 7))
    {
      const xp = weekXp[w] ?? 0
      const target = targetFrom(xps)
      const hit = xp >= target
      if (hit) step += 1
      history.push({ start: w, xp, target, hit, step })
      xps.push(xp)
    }
  }

  const xp = weekXp[thisWeek] ?? 0
  const target = targetFrom(xps)
  history.reverse()
  return {
    step,
    name: divisionName(step),
    current: { start: thisWeek, xp, target, pct: target > 0 ? Math.min(1, xp / target) : 0, hit: xp >= target },
    history,
    lastWeek: history[0] ?? null,
  }
}

/**
 * Textos para a semana que não subiu. Calmos, sem cobrança. A escolha é fixa
 * por semana (mesma semana, mesmo texto), para não parecer aleatório.
 */
export const CALM_WEEK_MESSAGES: string[] = [
  'Semana que não sobe também conta. Você continua no mesmo degrau, e ele é seu.',
  'Algumas semanas são de plantar, não de colher. Está tudo bem seguir no seu tempo.',
  'Você não perdeu nada. A nova semana começa leve, com um alvo do seu tamanho.',
  'Descansar faz parte do caminho. O degrau espera por você.',
  'O que você fez valeu, mesmo sem subir. Pequenos passos ainda são passos.',
  'Semana puxada? O alvo desta semana se ajusta ao que você vem conseguindo.',
  'Ninguém está comparando. Esta é só a sua trilha, no seu ritmo.',
  'Recomeçar na segunda é um presente, não uma cobrança.',
]

/** Mensagens de meio de semana: informam sem pressionar. */
export function midWeekLine(xp: number, target: number): string
{
  if (xp >= target) return 'Alvo da semana alcançado. O resto da semana é bônus, sem obrigação.'
  if (xp === 0) return 'A semana está começando. Qualquer passo pequeno já conta.'
  const pct = xp / target
  if (pct < 0.5) return 'Você já começou. Siga no seu ritmo, a semana ainda tem espaço.'
  return 'Mais da metade do caminho. Sem pressa, o alvo continua do seu tamanho.'
}

function hashWeek(iso: string): number
{
  let h = 0
  for (const ch of iso) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

export function calmWeekMessage(weekStart: string): string
{
  return CALM_WEEK_MESSAGES[hashWeek(weekStart) % CALM_WEEK_MESSAGES.length]!
}

/** Frase sobre a semana passada: subiu ou ficou (nunca "perdeu"). */
export function lastWeekLine(w: DivisionWeek | null): string | null
{
  if (!w) return null
  if (w.hit) return `Semana passada você subiu para ${divisionName(w.step)}. Bonito de ver.`
  return calmWeekMessage(w.start)
}
