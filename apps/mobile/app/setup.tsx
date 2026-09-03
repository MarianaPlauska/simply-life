import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { Screen, Text, Card, PrimaryButton, Field, Chip } from '../src/ui'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { usePrefsStore } from '../src/store/prefsStore'
import { useGamificationStore } from '../src/store/gamificationStore'
import type { DashboardPriority } from '../src/lib/dashboardWidgets'

const PRIORITY: { id: DashboardPriority; label: string; hint: string }[] = [
  { id: 'tasks', label: 'Tarefas', hint: 'Comando e foco primeiro' },
  { id: 'finance', label: 'Finanças', hint: 'Boletos e meta no topo' },
  { id: 'health', label: 'Saúde', hint: 'Água e ritual no topo' },
]

/** Wizard Montar seu AXEL */
export default function SetupScreen()
{
  const { space } = useTheme()
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const prefs = usePrefsStore((s) => s.prefs)
  const loaded = usePrefsStore((s) => s.loaded)
  const hydrate = usePrefsStore((s) => s.hydrate)
  const patch = usePrefsStore((s) => s.patch)
  const logEvent = useGamificationStore((s) => s.logEvent)
  const grantXp = useGamificationStore((s) => s.grantXp)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [priority, setPriority] = useState<DashboardPriority>('tasks')
  const [saving, setSaving] = useState(false)

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  useEffect(() =>
  {
    if (prefs.axel_calls_you) setName(prefs.axel_calls_you)
    if (prefs.dashboard_priority) setPriority(prefs.dashboard_priority)
  }, [prefs.axel_calls_you, prefs.dashboard_priority])

  if (!userId) return <Redirect href="/login" />
  if (loaded && prefs.setup_completed_at)
  {
    return <Redirect href="/(tabs)" />
  }

  const finish = async () =>
  {
    setSaving(true)
    await patch({
      axel_calls_you: name.trim(),
      display_name: name.trim(),
      dashboard_priority: priority,
      setup_completed_at: new Date().toISOString(),
    })
    logEvent('setup', 'AXEL montado', name.trim() || 'setup')
    grantXp(15, 'AXEL pronto', 'Wizard concluído')
    setSaving(false)
    router.replace('/(tabs)')
  }

  return (
    <Screen scroll tabBarInset={false}>
      <View style={{ gap: space.lg, paddingTop: space.xl, maxWidth: 480, alignSelf: 'center', width: '100%' }}>
        <Text variant="caption" muted>
          Passo {step + 1} de 3
        </Text>
        <Text variant="hero">Montar seu AXEL</Text>

        {step === 0 ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="section">Como o AXEL te chama?</Text>
            <Field
              label="Nome"
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              autoCapitalize="words"
            />
            <PrimaryButton
              label="Continuar"
              disabled={!name.trim()}
              onPress={() => setStep(1)}
            />
          </Card>
        ) : null}

        {step === 1 ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="section">O que vem primeiro</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {PRIORITY.map((p) => (
                <Chip
                  key={p.id}
                  label={p.label}
                  active={priority === p.id}
                  onPress={() => setPriority(p.id)}
                />
              ))}
            </View>
            <Text variant="caption" muted>
              {PRIORITY.find((p) => p.id === priority)?.hint}
            </Text>
            <PrimaryButton label="Continuar" onPress={() => setStep(2)} />
            <PrimaryButton label="Voltar" variant="ghost" onPress={() => setStep(0)} />
          </Card>
        ) : null}

        {step === 2 ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="section">Quase lá</Text>
            <Text variant="body" muted>
              AXEL vai te chamar de {name.trim() || 'você'} e priorizar{' '}
              {PRIORITY.find((p) => p.id === priority)?.label.toLowerCase()}.
            </Text>
            <PrimaryButton
              label="Começar"
              loading={saving}
              onPress={() => void finish()}
            />
            <PrimaryButton label="Voltar" variant="ghost" onPress={() => setStep(1)} />
          </Card>
        ) : null}
      </View>
    </Screen>
  )
}
