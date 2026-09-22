import { useRouter } from 'expo-router'
import { CALM_EXERCISES } from '@simply-life/shared'
import { Card, Text, SectionHeader, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { usePrefsStore } from '../../store/prefsStore'
import { SettingsToggleRow } from '../settings/SettingsToggleRow'

/** Apoio: respirar em 4 tempos e cinco sentidos, com haptic opcional. */
export function HealthCalmSection()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const hapticsOn = usePrefsStore((s) => s.prefs.calm_haptics_enabled !== false)
  const patch = usePrefsStore((s) => s.patch)

  return (
    <Card tone="elevated" style={{ gap: space.md, borderRadius: 18 }}>
      <SectionHeader
        title="Acalmar agora"
        subtitle="Escolha um guia. Não é prova e não substitui o CVV 188."
      />
      {CALM_EXERCISES.map((ex) => (
        <PressableScale
          key={ex.id}
          onPress={() => router.push(ex.route as '/calm/box-breathing' | '/calm/grounding')}
          style={{
            minHeight: 56,
            padding: space.md,
            borderRadius: 18,
            gap: 4,
            backgroundColor: colors.axelMuted,
            borderWidth: 1,
            borderColor: colors.hairline,
          }}
        >
          <Text variant="bodyStrong">{ex.title}</Text>
          <Text variant="caption" muted>
            {ex.subtitle}
          </Text>
          <Text variant="caption" color={colors.axel}>
            Cerca de {ex.durationMin} min
          </Text>
        </PressableScale>
      ))}
      <SettingsToggleRow
        icon="phone-portrait-outline"
        title="Vibração no ritmo"
        subtitle="Pulso suave a cada troca de fase, no celular"
        value={hapticsOn}
        onValueChange={(on) => void patch({ calm_haptics_enabled: on })}
      />
    </Card>
  )
}
