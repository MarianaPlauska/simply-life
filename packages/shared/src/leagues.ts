/**
 * Ligas cooperativas: 2 a 8 pessoas enchem um pote semanal de XP. Bateu,
 * a liga inteira sobe de divisão. Não existe rebaixamento.
 * Banco: migração 073. O grupo só vê a faixa do pote (0..4), nunca o XP
 * de cada pessoa nem a soma.
 */
export type LeagueType = 'amigos' | 'tematica'
export type LeagueArea = 'geral' | 'tarefas' | 'foco' | 'treino'

export const LEAGUE_AREAS: { id: LeagueArea; label: string; hint: string }[] = [
  { id: 'geral', label: 'Tudo', hint: 'Todo XP conta: tarefas, foco, treino, registros.' },
  { id: 'tarefas', label: 'Tarefas', hint: 'Só o XP de tarefas concluídas.' },
  { id: 'foco', label: 'Foco', hint: 'Só o XP das sessões de foco.' },
  { id: 'treino', label: 'Treino', hint: 'Só o XP de treinos e séries.' },
]

/** Divisões das ligas: paisagens (as plantas ficam para a divisão pessoal). */
export const LEAGUE_DIVISIONS = [
  'Trilha',
  'Riacho',
  'Vale',
  'Colina',
  'Serra',
  'Planalto',
  'Pico',
  'Cordilheira',
  'Horizonte',
  'Céu aberto',
] as const

export function leagueDivisionName(d: number): string
{
  const i = Math.max(0, Math.min(LEAGUE_DIVISIONS.length - 1, d))
  const extra = d - (LEAGUE_DIVISIONS.length - 1)
  return extra > 0 ? `${LEAGUE_DIVISIONS[i]} ${extra + 1}` : LEAGUE_DIVISIONS[i]!
}

export const LEAGUE_MAX_MEMBERS = 8

/** Mapeia o título do XP para a área temática (o XP geral conta sempre). */
export function xpAreaFromTitle(title: string): Exclude<LeagueArea, 'geral'> | null
{
  const t = title.toLowerCase()
  if (t.startsWith('tarefa')) return 'tarefas'
  if (t.includes('foco')) return 'foco'
  if (t.includes('treino')) return 'treino'
  return null
}

export type League = {
  id: string
  nome: string
  tipo: LeagueType
  area: LeagueArea
  divisao: number
  createdBy: string
  inicio: string
}

export type LeagueProgress = {
  semana: string
  divisao: number
  membros: number
  /** 0..4; null com uma pessoa só (a faixa entregaria o número dela) */
  faixa: number | null
  diasRestantes: number
  semanaPassada: { semana: string; faixa: number; subiu: boolean } | null
}

export type LeagueMember = {
  userId: string
  displayName: string
  accent: string
  avatarStyle: string
  role: 'owner' | 'member'
  isMe: boolean
}

const FAIXA_LINES = [
  'O pote está começando a encher.',
  'Um quarto do pote. Cada passo de cada um soma.',
  'Metade do pote, juntos.',
  'Quase cheio. Falta pouco para a liga subir.',
  'Pote cheio. A liga sobe na segunda.',
]

/** Frase do pote: sempre sobre o grupo, nunca sobre alguém. */
export function leaguePotLine(p: LeagueProgress): string
{
  if (p.membros < 2) return 'Chame pelo menos mais uma pessoa para o pote começar a valer.'
  return FAIXA_LINES[Math.max(0, Math.min(4, p.faixa ?? 0))]!
}

/** Semana passada: subiu ou ficou. Sem rebaixamento e sem culpa. */
export function leagueLastWeekLine(p: LeagueProgress): string | null
{
  const w = p.semanaPassada
  if (!w) return null
  if (w.subiu) return `Semana passada a liga encheu o pote e subiu para ${leagueDivisionName(p.divisao)}.`
  return 'Semana passada o pote não encheu, e tudo bem. A liga continua no mesmo lugar e a semana nova começa do zero.'
}
