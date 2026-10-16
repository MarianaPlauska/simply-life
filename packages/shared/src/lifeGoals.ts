/** semana, mês ou até um dia exato (`dueDate`) */
export type LifeGoalCadence = 'week' | 'month' | 'date'

export type LifeGoalCategory =
  | 'finance'
  | 'sleep'
  | 'mental'
  | 'task'
  | 'health'
  | 'custom'

export type LifeGoal = {
  title: string
  category: LifeGoalCategory
  cadence: LifeGoalCadence
  /** ISO date (YYYY-MM-DD) em que a meta foi definida */
  periodStart: string
  /** prazo exato (YYYY-MM-DD) quando cadence = 'date' */
  dueDate?: string
  /** identifica a meta na lista (metas antigas não têm) */
  id?: string
  /** dias (YYYY-MM-DD) em que a pessoa disse "avancei hoje" */
  passos?: string[]
  /** dia em que a pessoa disse "cheguei lá" */
  feitaEm?: string | null
  /** prática escolhida (saúde mental), ver MENTAL_PRACTICES */
  pratica?: string
  /** quantas vezes até o fim do prazo (o progresso vira "2 de 3") */
  alvo?: number
  /** por que isso importa (a pessoa escreve; aparece como lembrete) */
  porque?: string
}

/** Práticas de cuidado para a meta de saúde mental. Gentis, curtas, sem cobrança. */
export const MENTAL_PRACTICES: { id: string; label: string; icon: string; hint: string }[] = [
  { id: 'respirar', label: 'Respirar com calma', icon: 'leaf', hint: 'Uns minutos de respiração lenta' },
  { id: 'diario', label: 'Escrever no diário', icon: 'pencil', hint: 'Uma frase já vale' },
  { id: 'caminhar', label: 'Caminhar ao ar livre', icon: 'sunny', hint: 'Mesmo que seja até a esquina' },
  { id: 'conversar', label: 'Conversar com alguém de confiança', icon: 'people', hint: 'Mensagem ou ligação' },
  { id: 'pausa_tela', label: 'Uma pausa sem tela', icon: 'phone-portrait', hint: 'Celular longe por um tempo' },
  { id: 'dormir', label: 'Desacelerar antes de dormir', icon: 'moon', hint: 'Luz baixa, sem pressa' },
  { id: 'musica', label: 'Ouvir algo que me acalma', icon: 'musical-notes', hint: 'Uma música, um som' },
  { id: 'gentileza', label: 'Fazer algo gentil por mim', icon: 'heart', hint: 'Um cuidado pequeno' },
  { id: 'checkin', label: 'Registrar como estou', icon: 'happy', hint: 'O check-in de humor do app' },
]

/** "Respirar com calma, 3 vezes" / "Escrever no diário, todo dia" */
export function practiceGoalTitle(practiceId: string, alvo: number, todoDia: boolean): string
{
  const label = MENTAL_PRACTICES.find((p) => p.id === practiceId)?.label ?? 'Cuidar de mim'
  return todoDia ? `${label}, todo dia` : `${label}, ${alvo} ${alvo === 1 ? 'vez' : 'vezes'}`
}

/** Até quantas metas ao mesmo tempo (mais que isso vira lista de tarefas) */
export const LIFE_GOALS_MAX = 5

export const LIFE_GOAL_TEMPLATES: {
  id: LifeGoalCategory
  label: string
  example: string
}[] = [
  { id: 'finance', label: 'Gastos', example: 'Gastar menos em delivery esta semana' },
  { id: 'sleep', label: 'Sono', example: 'Dormir pelo menos 7h por noite' },
  { id: 'mental', label: 'Saúde mental', example: 'Fazer check-in de humor 5 dias' },
  { id: 'task', label: 'Tarefa', example: 'Terminar o relatório do trabalho' },
  { id: 'health', label: 'Saúde', example: 'Beber 8 copos de água por dia' },
  { id: 'custom', label: 'Personalizada', example: 'O que importa para você agora' },
]

