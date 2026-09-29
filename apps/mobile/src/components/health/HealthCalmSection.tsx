import { useRouter } from 'expo-router'
import { Card, SectionHeader } from '../../ui'
import { CalmExerciseList } from '../calm/CalmExerciseList'
import { useTheme } from '../../theme/ThemeProvider'
import { usePrefsStore } from '../../store/prefsStore'
import { SettingsToggleRow } from '../settings/SettingsToggleRow'

/** Apoio: respirar em 4 tempos e cinco sentidos, com haptic opcional. */
export function HealthCalmSection()
{
  const { space } = useTheme()
  const router = useRouter()
  const hapticsOn = usePrefsStore((s) => s.prefs.calm_haptics_enabled !== false)
  const patch = usePrefsStore((s) => s.patch)

  return (
    <Card tone="elevated" style={{ gap: space.md }}>
      <SectionHeader
        title="Acalmar agora"
        subtitle="Escolha um guia. Não é prova, é só um apoio curto."
      />
      <CalmExerciseList onPick={(route) => router.push(route as '/calm/box-breathing' | '/calm/grounding')} />
      <SettingsToggleRow
        icon="phone-portrait-outline"
        title="Vibração no ritmo"
        subtitle="Pulso suave a cada troca de fase, no celular."
        value={hapticsOn}
        onValueChange={(on) => void patch({ calm_haptics_enabled: on })}
      />
    </Card>
  )
}
