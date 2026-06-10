import type { TarefaUnificada } from '../types'

// Mock do Dashboard ORION — exemplos genéricos do produto (dev/preview)

const MOCK_USER = 'orion-mock'

/** Vencimento hoje em horário fixo (HH:mm) */
function dueTodayAt(hours: number, minutes: number): string
{
  const d = new Date()
  d.setHours(hours, minutes, 0, 0)
  return d.toISOString()
}

function baseTask(partial: Omit<TarefaUnificada, 'user_id' | 'descricao' | 'notas_locais' | 'created_at' | 'versao' | 'subtarefas' | 'snippet_100_char'> & { snippet_100_char?: string; labels?: TarefaUnificada['labels'] }): TarefaUnificada
{
  return {
    user_id: MOCK_USER,
    descricao: null,
    notas_locais: null,
    created_at: null,
    versao: 1,
    subtarefas: [],
    snippet_100_char: '',
    ...partial,
    labels: partial.labels ?? [],
  }
}

/** Metadados visuais da linha de execução (contexto + avatar) */
export type ExecutionContextKind = 'database' | 'git' | 'mail' | 'docker'

export interface ExecutionRowMeta
{
  context: ExecutionContextKind
  iniciais: string
}

export const MOCK_EXECUTION_ROW_META: Record<number, ExecutionRowMeta> = {
  [-901]: { context: 'git', iniciais: 'MC' },
  [-902]: { context: 'database', iniciais: 'MC' },
  [-903]: { context: 'docker', iniciais: 'MC' },
}

export function getExecutionRowMeta(taskId: number): ExecutionRowMeta
{
  return MOCK_EXECUTION_ROW_META[taskId] ?? { context: 'database', iniciais: 'MC' }
}

/** Tarefas simuladas — foco no próprio sistema ORION */
export const MOCK_DASHBOARD_TASKS: TarefaUnificada[] = [
  baseTask({
    id: -901,
    titulo: '[ORION] Implementar Ofensiva Diária no header global',
    score_urgencia: 92,
    status: 'pendente',
    prioridade: 'alta',
    origem: 'manual',
    labels: [{ id: 1, nome: 'ORION', cor: '#6366f1' }],
    data_vencimento: dueTodayAt(17, 0),
    blockedBy: ['-903'],
    daysStagnant: 0,
    remetente: 'chefe@empresa.com',
  }),
  baseTask({
    id: -902,
    titulo: '[FRONTEND] Refinar drawer de detalhes do Kanban temporal',
    score_urgencia: 78,
    status: 'em_progresso',
    prioridade: 'alta',
    origem: 'manual',
    labels: [{ id: 2, nome: 'FRONTEND', cor: '#8b5cf6' }],
    data_vencimento: dueTodayAt(15, 30),
    blockedBy: [],
    daysStagnant: 5,
    remetente: 'cliente@projeto.com',
  }),
  baseTask({
    id: -903,
    titulo: '[CORE] Bloqueio no motor de score — impedimento crítico no painel',
    score_urgencia: 65,
    status: 'pendente',
    prioridade: 'media',
    origem: 'webhook',
    labels: [{ id: 3, nome: 'CORE', cor: '#22d3ee' }],
    data_vencimento: dueTodayAt(18, 0),
    blockedBy: ['-902'],
    daysStagnant: 0,
    remetente: 'sistema@automacao.com',
  }),
]

/** Mescla mocks com tarefas do store (mocks têm prioridade por id) */
export function mergeDashboardTasks(storeTasks: TarefaUnificada[]): TarefaUnificada[]
{
  const mockIds = new Set(MOCK_DASHBOARD_TASKS.map((t) => t.id))
  const fromStore = storeTasks.filter((t) => !mockIds.has(t.id))
  return [...MOCK_DASHBOARD_TASKS, ...fromStore]
}

export type MockFinanceStatus = 'ok' | 'alert' | 'pending'

export interface MockFinanceRow
{
  id: number
  data: string
  descricao: string
  valor: number
  status: MockFinanceStatus
}

/** Saldo diário — últimos 7 dias (sparkline do resumo financeiro) */
export const MOCK_BALANCE_SPARKLINE_7D = [
  { dia: '19/05', saldo: 3180.42 },
  { dia: '20/05', saldo: 2955.18 },
  { dia: '21/05', saldo: 4128.06 },
  { dia: '22/05', saldo: 12548.06 },
  { dia: '23/05', saldo: 12303.06 },
  { dia: '24/05', saldo: 12200.66 },
  { dia: '25/05', saldo: 12098.26 },
]

/** Transações recentes — tabela densa da sidebar */
export const MOCK_FINANCE_ROWS: MockFinanceRow[] = [
  { id: 1, data: '24/05', descricao: "Domino's Pizza", valor: -89.9, status: 'ok' },
  { id: 2, data: '24/05', descricao: 'Auto Viação 1001', valor: -12.5, status: 'ok' },
  { id: 3, data: '23/05', descricao: 'AWS Cloud', valor: -245.0, status: 'alert' },
  { id: 4, data: '22/05', descricao: 'Salário PL Brasil', valor: 8420.0, status: 'ok' },
  { id: 5, data: '21/05', descricao: 'NuBank Fatura', valor: -1847.32, status: 'pending' },
]

export const MOCK_BUDGET_503020 = {
  necessidades: 50,
  desejos: 30,
  reserva: 20,
  progresso: {
    necessidades: 48,
    desejos: 28,
    reserva: 18,
  },
}
