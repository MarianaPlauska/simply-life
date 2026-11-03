import { useRouter } from 'expo-router'
import { GroupedList, GroupedRow, RowGlyph } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { usePrefsStore } from '../../store/prefsStore'

/** Apoio: sessão de foco sem vídeo, usando o timer já existente. */
export function HealthFocusSection()
{
  const { colors } = useTheme()
  const router = useRouter()
  const minutes = usePrefsStore((s) => s.prefs.pomodoro_focus) || 25

  return (
    <GroupedList>
      <GroupedRow
        leading={<RowGlyph name="timer" color={colors.tasks} />}
        title={`Sessão de foco · ${minutes} min`}
        subtitle="Uma tarefa por vez, só timer. Pode ligar a uma tarefa do Kanban."
        subtitleLines={2}
        onPress={() => router.push('/foco')}
      />
    </GroupedList>
  )
}
