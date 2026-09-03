import { useEffect } from 'react'
import { View } from 'react-native'
import { Redirect } from 'expo-router'
import { Screen, Text, Card, EmptyState } from '../../src/ui'
import { StackHeader } from '../../src/components/layout/StackHeader'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useAuthStore } from '../../src/store/authStore'
import { useGamificationStore } from '../../src/store/gamificationStore'

export default function AxelHistoricoScreen()
{
  const { space } = useTheme()
  const userId = useAuthStore((s) => s.userId)
  const history = useGamificationStore((s) => s.history)
  const hydrate = useGamificationStore((s) => s.hydrate)

  useEffect(() =>
  {
    hydrate()
  }, [hydrate])

  if (!userId) return <Redirect href="/login" />

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Histórico AXEL" subtitle="Decisões, XP e setup" />
      <View style={{ gap: space.md }}>
        {history.length === 0 ? (
          <EmptyState
            title="Nada por aqui ainda"
            body="Conclua o setup, tarefas e check-ins para preencher a trilha."
          />
        ) : (
          history.map((ev) => (
            <Card key={ev.id} tone="elevated" style={{ gap: 4 }}>
              <Text variant="caption" muted>
                {ev.kind} · {new Date(ev.at).toLocaleString('pt-BR')}
              </Text>
              <Text variant="bodyStrong">{ev.title}</Text>
              {ev.detail ? (
                <Text variant="caption" muted>
                  {ev.detail}
                </Text>
              ) : null}
            </Card>
          ))
        )}
      </View>
    </Screen>
  )
}
