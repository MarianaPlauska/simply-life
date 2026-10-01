import type { IconName } from '../ui/Icon'
import type { HomeMetricId } from './homeMetrics'
import type { DashboardPriority, DashboardWidgetId } from './dashboardWidgets'

/**
 * O que a pessoa escolheu usar no app. Quem não escolheu nada (contas antigas)
 * vê tudo: `enabled_modules` ausente = todos ligados.
 */
export type AppModuleId =
  | 'tasks'
  | 'routine'
  | 'mood'
  | 'water'
  | 'sleep'
  | 'food'
  | 'gym'
  | 'meds'
  | 'support'
  | 'spend'
  | 'cards'
  | 'bills'
  | 'goals'

export type AppModuleGroup = 'tarefas' | 'saude' | 'carteira'

export type AppModuleDef = {
  id: AppModuleId
  group: AppModuleGroup
  label: string
  hint: string
  icon: IconName
}

export const APP_MODULE_GROUPS: { id: AppModuleGroup; label: string; hint: string }[] = [
  { id: 'tarefas', label: 'Tarefas', hint: 'O que fazer e a sua rotina' },
  { id: 'saude', label: 'Saúde', hint: 'Corpo, mente e cuidados do dia' },
  { id: 'carteira', label: 'Carteira', hint: 'Dinheiro que entra, sai e fica' },
]

export const APP_MODULES: AppModuleDef[] = [
  { id: 'tasks', group: 'tarefas', label: 'Tarefas', hint: 'Lista do dia, prazos, pastas e relatórios.', icon: 'checkbox-outline' },
  { id: 'routine', group: 'tarefas', label: 'Rotina e hábitos', hint: 'Check diário e sequência da semana.', icon: 'repeat' },
  { id: 'mood', group: 'saude', label: 'Diário de humor', hint: 'Como você está e o que escreveu.', icon: 'happy-outline' },
  { id: 'water', group: 'saude', label: 'Água', hint: 'Copos do dia e meta.', icon: 'water-outline' },
  { id: 'sleep', group: 'saude', label: 'Sono', hint: 'Horas da noite e semana.', icon: 'moon-outline' },
  { id: 'food', group: 'saude', label: 'Alimentação', hint: 'Proteína e o que comeu.', icon: 'restaurant-outline' },
  { id: 'gym', group: 'saude', label: 'Academia', hint: 'Treino da semana, séries e cargas.', icon: 'barbell-outline' },
  { id: 'meds', group: 'saude', label: 'Medicamentos', hint: 'Doses e horários.', icon: 'medical-outline' },
  { id: 'support', group: 'saude', label: 'Apoio emocional', hint: 'Acalmar, foco e exercícios de TCC.', icon: 'heart-outline' },
  { id: 'spend', group: 'carteira', label: 'Gastos', hint: 'Saldo, extrato e análise do mês.', icon: 'wallet-outline' },
  { id: 'cards', group: 'carteira', label: 'Cartões', hint: 'Fatura, limite e vencimento.', icon: 'card-outline' },
  { id: 'bills', group: 'carteira', label: 'Contas fixas', hint: 'Aluguel, internet e assinaturas.', icon: 'calendar-outline' },
  { id: 'goals', group: 'carteira', label: 'Metas', hint: 'Guardar para algo.', icon: 'flag-outline' },
]

export const ALL_APP_MODULES: AppModuleId[] = APP_MODULES.map((m) => m.id)

const VALID = new Set<string>(ALL_APP_MODULES)

/** Lista válida, sem repetidos. `undefined` continua `undefined` (tudo ligado). */
export function normalizeModules(raw: unknown): AppModuleId[] | undefined
{
  if (!Array.isArray(raw)) return undefined
  const out: AppModuleId[] = []
  for (const v of raw)
  {
    if (typeof v === 'string' && VALID.has(v) && !out.includes(v as AppModuleId)) out.push(v as AppModuleId)
  }
  return out
}

export function modulesOn(enabled: AppModuleId[] | undefined): Set<AppModuleId>
{
  return new Set(enabled ?? ALL_APP_MODULES)
}

export function isModuleOn(enabled: AppModuleId[] | undefined, id: AppModuleId): boolean
{
  return enabled == null || enabled.includes(id)
}

export function isGroupOn(enabled: AppModuleId[] | undefined, group: AppModuleGroup): boolean
{
  return APP_MODULES.some((m) => m.group === group && isModuleOn(enabled, m.id))
}

export function modulesOfGroup(group: AppModuleGroup): AppModuleDef[]
{
  return APP_MODULES.filter((m) => m.group === group)
}

export function moduleLabel(id: AppModuleId): string
{
  return APP_MODULES.find((m) => m.id === id)?.label ?? id
}

/** Rota da aba principal de cada grupo. */
export const GROUP_ROUTE: Record<AppModuleGroup, 'kanban' | 'saude' | 'financeiro'> = {
  tarefas: 'kanban',
  saude: 'saude',
  carteira: 'financeiro',
}


/** Cada atalho da Home depende de um módulo; desligado, o atalho some. */
const METRIC_MODULE: Record<HomeMetricId, AppModuleId> = {
  humor: 'mood',
  sleep: 'sleep',
  water: 'water',
  protein: 'food',
  tasks: 'tasks',
  finance: 'spend',
  goals: 'tasks',
  stats: 'tasks',
}

const WIDGET_MODULE: Record<DashboardWidgetId, AppModuleId> = {
  wellbeing: 'mood',
  water: 'water',
  medicamentos: 'meds',
  critical_tasks: 'tasks',
  finance_brief: 'spend',
  quick_spend: 'spend',
}

const PRIORITY_GROUP: Record<DashboardPriority, AppModuleGroup> = {
  tasks: 'tarefas',
  health: 'saude',
  finance: 'carteira',
}

export function metricAllowed(enabled: AppModuleId[] | undefined, id: HomeMetricId): boolean
{
  return isModuleOn(enabled, METRIC_MODULE[id])
}

export function filterMetrics(enabled: AppModuleId[] | undefined, ids: HomeMetricId[]): HomeMetricId[]
{
  return ids.filter((id) => metricAllowed(enabled, id))
}

export function filterWidgets(enabled: AppModuleId[] | undefined, ids: DashboardWidgetId[]): DashboardWidgetId[]
{
  return ids.filter((id) => isModuleOn(enabled, WIDGET_MODULE[id]))
}

export function filterPriorities(enabled: AppModuleId[] | undefined, ids: DashboardPriority[]): DashboardPriority[]
{
  return ids.filter((id) => isGroupOn(enabled, PRIORITY_GROUP[id]))
}
