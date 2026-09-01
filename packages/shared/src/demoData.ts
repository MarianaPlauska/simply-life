import type { HumorRegistro } from './mood'
import { moodLabel } from './mood'
import type { MobileTask } from './tasks'
import type { FinanceTx } from './finance'
import { formatBRL, monthExpenseTotal, monthIncomeTotal } from './finance'
import { todayIso, isoDaysAgo } from './dates'
import type { HabitoDiario } from './habits'
import { demoHabits, findHabit, habitPct } from './habits'

/** Dados de demo para UI mobile sem backend */
export function demoHumor(): HumorRegistro[]
{
  const moods = [5, 4, 3, 2, 1, 4, 5, 3, 2, 4, 5, 3, 4, 2, 5]
  return moods.map((humor, i) =>
  {
    const data = isoDaysAgo(i)
    return {
      id: i + 1,
      data,
      humor,
      nota: i % 3 === 0 ? 'Registro de demo' : null,
      created_at: `${data}T12:00:00.000Z`,
    }
  })
}

export function demoTasks(): MobileTask[]
{
  const today = todayIso()
  return [
    {
      id: 't1',
      titulo: 'Meditação',
      status: 'done',
      dataVencimento: today,
      horaMinutos: 7 * 60,
      estimativaMinutos: 15,
      progresso: 1,
      checklist: [{ id: 'c1', texto: 'Respirar 5 min', feito: true }],
      anotacao: '',
      prioridade: 2,
    },
    {
      id: 't2',
      titulo: 'Reunião com o time',
      status: 'doing',
      dataVencimento: today,
      horaMinutos: 10 * 60,
      estimativaMinutos: 45,
      progresso: 0.4,
      checklist: [
        { id: 'c2', texto: 'Abrir pauta', feito: true },
        { id: 'c3', texto: 'Notas de ação', feito: false },
      ],
      anotacao: 'Focar em prioridades da semana',
      prioridade: 1,
    },
    {
      id: 't3',
      titulo: 'Treino',
      status: 'todo',
      dataVencimento: today,
      horaMinutos: 18 * 60,
      estimativaMinutos: 50,
      progresso: 0,
      checklist: [],
      anotacao: '',
      prioridade: 2,
    },
    {
      id: 't4',
      titulo: 'Escrever diário',
      status: 'todo',
      dataVencimento: today,
      horaMinutos: 21 * 60 + 30,
      estimativaMinutos: 20,
      progresso: 0,
      checklist: [
        { id: 'c4', texto: 'Humor do dia', feito: false },
        { id: 'c5', texto: '3 gratidões', feito: false },
      ],
      anotacao: '',
      prioridade: 3,
    },
  ]
}

export function demoFinance(): FinanceTx[]
{
  const today = todayIso()
  return [
    { id: 'f1', titulo: 'Salário', valor: 8500, categoria: 'outros', data: isoDaysAgo(5), tipo: 'receita' },
    { id: 'f2', titulo: 'Aluguel', valor: 2200, categoria: 'habitacao', data: isoDaysAgo(3), tipo: 'despesa' },
    { id: 'f3', titulo: 'Mercado', valor: 420, categoria: 'alimentacao', data: isoDaysAgo(2), tipo: 'despesa' },
    { id: 'f4', titulo: 'Uber', valor: 68, categoria: 'transporte', data: isoDaysAgo(1), tipo: 'despesa' },
    { id: 'f5', titulo: 'Cinema', valor: 90, categoria: 'lazer', data: today, tipo: 'despesa' },
    { id: 'f6', titulo: 'Farmácia', valor: 55, categoria: 'saude', data: today, tipo: 'despesa' },
    { id: 'f7', titulo: 'Curso online', valor: 120, categoria: 'educacao', data: isoDaysAgo(4), tipo: 'despesa' },
    { id: 'f8', titulo: 'Roupas', valor: 180, categoria: 'compras', data: isoDaysAgo(6), tipo: 'despesa' },
  ]
}

export interface DashboardGlance
{
  id: string
  label: string
  value: string
  tone: 'axel' | 'health' | 'finance' | 'tasks'
  /** 0–100 para barra/anel de progresso na Home */
  progress: number
  /** Nome Ionicons (ex.: water-outline) */
  icon: string
}

export function demoGlances(): DashboardGlance[]
{
  return buildDashboardGlances({
    humor: demoHumor(),
    tasks: demoTasks(),
    finance: demoFinance(),
    habits: demoHabits(),
  })
}

export function buildDashboardGlances(input: {
  humor: HumorRegistro[]
  tasks: MobileTask[]
  finance: FinanceTx[]
  habits?: HabitoDiario[]
}): DashboardGlance[]
{
  const lastHumor = [...input.humor].sort((a, b) =>
  {
    const ta = a.created_at || a.data
    const tb = b.created_at || b.data
    return tb.localeCompare(ta)
  })[0]
  const open = input.tasks.filter((t) => t.status !== 'done').length
  const gastos = monthExpenseTotal(input.finance)
  const receitas = monthIncomeTotal(input.finance)
  const agua = findHabit(input.habits ?? [], 'agua')
  const proteina = findHabit(input.habits ?? [], 'proteina')

  const today = todayIso()
  const todayTasks = input.tasks.filter((t) =>
  {
    if (t.dataVencimento?.slice(0, 10) === today) return true
    if (t.horaMinutos != null && !t.dataVencimento) return true
    return false
  })
  const doneToday = todayTasks.filter((t) => t.status === 'done').length
  const tasksProgress =
    todayTasks.length > 0
      ? Math.round((doneToday / todayTasks.length) * 100)
      : 0

  const humorProgress = lastHumor
    ? Math.min(100, Math.round((lastHumor.humor / 5) * 100))
    : 0
  const financeProgress =
    receitas > 0
      ? Math.min(100, Math.round((gastos / receitas) * 100))
      : 0

  return [
    {
      id: 'g-humor',
      label: 'Humor',
      value: lastHumor ? moodLabel(lastHumor.humor) : '—',
      tone: 'axel',
      progress: humorProgress,
      icon: 'happy-outline',
    },
    {
      id: 'g-agua',
      label: 'Água',
      value: agua ? `${agua.progressoAtual}/${agua.metaDiaria} · ${habitPct(agua)}%` : '—',
      tone: 'health',
      progress: habitPct(agua),
      icon: 'water-outline',
    },
    {
      id: 'g-proteina',
      label: 'Proteína',
      value: proteina ? `${proteina.progressoAtual}g` : '—',
      tone: 'health',
      progress: habitPct(proteina),
      icon: 'nutrition-outline',
    },
    {
      id: 'g-tasks',
      label: 'Tarefas',
      value: open === 1 ? '1 em aberto' : `${open} em aberto`,
      tone: 'tasks',
      progress: tasksProgress,
      icon: 'checkbox-outline',
    },
    {
      id: 'g-finance',
      label: 'Gastos',
      value: formatBRL(gastos),
      tone: 'finance',
      progress: financeProgress,
      icon: 'wallet-outline',
    },
  ]
}
