import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { GroupedList, GroupedRow, RowGlyph } from '../../ui'
import { Icon } from '../../ui/Icon'
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
import { CareStatusList, useCareStatus } from './web/CareStatusList'
import { DeskBlockHeader } from './diary/DeskBlockHeader'

type Props = {
  tab: CuidadosTab
  onChange: (tab: CuidadosTab) => void
  /** Só os cuidados que a pessoa usa */
  tabs?: typeof CUIDADOS_SUB_TABS
}

export function HealthCuidadosTab({ tab, onChange, tabs = CUIDADOS_SUB_TABS }: Props)
{
  const { colors } = useTheme()
  const router = useRouter()
  const care = useCareStatus()
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

  // celular: lista dos cuidados; cada um abre a sua tela (sem abas dentro de abas)
  return (
    <GroupedList>
      {care.map((c) => (
        <GroupedRow
          key={c.id}
          leading={<RowGlyph name={c.icon.replace('-outline', '') as never} color={colors.health} />}
          title={c.label}
          value={c.value}
          trailing={c.done ? <Icon name="checkmark-circle" size={18} color={colors.health} /> : undefined}
          onPress={() => router.push(`/cuidado/${c.id}` as never)}
          chevron
        />
      ))}
    </GroupedList>
  )
}
