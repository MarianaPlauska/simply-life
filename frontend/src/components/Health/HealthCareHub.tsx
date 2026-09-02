import { useState } from 'react'
import type { CuidadosTab } from '../../lib/healthRoute'
import { HealthVitalityIndicator } from './HealthVitalityIndicator'
import { HealthSuggestedCareHero } from './HealthSuggestedCareHero'
import { HealthCareChips } from './HealthCareChips'
import { HealthCuidadosCategoryPanel } from './HealthCuidadosCategoryPanel'
import { HealthHabitsMore } from './HealthHabitsMore'
import { HealthDesktopRail } from './HealthDesktopRail'
import { HealthStatsSheet } from './HealthStatsSheet'
import { AXEL_DESKTOP_WORKSPACE } from '../../constants/axelSurfaces'

interface HealthCareHubProps
{
  activeTab: CuidadosTab
  onSelectTab: (tab: CuidadosTab) => void
}

/** Hoje fundido: vitalidade + sugestão AXEL + chips + detalhe da categoria */
export function HealthCareHub({ activeTab, onSelectTab }: HealthCareHubProps)
{
  const [statsOpen, setStatsOpen] = useState(false)

  return (
    <>
      <div className={AXEL_DESKTOP_WORKSPACE}>
        <div className="space-y-4 min-w-0">
          <HealthVitalityIndicator onOpenStats={() => setStatsOpen(true)} />
          <HealthSuggestedCareHero onSelectTab={onSelectTab} />
          <HealthCareChips active={activeTab} onSelect={onSelectTab} />
          <HealthCuidadosCategoryPanel active={activeTab} />
          <HealthHabitsMore />
        </div>
        <HealthDesktopRail activeTab={activeTab} onOpenStats={() => setStatsOpen(true)} />
      </div>
      <HealthStatsSheet open={statsOpen} onClose={() => setStatsOpen(false)} />
    </>
  )
}
