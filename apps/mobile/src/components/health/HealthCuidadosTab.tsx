import { View } from 'react-native'
import { SubNavTabs } from '../../ui'
import { Panel } from '../../ui/Panel'
import type { CuidadosTab } from './healthNav'
import { CUIDADOS_SUB_TABS } from './healthNav'
import { HydrationPanel } from './panels/HydrationPanel'
import { NutritionPanel } from './panels/NutritionPanel'
import { SleepPanel } from './panels/SleepPanel'
import { AcademyPanel } from './panels/AcademyPanel'
import { MedicamentosPanel } from './panels/MedicamentosPanel'
import { useTheme } from '../../theme/ThemeProvider'
import { useWorkspace } from '../../layout/useWorkspace'
import { useWebDesk } from '../dashboard/web/webBox'
import { webStyle } from '../dashboard/web/webStyle'
import { CareStatusList } from './web/CareStatusList'
import { DeskBlockHeader } from './diary/DeskBlockHeader'

type Props = {
  tab: CuidadosTab
  onChange: (tab: CuidadosTab) => void
  /** Só os cuidados que a pessoa usa */
  tabs?: typeof CUIDADOS_SUB_TABS
}

export function HealthCuidadosTab({ tab, onChange, tabs = CUIDADOS_SUB_TABS }: Props)
{
  const { space } = useTheme()
  const desk = useWebDesk()
  const { width } = useWorkspace()

  const panel = (
    <>
      {tab === 'hidratacao' && <HydrationPanel />}
      {tab === 'alimentacao' && <NutritionPanel />}
      {tab === 'sono' && <SleepPanel />}
      {tab === 'academia' && <AcademyPanel />}
      {tab === 'medicamentos' && <MedicamentosPanel />}
    </>
  )

  // computador: lista dos cuidados ao lado (troca e mostra como está cada um) e o cuidado aberto numa célula larga
  if (desk)
  {
    const wideGrid = width >= 1280
    const list = (
      <Panel key="list">
        <View style={{ gap: 12 }}>
          <DeskBlockHeader title="Cuidados de hoje" subtitle="Escolha um para registrar" />
          <CareStatusList layout="list" current={tab} onPick={onChange} />
        </View>
      </Panel>
    )
    const main = (
      <Panel key="main" style={webStyle({ gridColumn: wideGrid ? 'span 2' : undefined })}>
        {panel}
      </Panel>
    )
    return (
      <View style={webStyle({ display: 'grid', gridTemplateColumns: wideGrid ? 'repeat(3, minmax(0, 1fr))' : 'minmax(0, 1fr)', gap: 16, alignItems: 'start' })}>
        {wideGrid ? [main, list] : [list, main]}
      </View>
    )
  }

  return (
    <View style={{ gap: space.md }}>
      <SubNavTabs
        tabs={tabs}
        value={tab}
        onChange={onChange}
        accent="health"
      />
      <View style={{ gap: space.md }}>
        {panel}
      </View>
    </View>
  )
}
