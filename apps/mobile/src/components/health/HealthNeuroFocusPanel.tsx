import { View } from 'react-native'
import { Card, Text, Chip } from '../../ui'
import { SettingsToggleRow } from '../settings/SettingsToggleRow'
import { useTheme } from '../../theme/ThemeProvider'
import { usePrefsStore } from '../../store/prefsStore'
import { GAMIFICATION_MODE_OPTIONS, type GamificationMode } from '@simply-life/shared'

/** Apoio foco / TDAH — preferências sincronizadas na conta. */
export function HealthNeuroFocusPanel()
{
  const { space } = useTheme()
  const prefs = usePrefsStore((s) => s.prefs)
  const patch = usePrefsStore((s) => s.patch)

  return (
    <Card tone="elevated" style={{ gap: space.sm, borderRadius: 18 }}>
      <Text variant="section">Foco e neurodivergência</Text>
      <Text variant="caption" muted>
        Não é diagnóstico. Ajusta quebra de tarefas, linha do dia na Home e gamificação
        opcional. Também aparece no onboarding inicial.
      </Text>
      <SettingsToggleRow
        icon="flash-outline"
        title="Apoio para foco / TDAH"
        subtitle="Sugestão de passos ao capturar e timeline mais visível no Início"
        value={Boolean(prefs.adhd_support)}
        onValueChange={(on) =>
        {
          void patch({
            adhd_support: on,
            gamification_mode: on ? prefs.gamification_mode ?? 'calm' : 'calm',
          })
        }}
      />
      {prefs.adhd_support ? (
        <View style={{ gap: space.xs, paddingHorizontal: 4 }}>
          <Text variant="caption" muted>
            Modo de motivação na Home
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {GAMIFICATION_MODE_OPTIONS.map((opt) =>
            {
              const active = (prefs.gamification_mode || 'calm') === opt.id
              return (
                <Chip
                  key={opt.id}
                  label={opt.label}
                  active={active}
                  onPress={() =>
                    void patch({ gamification_mode: opt.id as GamificationMode })
                  }
                />
              )
            })}
          </View>
          <Text variant="caption" muted>
            {GAMIFICATION_MODE_OPTIONS.find((o) => o.id === (prefs.gamification_mode || 'calm'))?.hint}
          </Text>
        </View>
      ) : null}
    </Card>
  )
}
