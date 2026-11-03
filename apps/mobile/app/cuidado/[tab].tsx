import { View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Screen } from '../../src/ui'
import { StackHeader } from '../../src/components/layout/StackHeader'
import { useTheme } from '../../src/theme/ThemeProvider'
import { CUIDADOS_SUB_TABS, type CuidadosTab } from '../../src/components/health/healthNav'
import { HydrationPanel } from '../../src/components/health/panels/HydrationPanel'
import { NutritionPanel } from '../../src/components/health/panels/NutritionPanel'
import { SleepPanel } from '../../src/components/health/panels/SleepPanel'
import { AcademyPanel } from '../../src/components/health/panels/AcademyPanel'
import { MedicamentosPanel } from '../../src/components/health/panels/MedicamentosPanel'

/** Um cuidado aberto em tela própria (o celular não tem abas dentro de Cuidados). */
export default function CuidadoScreen()
{
  const { tab: raw } = useLocalSearchParams<{ tab: string }>()
  const { space } = useTheme()
  const tab = (CUIDADOS_SUB_TABS.find((t) => t.id === raw)?.id ?? 'hidratacao') as CuidadosTab
  const title = CUIDADOS_SUB_TABS.find((t) => t.id === tab)?.label ?? 'Cuidado'

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title={title} />
      <View style={{ gap: space.md }}>
        {tab === 'hidratacao' && <HydrationPanel />}
        {tab === 'alimentacao' && <NutritionPanel />}
        {tab === 'sono' && <SleepPanel />}
        {tab === 'academia' && <AcademyPanel />}
        {tab === 'medicamentos' && <MedicamentosPanel />}
      </View>
    </Screen>
  )
}
