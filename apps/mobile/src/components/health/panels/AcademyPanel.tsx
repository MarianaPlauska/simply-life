import { Card, Text, SectionHeader, PrimaryButton } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useDataStore } from '../../../store/dataStore'
import { useAuthStore } from '../../../store/authStore'
import { findHabit } from '@simply-life/shared'

export function AcademyPanel()
{
  const { space } = useTheme()
  const habits = useDataStore((s) => s.habits)
  const toggleTreinoDone = useDataStore((s) => s.toggleTreinoDone)
  const isGuest = useAuthStore((s) => s.isGuest)
  const treino = findHabit(habits, 'treino')
  const pillBtn = { borderRadius: 999 as const }

  return (
    <Card tone="elevated" style={{ gap: space.md }}>
      <SectionHeader title="Academia" subtitle="Sessão do dia" />
      <Text variant="body" muted>
        {treino?.progressoAtual
          ? 'Sessão marcada como feita hoje.'
          : 'Ainda não registrou treino hoje.'}
      </Text>
      <PrimaryButton
        label={treino?.progressoAtual ? 'Desmarcar sessão' : 'Marcar treino feito'}
        onPress={() => void toggleTreinoDone(isGuest)}
        style={pillBtn}
      />
      <Text variant="caption" muted>
        Modo guiado com séries e descanso chega na próxima iteração mobile.
      </Text>
    </Card>
  )
}
