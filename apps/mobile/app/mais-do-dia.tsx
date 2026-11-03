import { useMemo } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { partitionTodayTimeline } from '@simply-life/shared'
import { Screen, Text, PrimaryButton } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { HomeLifeGoals } from '../src/components/dashboard/HomeLifeGoals'
import { AxelDayBrief } from '../src/components/dashboard/HomeDriveAside'
import { LifePatternCard } from '../src/components/dashboard/LifePatternCard'
import { useLifePatterns } from '../src/hooks/useLifePatterns'
import { DayPlanHomeCard } from '../src/components/rhythm/DayPlanHomeCard'
import { VisualDayCard } from '../src/components/rhythm/VisualDayCard'
import { HomeDayTimeline } from '../src/components/dashboard/HomeDayTimeline'
import { EloHeatmap } from '../src/components/streak/EloHeatmap'
import { PersonalSummaryGrid } from '../src/components/dashboard/PersonalSummaryGrid'
import { LifeSummaryReport } from '../src/components/metrics/LifeSummaryReport'
import { HomeAgendaStudio } from '../src/components/dashboard/HomeAgendaStudio'
import { HomeActivityHeatmap } from '../src/components/dashboard/HomeActivityHeatmap'
import { HomeHealthStudio } from '../src/components/dashboard/HomeHealthStudio'
import { HomeMentalStudio } from '../src/components/dashboard/HomeMentalStudio'
import { HomeMedsStudio } from '../src/components/dashboard/HomeMedsStudio'
import { DashboardQuickWidgets } from '../src/components/dashboard/DashboardQuickWidgets'
import { HomePanorama } from '../src/components/dashboard/HomePanorama'
import { HomeCollapsible } from '../src/components/dashboard/HomeCollapsible'
import { useDataStore } from '../src/store/dataStore'
import { useTheme } from '../src/theme/ThemeProvider'

/**
 * O que saiu da frente do Início. Continua no app, numa tela só,
 * para a Home mostrar o agora e não o mapa inteiro.
 */
export default function MaisDoDiaScreen()
{
  const { space } = useTheme()
  const router = useRouter()
  const tasks = useDataStore((s) => s.tasks)
  const patterns = useLifePatterns().patterns
  const today = useMemo(() => partitionTodayTimeline(tasks), [tasks])

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader
        title="Mais do dia"
        subtitle="Plano, mapas e resumos. Nada disso precisa estar na primeira tela."
      />
      <View style={{ gap: space.lg }}>
        <View style={{ gap: space.md }}>
          <Text variant="caption" muted>O plano e o AXEL</Text>
          <HomeLifeGoals />
          <AxelDayBrief />
          <LifePatternCard patterns={patterns} />
          <DayPlanHomeCard />
          <VisualDayCard />
          <HomeDayTimeline tasks={today} />
          <EloHeatmap semanas={12} compact />
        </View>

        <View style={{ gap: space.md }}>
          <Text variant="caption" muted>Resumos</Text>
          <PersonalSummaryGrid />
          <LifeSummaryReport variant="compact" />
          <HomeAgendaStudio tasks={tasks} />
          <HomeActivityHeatmap tasks={tasks} />
          <HomeHealthStudio />
          <HomeMentalStudio />
          <HomeMedsStudio />
          <HomeCollapsible title="Atalhos extras" subtitle="Humor, água e tarefas críticas" defaultOpen={false}>
            <DashboardQuickWidgets />
          </HomeCollapsible>
          <HomeCollapsible title="Panorama" subtitle="Gráficos do mês" defaultOpen={false}>
            <HomePanorama />
          </HomeCollapsible>
          <PrimaryButton label="Abrir Saúde" variant="secondary" onPress={() => router.push('/(tabs)/saude')} />
        </View>
      </View>
    </Screen>
  )
}
