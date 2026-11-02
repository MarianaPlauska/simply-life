import type { HumorRegistro } from './mood'
import { moodLabel } from './mood'
import type { MobileTask } from './tasks'
import type { FinanceTx } from './finance'
import { formatBRL, monthExpenseTotal, monthIncomeTotal } from './finance'
import { todayIso, isoDaysAgo } from './dates'
import type { HabitoDiario } from './habits'
import { findHabit, habitPct } from './habits'

/** Dados de demo para UI mobile sem backend */
export function demoHumor(): HumorRegistro[]
{
  const moods = [5, 4, 3, 2, 1, 4, 5, 3, 2, 4, 5, 3, 4, 2, 5]
  return moods.map((humor, i) =>
  {
    const data = isoDaysAgo(i + 1)
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
      titulo: 'Regar a samambaia',
      status: 'done',
      dataVencimento: today,
      horaMinutos: 7 * 60,
      estimativaMinutos: 15,
      progresso: 1,
      checklist: [{ id: 'c1', texto: 'Encher o regador', feito: true }],
      anotacao: '',
      prioridade: 2,
    },
    {
      id: 't1b',
      titulo: 'Devolver o livro na biblioteca',
      status: 'todo',
      dataVencimento: isoDaysAgo(1),
      horaMinutos: 17 * 60,
      estimativaMinutos: 30,
      progresso: 0,
      checklist: [],
      anotacao: '',
      prioridade: 1,
    },
    {
      id: 't2',
      titulo: 'Separar a correspondência',
      status: 'doing',
      dataVencimento: today,
      horaMinutos: 10 * 60,
      estimativaMinutos: 45,
      progresso: 0.4,
      checklist: [
        { id: 'c2', texto: 'Abrir a caixa', feito: true },
        { id: 'c3', texto: 'Guardar o que ficou', feito: false },
      ],
      anotacao: 'Só o que chegou nesta semana',
      prioridade: 1,
    },
    {
      id: 't3',
      titulo: 'Aula de origami',
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
      titulo: 'Anotar um sonho',
      status: 'todo',
      dataVencimento: today,
      horaMinutos: 21 * 60 + 30,
      estimativaMinutos: 20,
      progresso: 0,
      checklist: [
        { id: 'c4', texto: 'Uma frase', feito: false },
        { id: 'c5', texto: 'Guardar o caderno', feito: false },
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
    { id: 'f1', titulo: 'Mesada fictícia', valor: 640, categoria: 'outros', data: isoDaysAgo(5), tipo: 'receita' },
    { id: 'f2', titulo: 'Aluguel do quiosque', valor: 90, categoria: 'habitacao', data: isoDaysAgo(3), tipo: 'despesa' },
    { id: 'f3', titulo: 'Feira de mudas', valor: 27, categoria: 'alimentacao', data: isoDaysAgo(2), tipo: 'despesa' },
    { id: 'f4', titulo: 'Barca', valor: 14, categoria: 'transporte', data: isoDaysAgo(1), tipo: 'despesa' },
    { id: 'f5', titulo: 'Revista em quadrinhos', valor: 18, categoria: 'lazer', data: today, tipo: 'despesa' },
    { id: 'f6', titulo: 'Tinta guache', valor: 11, categoria: 'saude', data: today, tipo: 'despesa' },
    { id: 'f7', titulo: 'Aula de origami', valor: 33, categoria: 'educacao', data: isoDaysAgo(4), tipo: 'despesa' },
    { id: 'f8', titulo: 'Caderno pautado', valor: 22, categoria: 'compras', data: isoDaysAgo(6), tipo: 'despesa' },
    {
      id: 'f9',
      titulo: '[Cartão lilás] Assinatura de revista',
      valor: 9,
      categoria: 'lazer',
      data: isoDaysAgo(2),
      tipo: 'despesa',
      cardId: 'c1',
    },
    {
      id: 'f10',
      titulo: '[Cartão lilás] Giz de cera',
      valor: 6,
      categoria: 'saude',
      data: isoDaysAgo(1),
      tipo: 'despesa',
      cardId: 'c1',
    },
    {
      id: 'f11',
      titulo: '[Cartão azul] Passagem de barco',
      valor: 40,
      categoria: 'transporte',
      data: isoDaysAgo(3),
      tipo: 'despesa',
      cardId: 'c2',
    },
  ]
}

export interface DashboardGlance
{
  id: string
  label: string
  value: string
  tone: 'axel' | 'health' | 'finance' | 'tasks'
  /** 0-100 para barra/anel de progresso na Home */
  progress: number
  /** Nome Ionicons (ex.: water-outline) */
  icon: string
}

export function buildDashboardGlances(input: {
  humor: HumorRegistro[]
  tasks: MobileTask[]
  finance: FinanceTx[]
  habits?: HabitoDiario[]
}): DashboardGlance[]
{
  const humorList = input.humor ?? []
  const taskList = input.tasks ?? []
  const financeList = input.finance ?? []
  const lastHumor = [...humorList].sort((a, b) =>
  {
    const ta = a.created_at || a.data
    const tb = b.created_at || b.data
    return tb.localeCompare(ta)
  })[0]
  const open = taskList.filter((t) => t.status !== 'done').length
  const gastos = monthExpenseTotal(financeList) ?? 0
  const receitas = monthIncomeTotal(financeList) ?? 0
  const agua = findHabit(input.habits ?? [], 'agua')
  const proteina = findHabit(input.habits ?? [], 'proteina')

  const today = todayIso()
  const todayTasks = taskList.filter((t) =>
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
  const goalsProgress =
    todayTasks.length > 0
      ? Math.round((doneToday / todayTasks.length) * 100)
      : 0

  return [
    {
      id: 'g-humor',
      label: 'Humor',
      value: lastHumor ? moodLabel(lastHumor.humor) : '-',
      tone: 'axel',
      progress: humorProgress,
      icon: 'happy-outline',
    },
    {
      id: 'g-agua',
      label: 'Água',
      value: agua ? `${agua.progressoAtual}/${agua.metaDiaria}` : '-',
      tone: 'health',
      progress: habitPct(agua) ?? 0,
      icon: 'water-outline',
    },
    {
      id: 'g-proteina',
      label: 'Proteína',
      value: proteina ? `${proteina.progressoAtual}g` : '-',
      tone: 'health',
      progress: habitPct(proteina) ?? 0,
      icon: 'nutrition-outline',
    },
    {
      id: 'g-tasks',
      label: 'Tarefas',
      value: open === 1 ? '1 aberta' : `${open} abertas`,
      tone: 'tasks',
      progress: tasksProgress,
      icon: 'checkbox-outline',
    },
    {
      id: 'g-finance',
      label: 'Gastos',
      value: formatBRL(gastos ?? 0),
      tone: 'finance',
      progress: financeProgress,
      icon: 'wallet-outline',
    },
    {
      id: 'g-goals',
      label: 'Metas do dia',
      value: todayTasks.length > 0 ? `${doneToday}/${todayTasks.length}` : '-',
      tone: 'tasks',
      progress: goalsProgress,
      icon: 'flag-outline',
    },
  ]
}
