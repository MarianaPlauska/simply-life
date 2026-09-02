import { View } from 'react-native'
import { Tabs, Redirect } from 'expo-router'
import { TabBarWithFab } from '../../src/components/TabBarWithFab'
import { CaptureSheet } from '../../src/components/CaptureSheet'
import { DesktopSidebar } from '../../src/components/layout/DesktopSidebar'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useWorkspace } from '../../src/layout/useWorkspace'
import { useDataSync } from '../../src/hooks/useDataSync'
import { useAuthStore } from '../../src/store/authStore'
import { usePrefsStore } from '../../src/store/prefsStore'
import { useEffect } from 'react'

export default function TabsLayout()
{
  const { colors, mode, setMode } = useTheme()
  const { showRail } = useWorkspace()
  const userId = useAuthStore((s) => s.userId)
  const scheme = usePrefsStore((s) => s.prefs.color_scheme)
  const prefsLoaded = usePrefsStore((s) => s.loaded)
  useDataSync()

  useEffect(() =>
  {
    if (prefsLoaded && scheme && scheme !== mode)
    {
      setMode(scheme)
    }
  }, [prefsLoaded, scheme, mode, setMode])

  if (!userId)
  {
    return <Redirect href="/login" />
  }

  return (
    <View
      style={{
        flex: 1,
        flexDirection: showRail ? 'row' : 'column',
        backgroundColor: colors.canvas,
        alignItems: showRail ? 'stretch' : undefined,
      }}
    >
      {showRail ? <DesktopSidebar /> : null}
      <View style={{ flex: 1, minWidth: 0, height: '100%' }}>
        <Tabs
          tabBar={(props) => (showRail ? null : <TabBarWithFab {...props} />)}
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: colors.canvas, flex: 1 },
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
