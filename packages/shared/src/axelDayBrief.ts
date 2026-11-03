import { findHabit, habitPct, type HabitoDiario } from './habits'
import { medsTakenCount, type Medicamento } from './medicamentos'
import { priorityTodayTasks, type MobileTask } from './tasks'
import { monthExpenseTotal, type FinanceTx } from './finance'
import { computeSaldoDisponivel, type CashAccount, type ContaFixa } from './financeAccounts'
import { sanitizeAxelCopy, type MoodLevel } from './axelCare'

export type AxelDayBriefInput = {
  tasks: MobileTask[]
  habits: HabitoDiario[]
  medicamentos: Medicamento[]
  finance: FinanceTx[]
  cash: CashAccount
  fixas: ContaFixa[]
  lastAxelCare?: string | null
  /** Humor de hoje (1-5). Calibra o tom da conversa. */
  moodLevel?: number | null
  now?: Date
}

export type AxelMoodTone = 'heavy' | 'soft' | 'steady' | 'bright'

export type AxelDayBriefResult = {
  headline: string
  /** 1-2 frases curtas - progressive disclosure (apps de saúde mental) */
  voice: string
  gaps: string[]
  nextSteps: string[]
  chips: string[]
  moodTone: AxelMoodTone
  moodLevel: MoodLevel | null
  /** Tarefa do primeiro passo, quando o passo é uma tarefa de verdade. */
  focusTaskId: string | null
}

function clampMood(level?: number | null): MoodLevel | null
{
  if (level == null || !Number.isFinite(level)) return null
  return Math.min(5, Math.max(1, Math.round(level))) as MoodLevel
}

function moodToneOf(level: MoodLevel | null): AxelMoodTone
{
  if (level == null || level === 3) return 'steady'
  if (level <= 1) return 'heavy'
  if (level === 2) return 'soft'
  return 'bright'
}

/** Uma linha objetiva. Sem coach, sem “modo”. */
function moodOpener(tone: AxelMoodTone): string
{
  if (tone === 'heavy') return 'Pode ir no mínimo hoje.'
  if (tone === 'soft') return 'Só o essencial.'
  if (tone === 'bright') return 'Tem espaço para avançar.'
  return 'Prioridade clara, sem excesso.'
}

function moodFocusLine(
  tone: AxelMoodTone,
  topTitle: string | null,
): string
{
  if (!topTitle)
  {
    return tone === 'heavy' || tone === 'soft'
      ? 'A fila espera.'
      : 'Nada urgente na fila.'
  }
  if (tone === 'heavy' || tone === 'soft')
  {
    return `Hoje: ${topTitle}.`
  }
  return `Comece por ${topTitle}.`
}

function moodHeadline(
  tone: AxelMoodTone,
  topTask: boolean,
  overdue: number,
): string
{
  if (tone === 'heavy') return topTask ? 'Uma coisa de cada vez' : 'Dia mais leve'
  if (tone === 'soft') return topTask ? 'Com calma' : 'Sem pressa'
  if (tone === 'bright')
  {
    return overdue > 0 ? 'Dá para adiantar o atraso' : 'Bom ritmo'
  }
  if (topTask) return overdue > 0 ? 'Tem atraso para resolver' : 'O que importa agora'
  return 'Nada urgente'
}

/**
 * Orquestração do dia - menos texto, um foco.
 * Padrão de apps calm/ansiedade: progressive disclosure no UI.
 */
export function buildAxelDayBrief(input: AxelDayBriefInput): AxelDayBriefResult
{
  const now = input.now ?? new Date()
  const moodLevel = clampMood(input.moodLevel)
  const moodTone = moodToneOf(moodLevel)

  const top = priorityTodayTasks(input.tasks, now, 3)
  const topTask = top[0]?.task ?? null
  const openCount = input.tasks.filter((t) => t.status !== 'done').length
  const overdue = top.filter((t) => t.bucket === 'vencido').length

  const agua = findHabit(input.habits, 'agua')
  const waterPct = habitPct(agua)
  const treino = findHabit(input.habits, 'treino')
  const proteina = findHabit(input.habits, 'proteina')
  const medsDone = medsTakenCount(input.medicamentos)
  const medsTotal = input.medicamentos.length
  const gastos = monthExpenseTotal(input.finance)
  const saldo = computeSaldoDisponivel(input.cash, input.finance, input.fixas).disponivel ?? 0

  const gaps: string[] = []
  if (overdue > 0)
  {
    gaps.push(
      overdue === 1
        ? '1 tarefa atrasada'
        : `${overdue} tarefas atrasadas`,
    )
  }
  if (agua && waterPct < 50)
  {
    gaps.push(`Água em ${waterPct}%`)
  }
  if (medsTotal > 0 && medsDone < medsTotal)
  {
    gaps.push(`${medsTotal - medsDone} dose(s) pendente(s)`)
  }
  if (treino && treino.progressoAtual < treino.metaDiaria && moodTone !== 'heavy')
  {
    gaps.push('Treino ainda em aberto')
  }
  if (proteina && habitPct(proteina) < 40 && moodTone !== 'heavy')
  {
    gaps.push('Proteína baixa')
  }
  if (saldo < 500)
  {
    gaps.push('Saldo apertado')
  }
  if (gaps.length === 0 && openCount > 5)
  {
    gaps.push(`${openCount} tarefas abertas`)
  }

  const nextSteps: string[] = []
  if (topTask)
  {
    nextSteps.push(
      moodTone === 'heavy' || moodTone === 'soft'
        ? topTask.titulo
        : `Fazer: ${topTask.titulo}`,
    )
  }
  else
  {
    nextSteps.push(
      moodTone === 'heavy' || moodTone === 'soft'
        ? 'Beber água ou marcar o humor'
        : 'Beber água, marcar humor ou lançar um gasto',
    )
  }
  if (agua && waterPct < 70)
  {
    nextSteps.push(`Um copo agora (${agua.progressoAtual}/${agua.metaDiaria})`)
  }
  if (medsTotal > 0 && medsDone < medsTotal && moodTone !== 'heavy')
  {
    nextSteps.push('Marque a dose quando tomar')
  }
  if (gastos > 0 && moodTone === 'bright')
  {
    nextSteps.push('Olhe 1 lançamento do mês se algo soar estranho')
  }

  const chips: string[] = []
  if (topTask) chips.push(topTask.titulo)
  if (agua) chips.push(`Água ${agua.progressoAtual}/${agua.metaDiaria}`)
  if (medsTotal > 0) chips.push(`${medsDone}/${medsTotal} doses`)

  const opener = moodOpener(moodTone)
  const focusLine = moodFocusLine(moodTone, topTask?.titulo ?? null)
  const voice = sanitizeAxelCopy(`${opener} ${focusLine}`)

  return {
    headline: moodHeadline(moodTone, Boolean(topTask), overdue),
    voice,
    gaps: gaps.slice(0, 2),
    nextSteps: nextSteps.slice(0, 2),
    chips: chips.slice(0, 3),
    moodTone,
    moodLevel,
    focusTaskId: topTask?.id ?? null,
  }
}