function startOfWeekIso(ref: Date): string
{
  const d = new Date(ref)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(12, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

/** Semanal: renova a cada semana (domingo). Mensal: renova no mês seguinte. */
export function lifeGoalNeedsRefresh(goal: LifeGoal | null | undefined, ref = new Date()): boolean
{
  if (!goal?.title?.trim()) return true
  // com dia exato: vale até o fim do prazo (inclusive)
  if (goal.cadence === 'date') return !goal.dueDate || goal.dueDate < localIso(ref)
  if (goal.cadence === 'month')
  {
    return goal.periodStart.slice(0, 7) !== ref.toISOString().slice(0, 7)
  }
  return startOfWeekIso(new Date(`${goal.periodStart}T12:00:00`))
    !== startOfWeekIso(ref)
}

export function lifeGoalMicroLabel(goal: LifeGoal | null | undefined, ref = new Date()): string
{
  if (!goal?.title?.trim() || lifeGoalNeedsRefresh(goal, ref))
  {
    return 'Defina sua meta'
  }
  const short = goal.title.trim().length > 28
    ? `${goal.title.trim().slice(0, 28)}…`
    : goal.title.trim()
  return `${lifeGoalPrefix(goal)}: ${short}`
}

function localIso(d: Date): string
{
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** "Meta semana", "Meta mês" ou "Meta até 20/10" */
export function lifeGoalPrefix(goal: Pick<LifeGoal, 'cadence' | 'dueDate'>): string
{
  if (goal.cadence === 'date' && goal.dueDate) return `Meta até ${goal.dueDate.slice(8, 10)}/${goal.dueDate.slice(5, 7)}`
  return goal.cadence === 'month' ? 'Meta mês' : 'Meta semana'
}

/** Prazo em texto curto para a lista: "esta semana", "este mês", "até 20/10" */
export function lifeGoalDueLabel(goal: Pick<LifeGoal, 'cadence' | 'dueDate'>): string
{
  if (goal.cadence === 'date' && goal.dueDate) return `até ${goal.dueDate.slice(8, 10)}/${goal.dueDate.slice(5, 7)}`
  return goal.cadence === 'month' ? 'este mês' : 'esta semana'
}

/**
 * Metas valendo agora. Junta a lista nova (`life_goals`) com a meta única antiga
 * (`life_goal`), sem repetir, e tira as que já passaram do prazo.
 */
export function activeLifeGoals(
  list: LifeGoal[] | null | undefined,
  legacy: LifeGoal | null | undefined,
  ref = new Date(),
): LifeGoal[]
{
  const all = [...(Array.isArray(list) ? list : [])]
  if (legacy?.title?.trim() && !all.some((g) => g.title.trim() === legacy.title.trim() && g.periodStart === legacy.periodStart))
  {
    all.unshift(legacy)
  }
  return all.filter((g) => !lifeGoalNeedsRefresh(g, ref)).slice(0, LIFE_GOALS_MAX)
}


// ---------------------------------------------------------------------------
// Progresso sem ansiedade: tempo em tom calmo, passos que somam, nunca "falhou"
// ---------------------------------------------------------------------------

function isoPlus(iso: string, days: number): string
{
  const [y, m, d] = iso.split('-').map(Number)
  return localIso(new Date(y, m - 1, d + days, 12))
}

function daysBetweenIso(from: string, to: string): number
{
  const [y1, m1, d1] = from.split('-').map(Number)
  const [y2, m2, d2] = to.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000)
}

/** Último dia da meta: sábado da semana em que foi criada, fim do mês, ou o dia escolhido. */
export function lifeGoalEndIso(goal: Pick<LifeGoal, 'cadence' | 'periodStart' | 'dueDate'>): string
{
  if (goal.cadence === 'date' && goal.dueDate) return goal.dueDate
  const [y, m, d] = goal.periodStart.split('-').map(Number)
  if (goal.cadence === 'month') return localIso(new Date(y, m, 0, 12))
  // semana de domingo a sábado (a mesma regra de lifeGoalNeedsRefresh)
  const dow = new Date(y, m - 1, d, 12).getDay()
  return isoPlus(goal.periodStart, 6 - dow)
}

export type LifeGoalProgress = {
  fim: string
  /** dias até o fim, contando hoje (1 = hoje é o último dia) */
  diasRestantes: number
  passos: number
  passoHoje: boolean
  feita: boolean
  /** quantas vezes a pessoa quer fazer (null = sem número) */
  alvo: number | null
}

export function lifeGoalProgress(goal: LifeGoal, ref = new Date()): LifeGoalProgress
{
  const hoje = localIso(ref)
  const fim = lifeGoalEndIso(goal)
  const passos = [...new Set(goal.passos ?? [])]
  return {
    fim,
    diasRestantes: Math.max(1, daysBetweenIso(hoje, fim) + 1),
    passos: passos.length,
    passoHoje: passos.includes(hoje),
    feita: Boolean(goal.feitaEm),
    alvo: goal.alvo && goal.alvo > 0 ? goal.alvo : null,
  }
}

/** Quanto falta, sem pressa: "faltam 5 dias, no seu ritmo" / "hoje é o último dia". */
export function lifeGoalTimeLabel(p: LifeGoalProgress): string
{
  if (p.feita) return 'cumprida'
  if (p.diasRestantes <= 1) return 'hoje é o último dia, e o que você fez até aqui já vale'
  if (p.diasRestantes === 2) return 'falta 1 dia, no seu ritmo'
  return `faltam ${p.diasRestantes - 1} dias, no seu ritmo`
}

const CHEER: Record<'feita' | 'alvo' | 'muitos' | 'poucos' | 'nenhum', string[]> = {
  alvo: [
    'Você fez as {n} vezes. Que orgulho de você.',
    '{n} de {n}: você cumpriu o que combinou com você.',
    'Todas as {n} vezes feitas. Isso é cuidado de verdade.',
  ],
  feita: [
    'Você chegou lá. Guarde essa sensação.',
    'Meta cumprida. Você fez isso acontecer.',
    'Conseguiu! Vale comemorar, do seu jeito.',
  ],
  muitos: [
    '{n} passos até aqui. Você está construindo isso.',
    'Olha quanto você já andou: {n} passos.',
    '{n} passos dados. Isso é constância de verdade.',
  ],
  poucos: [
    'Você já começou, e começar é a parte mais difícil.',
    '{n} passo{s} dado{s}. Um de cada vez, como deve ser.',
    'Já tem caminho andado. Siga no seu tempo.',
  ],
  nenhum: [
    'Um passo pequeno hoje já conta.',
    'Sem pressa: comece pelo menor pedaço.',
    'Qualquer avanço vale, até o menorzinho.',
  ],
}

/** Frase de orgulho pela meta. Muda com os passos, nunca cobra. */
export function lifeGoalCheer(p: LifeGoalProgress, seed = 0): string
{
  const faixa = p.feita
    ? 'feita'
    : p.alvo && p.passos >= p.alvo ? 'alvo' : p.passos >= 3 ? 'muitos' : p.passos >= 1 ? 'poucos' : 'nenhum'
  const lista = CHEER[faixa]
  const plural = p.passos === 1 ? '' : 's'
  return lista[Math.abs(seed + p.passos) % lista.length].replace('{n}', String(p.passos)).replace(/\{s\}/g, plural)
}

/** Marca ou desmarca o passo de hoje. */
export function lifeGoalTogglePasso(goal: LifeGoal, ref = new Date()): LifeGoal
{
  const hoje = localIso(ref)
  const passos = goal.passos ?? []
  return { ...goal, passos: passos.includes(hoje) ? passos.filter((d) => d !== hoje) : [...passos, hoje] }
}

/** "Cheguei lá" (ou desfaz). Marcar como feita também conta o passo do dia. */
export function lifeGoalToggleFeita(goal: LifeGoal, ref = new Date()): LifeGoal
{
  if (goal.feitaEm) return { ...goal, feitaEm: null }
  const hoje = localIso(ref)
  const passos = goal.passos ?? []
  return { ...goal, feitaEm: hoje, passos: passos.includes(hoje) ? passos : [...passos, hoje] }
}

/** Quantos dias a meta cobre, do dia em que foi criada até o fim (para "todo dia") */
export function lifeGoalPeriodDays(goal: Pick<LifeGoal, 'cadence' | 'periodStart' | 'dueDate'>): number
{
  return Math.max(1, daysBetweenIso(goal.periodStart, lifeGoalEndIso(goal)) + 1)
}

// ---------------------------------------------------------------------------
// Data no jeito do Brasil (DD/MM/AAAA) para os campos de prazo
// ---------------------------------------------------------------------------

/** "2026-10-12" vira "12/10/2026" */
export function brDateFromIso(iso: string): string
{
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : ''
}

/** Vai pondo as barras enquanto a pessoa digita: "1210" vira "12/10" */
export function maskBrDate(raw: string): string
{
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

/** "12/10/2026" vira "2026-10-12"; null se a data não existe (31/02, por exemplo) */
export function isoFromBrDate(br: string): string | null
{
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br.trim())
  if (!m) return null
  const [, d, mo, y] = m
  const date = new Date(Number(y), Number(mo) - 1, Number(d), 12)
  if (date.getDate() !== Number(d) || date.getMonth() !== Number(mo) - 1) return null
  return `${y}-${mo}-${d}`
}

// ---------------------------------------------------------------------------
// Pausa das metas na Home: sempre com fim, nunca "para sempre"
// ---------------------------------------------------------------------------

export const LIFE_GOALS_PAUSE_OPTIONS: { days: number; label: string }[] = [
  { days: 1, label: 'Só hoje' },
  { days: 3, label: '3 dias' },
  { days: 7, label: '1 semana' },
  { days: 30, label: '1 mês' },
]

/** Último dia da pausa (inclusive). 1 dia = só hoje. Nunca passa de 30 dias. */
export function lifeGoalsPauseUntil(days: number, ref = new Date()): string
{
  const n = Math.min(30, Math.max(1, Math.round(days)))
  return isoPlus(localIso(ref), n - 1)
}

export function lifeGoalsPaused(until: string | null | undefined, ref = new Date()): boolean
{
  return Boolean(until) && (until as string) >= localIso(ref)
}
