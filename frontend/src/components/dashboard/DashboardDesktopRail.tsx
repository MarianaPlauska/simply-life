import { Link } from 'react-router-dom'
import { useHealthRitualSnapshot } from '../../hooks/useHealthRitualSnapshot'
import {
  AXEL_LINK,
  AXEL_TEXT_SECONDARY,
  MODULE_HERO,
  MODULE_WASH,
} from '../../constants/axelSurfaces'
import { ModuleSection } from '../ui/ModuleSection'
import { DashboardFocusToday } from './DashboardFocusToday'
import { DashboardFinanceGlance } from './DashboardFinanceGlance'
import { DashboardMoodWeek } from './DashboardMoodWeek'
import { DashboardTaskDueSection } from './DashboardTaskDueBars'

/** Rail do Dashboard em xl — finanças, cuidado, prazos e humor da semana */
export function DashboardDesktopRail()
{
  const ritual = useHealthRitualSnapshot()
  const nextCare = ritual.items.find((item) => item.applies && !item.done)
  const railLink = `inline-flex items-center min-h-[44px] mt-1 text-[13px] font-medium ${AXEL_LINK}`

  return (
    <aside className="hidden xl:flex flex-col min-w-0 self-start sl-stack-gap" aria-label="Resumo ao lado">
      <DashboardFinanceGlance showLink compactRail />

      <ModuleSection tone="tasks" label="Foco hoje">
        <DashboardFocusToday />
      </ModuleSection>

      <ModuleSection tone="health" label="Próximo cuidado">
        {nextCare ? (
          <>
            <p className="sl-body font-medium text-ink">
              {nextCare.label}
            </p>
            <p className="sl-body-muted mt-1">
              {nextCare.detail}
            </p>
            <Link to={nextCare.path} className={railLink}>
              Ir ao cuidado
            </Link>
          </>
        ) : (
          <>
            <div className={MODULE_WASH.health}>
              <p className={MODULE_HERO.health}>
                {ritual.doneCount}/{ritual.totalApplicable}
              </p>
            </div>
            <p className={`sl-body-muted mt-2 ${AXEL_TEXT_SECONDARY}`}>
              Ritual em dia
            </p>
            <Link to="/saude" className={railLink}>
              Abrir Saúde
            </Link>
          </>
        )}
      </ModuleSection>

      <DashboardTaskDueSection />

      <DashboardMoodWeek />
    </aside>
  )
}
