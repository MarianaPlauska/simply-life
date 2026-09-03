import type { DashboardPriority } from './userWorkspacePrefs'

export type DashboardWidgetId =
  | 'wellbeing'
  | 'water'
  | 'medicamentos'
  | 'critical_tasks'
  | 'finance_brief'
  | 'quick_spend'

export const MAX_DASHBOARD_WIDGETS = 3

export const DASHBOARD_WIDGET_CATALOG: {
  id: DashboardWidgetId
  label: string
  hint: string
}[] = [
  { id: 'wellbeing', label: 'Humor', hint: 'Check-in rápido + nota' },
  { id: 'water', label: 'Água', hint: 'Copos e ml do dia' },
  { id: 'medicamentos', label: 'Medicamentos', hint: 'Cadastro em lote' },
  { id: 'critical_tasks', label: 'Tarefas', hint: 'Críticas de hoje' },
  { id: 'finance_brief', label: 'Finanças', hint: 'Resumo + novo lançamento' },
]

/** quick_spend legado - fundido em finance_brief */
function normalizeWidgetIds(widgets: DashboardWidgetId[]): DashboardWidgetId[]
{
  const out: DashboardWidgetId[] = []
  for (const id of widgets)
  {
    if (id === 'quick_spend')
    {
      if (!out.includes('finance_brief'))
      {
        out.push('finance_brief')
      }
      continue
    }
    if (!out.includes(id))
    {
      out.push(id)
    }
  }
  return out
}

export function defaultWidgetsForPriority(priority: DashboardPriority): DashboardWidgetId[]
{
  if (priority === 'health')
  {
    return ['wellbeing', 'water', 'medicamentos']
  }
  if (priority === 'finance')
  {
    return ['finance_brief', 'wellbeing', 'water']
  }
  return ['critical_tasks', 'wellbeing', 'water']
}

/** Finanças: bloco unificado é obrigatório nos atalhos */
function ensureFinanceQuickWidgets(widgets: DashboardWidgetId[]): DashboardWidgetId[]
{
  const normalized = normalizeWidgetIds(widgets)
  if (normalized.includes('finance_brief'))
  {
    return normalized.slice(0, MAX_DASHBOARD_WIDGETS)
  }

  const result = [...normalized]
  if (result.length >= MAX_DASHBOARD_WIDGETS)
  {
    const drop = result.findIndex((w) => w !== 'finance_brief')
    if (drop >= 0)
    {
      result.splice(drop, 1)
    }
    else
    {
      result.shift()
    }
  }
  result.push('finance_brief')
  return result.slice(0, MAX_DASHBOARD_WIDGETS)
}

export function resolveDashboardWidgets(
  quick: DashboardWidgetId[] | undefined,
  priority: DashboardPriority,
): DashboardWidgetId[]
{
  const raw = quick && quick.length > 0
    ? normalizeWidgetIds(quick.slice(0, MAX_DASHBOARD_WIDGETS))
    : defaultWidgetsForPriority(priority)

  if (priority === 'finance')
  {
    return ensureFinanceQuickWidgets(raw)
  }
  return raw
}

export function toggleWidgetSelection(
  current: DashboardWidgetId[],
  id: DashboardWidgetId,
): DashboardWidgetId[]
{
  const target = id === 'quick_spend' ? 'finance_brief' : id
  if (current.includes(target) || (id === 'quick_spend' && current.includes('finance_brief')))
  {
    return current.filter((w) => w !== target && w !== 'quick_spend')
  }
  if (current.length >= MAX_DASHBOARD_WIDGETS)
  {
    return current
  }
  return [...current, target]
}
