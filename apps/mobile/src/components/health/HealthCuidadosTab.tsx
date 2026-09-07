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
}

export function HealthCuidadosTab({ tab, onChange }: Props)
{
  const { space } = useTheme()

  return (
    <View style={{ gap: space.md }}>
      <SubNavTabs
        tabs={CUIDADOS_SUB_TABS}
        value={tab}
        onChange={onChange}
        accent="health"
      />
      {tab === 'hidratacao' && <HydrationPanel />}
      {tab === 'alimentacao' && <NutritionPanel />}
      {tab === 'sono' && <SleepPanel />}
      {tab === 'academia' && <AcademyPanel />}
      {tab === 'medicamentos' && <MedicamentosPanel />}
    </View>
  )
}
