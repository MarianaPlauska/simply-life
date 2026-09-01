import { View } from 'react-native'
import { Tabs, Redirect } from 'expo-router'
import { TabBarWithFab } from '../../src/components/TabBarWithFab'
import { CaptureSheet } from '../../src/components/CaptureSheet'
import { DesktopSidebar } from '../../src/components/layout/DesktopSidebar'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useWorkspace } from '../../src/layout/useWorkspace'
import { useDataSync } from '../../src/hooks/useDataSync'
import { useAuthStore } from '../../src/store/authStore'

export default function TabsLayout()
{
  const { colors } = useTheme()
  const { showRail } = useWorkspace()
  const userId = useAuthStore((s) => s.userId)
  useDataSync()

  if (!userId)
  {
    return <Redirect href="/login" />
  }

  return (
    <View style={{ flex: 1, flexDirection: showRail ? 'row' : 'column', backgroundColor: colors.canvas }}>
      {showRail ? <DesktopSidebar /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Tabs
          tabBar={(props) => (showRail ? null : <TabBarWithFab {...props} />)}
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: colors.canvas },
          }}
        >
          <Tabs.Screen name="index" options={{ title: 'Início' }} />
          <Tabs.Screen name="kanban" options={{ title: 'Tarefas' }} />
          <Tabs.Screen name="saude" options={{ title: 'Saúde' }} />
          <Tabs.Screen name="financeiro" options={{ title: 'Finanças' }} />
        </Tabs>
      </View>
      <CaptureSheet />
    </View>
  )
}
