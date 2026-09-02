import { useEffect } from 'react'
import { View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { Screen, Text, Card, PrimaryButton, EmptyState, ListRow } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { useInboxStore } from '../src/store/inboxStore'
import { usePrefsStore } from '../src/store/prefsStore'
import { useDataStore } from '../src/store/dataStore'

export default function InteligenciaScreen()
{
  const userId = useAuthStore((s) => s.userId)
  const { space } = useTheme()
  const router = useRouter()
  const events = useInboxStore((s) => s.events)
  const loading = useInboxStore((s) => s.loading)
  const refresh = useInboxStore((s) => s.refresh)
  const dismiss = useInboxStore((s) => s.dismiss)
  const radar = usePrefsStore((s) => s.radar)
  const hydratePrefs = usePrefsStore((s) => s.hydrate)
  const addTask = useDataStore((s) => s.addTask)
  const isGuest = useAuthStore((s) => s.isGuest)

  useEffect(() =>
  {
    void refresh()
    void hydratePrefs()
  }, [refresh, hydratePrefs])

  if (!userId) return <Redirect href="/login" />

  return (
    <Screen scroll tabBarInset={false} refreshing={loading} onRefresh={() => void refresh()}>
      <StackHeader title="Inteligência" subtitle="Inbox IA e radar de palavras" />
      <View style={{ gap: space.lg }}>
        <Card tone="elevated" style={{ gap: space.sm }}>
          <Text variant="section">Radar</Text>
          {radar.length === 0 ? (
            <Text variant="caption" muted>
              Nenhuma palavra no radar. Adicione em Preferências → IA.
            </Text>
          ) : (
            <Text variant="body">
              {radar.map((r) => r.termo).join(' · ')}
            </Text>
          )}
          <PrimaryButton
            label="Abrir Preferências IA"
            variant="link"
            size="sm"
            onPress={() => router.push('/preferencias')}
          />
        </Card>

        <View style={{ gap: space.sm }}>
          <Text variant="section">Inbox</Text>
          {events.length === 0 ? (
            <Card tone="elevated">
              <EmptyState
                title="Inbox limpa"
                body="Eventos de e-mail e mensagens triados pela IA aparecem aqui."
              />
            </Card>
          ) : (
            <Card tone="elevated" style={{ paddingVertical: space.sm }}>
              {events.map((e, i) => (
                <ListRow
                  key={e.id}
                  title={e.resumo || e.raw_subject || 'Sem assunto'}
                  subtitle={`${e.source}${e.sender ? ` · ${e.sender}` : ''}`}
                  right={String(e.score_urgencia)}
                  showSeparator={i < events.length - 1}
                  onPress={() =>
                  {
                    const titulo = e.resumo || e.raw_subject || 'Tarefa do inbox'
                    void addTask(titulo, isGuest)
                    void dismiss(e.id)
                  }}
                />
              ))}
            </Card>
          )}
          <Text variant="caption" muted>
            Toque num item para virar tarefa e sair da inbox.
          </Text>
        </View>
      </View>
    </Screen>
  )
}
