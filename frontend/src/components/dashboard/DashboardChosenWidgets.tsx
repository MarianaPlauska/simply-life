import { useTaskStore } from '../../store/useTaskStore'
import { resolveDashboardWidgets } from '../../lib/dashboardWidgets'
import { DashboardQuickWidget } from './DashboardQuickWidget'

/** Widgets escolhidos no setup — a preferência existia, mas a Home não renderizava. */
export function DashboardChosenWidgets()
{
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)
  const ids = resolveDashboardWidgets(
    workspacePrefs.dashboard_quick_widgets,
    workspacePrefs.dashboard_priority,
  )

  if (ids.length === 0) return null

  return (
    <section className="space-y-3" aria-label="Atalhos do dashboard">
      <p className="sl-section-label">Seus atalhos</p>
      {ids.map((id) => (
        <DashboardQuickWidget key={id} id={id} />
      ))}
    </section>
  )
}
