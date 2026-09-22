import { useRouter } from 'expo-router'
import { Card, Text, SectionHeader, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { usePrefsStore } from '../../store/prefsStore'

/** Apoio: sessão de foco sem vídeo, usando o timer já existente. */
export function HealthFocusSection()
{
  const { space } = useTheme()
  const router = useRouter()
  const minutes = usePrefsStore((s) => s.prefs.pomodoro_focus) || 25

  return (
    <Card tone="elevated" style={{ gap: space.md, borderRadius: 18 }}>
      <SectionHeader
        title="Sessão de foco"
        subtitle={`${minutes} min. Uma tarefa por vez. Sem vídeo, só timer.`}
      />
      <Text variant="body" muted>
        Serve para iniciar quando a cabeça não encaixa sozinha. Pode ligar a uma tarefa do Kanban.
      </Text>
      <PrimaryButton
        label={`Começar ${minutes} min`}
        icon="timer-outline"
        onPress={() => router.push('/foco')}
      />
    </Card>
  )
}
