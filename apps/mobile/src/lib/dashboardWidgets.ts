export type DashboardWidgetId =
  | 'wellbeing'
  | 'water'
  | 'medicamentos'
  | 'critical_tasks'
  | 'finance_brief'
  | 'quick_spend'

export type DashboardPriority = 'finance' | 'tasks' | 'health'

export const MAX_DASHBOARD_WIDGETS = 3

export const DASHBOARD_WIDGET_CATALOG: {
  id: Exclude<DashboardWidgetId, 'quick_spend'>
  label: string
  hint: string
}[] = [
  { id: 'wellbeing', label: 'Humor', hint: 'Check-in rápido' },
  { id: 'water', label: 'Água', hint: 'Copos do dia' },
  { id: 'medicamentos', label: 'Medicamentos', hint: 'Doses de hoje' },
  { id: 'critical_tasks', label: 'Tarefas', hint: 'Críticas de hoje' },
  { id: 'finance_brief', label: 'Finanças', hint: 'Resumo do mês' },
]

function normalizeWidgetIds(widgets: DashboardWidgetId[]): DashboardWidgetId[]
{
  const out: DashboardWidgetId[] = []
  for (const id of widgets)
  {
    const mapped: DashboardWidgetId = id === 'quick_spend' ? 'finance_brief' : id
    if (!out.includes(mapped))
    {
      out.push(mapped)
    }
  }
  return out
}

export function defaultWidgetsForPriority(priority: DashboardPriority): DashboardWidgetId[]
{
  if (priority === 'health') return ['wellbeing', 'water', 'medicamentos']
  if (priority === 'finance') return ['finance_brief', 'wellbeing', 'water']
  return ['critical_tasks', 'wellbeing', 'water']
}

export function resolveDashboardWidgets(
  quick: DashboardWidgetId[] | undefined,
  priority: DashboardPriority,
): DashboardWidgetId[]
{
  const raw = quick && quick.length > 0
    ? normalizeWidgetIds(quick.slice(0, MAX_DASHBOARD_WIDGETS))
    : defaultWidgetsForPriority(priority)
  return raw.slice(0, MAX_DASHBOARD_WIDGETS)
}

export function toggleWidgetSelection(
  current: DashboardWidgetId[],
  id: DashboardWidgetId,
): DashboardWidgetId[]
{
  const target = id === 'quick_spend' ? 'finance_brief' : id
  if (current.includes(target))
  {
    return current.filter((w) => w !== target)
  }
  if (current.length >= MAX_DASHBOARD_WIDGETS) return current
  return [...current, target]
}
