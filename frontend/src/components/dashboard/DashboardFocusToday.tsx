import { localIsoDate } from '../../lib/consistencyHeatmap'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_TEXT_SECONDARY, MODULE_WASH, MODULE_HERO, MODULE_METRIC } from '../../constants/axelSurfaces'

interface DashboardFocusTodayProps
{
  metricVariant?: 'hero' | 'module'
}

export function DashboardFocusToday({ metricVariant = 'hero' }: DashboardFocusTodayProps)
{
  const focusMinutesByDate = useTaskStore((s) => s.focusMinutesByDate)
  const today = localIsoDate()
  const minutes = Math.round(focusMinutesByDate[today] ?? 0)
  const metricClass = metricVariant === 'hero' ? MODULE_HERO.tasks : MODULE_METRIC.tasks

  return (
    <div>
      <div className={MODULE_WASH.tasks}>
        <p className={metricClass}>
          {minutes}
          <span className={`text-[14px] font-sans font-normal ml-1 ${AXEL_TEXT_SECONDARY}`}>
            min
          </span>
        </p>
      </div>
      <p className={`mt-1.5 text-[13px] ${AXEL_TEXT_SECONDARY}`}>
        {minutes <= 0
          ? 'Ainda sem bloco registrado'
          : `${Math.max(1, Math.ceil(minutes / 25))} bloco(s) de 25 min`}
      </p>
    </div>
  )
}
