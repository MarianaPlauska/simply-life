import { View } from 'react-native'
import { SubNavTabs } from '../../ui'
import type { CuidadosTab } from './healthNav'
import { CUIDADOS_SUB_TABS } from './healthNav'
import { HydrationPanel } from './panels/HydrationPanel'
import { NutritionPanel } from './panels/NutritionPanel'
import { SleepPanel } from './panels/SleepPanel'
import { AcademyPanel } from './panels/AcademyPanel'
import { MedicamentosPanel } from './panels/MedicamentosPanel'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  tab: CuidadosTab
  onChange: (tab: CuidadosTab) => void
  /** Só os cuidados que a pessoa usa */
  tabs?: typeof CUIDADOS_SUB_TABS
}

export function HealthCuidadosTab({ tab, onChange, tabs = CUIDADOS_SUB_TABS }: Props)
{
  const { space } = useTheme()

  return (
    <View style={{ gap: space.md }}>
      <SubNavTabs
        tabs={tabs}
        value={tab}
        onChange={onChange}
        accent="health"
      />
      <View style={{ gap: space.md }}>
      {tab === 'hidratacao' && <HydrationPanel />}
      {tab === 'alimentacao' && <NutritionPanel />}
      {tab === 'sono' && <SleepPanel />}
      {tab === 'academia' && <AcademyPanel />}
      {tab === 'medicamentos' && <MedicamentosPanel />}
      </View>
    </View>
  )
}
