import { useEffect } from 'react'
import { View } from 'react-native'
import { Redirect } from 'expo-router'
import { Screen, Text, Card, PrimaryButton } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { useFocusStore } from '../src/store/focusStore'
import { usePrefsStore } from '../src/store/prefsStore'

function mmss(total: number): string
{
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function FocoScreen()
{
  const userId = useAuthStore((s) => s.userId)
  const { space } = useTheme()
  const prefs = usePrefsStore((s) => s.prefs)
  const phase = useFocusStore((s) => s.phase)
  const remainingSec = useFocusStore((s) => s.remainingSec)
  const running = useFocusStore((s) => s.running)
  const cycles = useFocusStore((s) => s.cycles)
  const start = useFocusStore((s) => s.start)
  const pause = useFocusStore((s) => s.pause)
  const resume = useFocusStore((s) => s.resume)
  const reset = useFocusStore((s) => s.reset)
  const tick = useFocusStore((s) => s.tick)

  useEffect(() =>
  {
    if (!running) return
    const t = setInterval(() => tick(), 1000)
    return () => clearInterval(t)
  }, [running, tick])

  if (!userId) return <Redirect href="/login" />

  const phaseLabel =
    phase === 'focus' ? 'Deep work' : phase === 'short' ? 'Pausa curta' : phase === 'long' ? 'Pausa longa' : 'Pronto'

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Modo foco" subtitle="Pomodoro e deep work" />
      <View style={{ gap: space.lg }}>
        <Card tone="elevated" style={{ alignItems: 'center', gap: space.md, paddingVertical: space.xl }}>
          <Text variant="caption" muted>
            {phaseLabel} · {cycles} ciclo{cycles === 1 ? '' : 's'} hoje
          </Text>
          <Text variant="hero" style={{ fontSize: 56, letterSpacing: -1.2, fontVariant: ['tabular-nums'] }}>
            {mmss(remainingSec)}
          </Text>
          <View style={{ flexDirection: 'row', gap: space.sm, width: '100%' }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label={running ? 'Pausar' : remainingSec > 0 && phase !== 'idle' ? 'Continuar' : 'Foco'}
                onPress={() =>
                {
                  if (running) pause()
                  else if (phase !== 'idle') resume()
                  else start(prefs.pomodoro_focus, 'focus')
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Resetar" variant="secondary" onPress={() => reset()} />
            </View>
          </View>
        </Card>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label={`Pausa ${prefs.pomodoro_short}m`}
              variant="ghost"
              onPress={() => start(prefs.pomodoro_short, 'short')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label={`Longa ${prefs.pomodoro_long}m`}
              variant="ghost"
              onPress={() => start(prefs.pomodoro_long, 'long')}
            />
          </View>
        </View>
        <Text variant="caption" muted>
          Durações vêm de Preferências → Geral. O mesmo timer do PWA, agora no app.
        </Text>
        <Card tone="elevated" style={{ gap: 4 }}>
          <Text variant="caption" muted>
            Deep work
          </Text>
          <Text variant="body">
            Uma sessão ininterrupta de {prefs.pomodoro_focus} min. Silencie o resto e volte ao Início só depois do gong.
          </Text>
        </Card>
      </View>
    </Screen>
  )
}
