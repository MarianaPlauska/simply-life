import { View, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { CALM_EXERCISES, humorDoDia, localTodayIso, moodLabel } from '@simply-life/shared'
import { Text, PressableScale, PrimaryButton } from '../../ui'
import { MoodFaceRow } from '../MoodFace'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'
import { CrisisSupportCard } from './CrisisSupportCard'
import { HealthScreenSection } from './HealthScreenSection'
import { HealthAxelStrip } from './HealthAxelStrip'

type Props = {
  onGoApoio: () => void
  onGoDiario: () => void
}

/** Aba Hoje reduzida quando o humor do dia é 1 ou 2 — layout integrado. */
export function HealthSoftModeView({ onGoApoio, onGoDiario }: Props)
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const humor = useDataStore((s) => s.humor)
  const addHumor = useDataStore((s) => s.addHumor)
  const isGuest = useAuthStore((s) => s.isGuest)
  const humorHoje = humorDoDia(humor, localTodayIso()) ?? null
  const moodHeadline = humorHoje ? moodLabel(humorHoje.humor) : 'Como você está?'

  return (
    <View style={{ gap: space.md }}>
      <HealthAxelStrip message="Hoje pesa. Está tudo bem ir devagar. Só o que couber agora." />

      <HealthScreenSection dividerTop>
        <View style={{ gap: 2 }}>
          <Text variant="caption" muted>Check-in</Text>
          <Text variant="hero" style={{ fontSize: 28, letterSpacing: -0.8 }}>
            {moodHeadline}
          </Text>
          <Text variant="caption" muted>
            Pode atualizar se o sentimento mudar
          </Text>
        </View>
        <MoodFaceRow
          value={humorHoje?.humor}
          onChange={(m) => void addHumor(m, undefined, isGuest)}
        />
        <PressableScale onPress={onGoDiario} accessibilityRole="button">
          <Text variant="caption" color={colors.axel} style={{ fontWeight: '600' }}>
            Abrir diário completo
          </Text>
        </PressableScale>
      </HealthScreenSection>

      <HealthScreenSection
        dividerTop
        title="Baixar o ritmo"
        subtitle="Um guia curto. Não precisa fazer os dois."
      >
        {CALM_EXERCISES.map((ex, index) =>
        {
          const last = index === CALM_EXERCISES.length - 1
          return (
            <PressableScale
              key={ex.id}
              onPress={() => router.push(ex.route as '/calm/box-breathing' | '/calm/grounding')}
            >
              <View
                style={{
                  gap: 4,
                  paddingVertical: 12,
                  borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
                  borderBottomColor: colors.hairline,
                }}
              >
                <Text variant="bodyStrong">{ex.title}</Text>
                <Text variant="caption" muted>
                  {ex.subtitle}
                </Text>
                <Text variant="caption" color={colors.axel}>
                  Cerca de {ex.durationMin} min
                </Text>
              </View>
            </PressableScale>
          )
        })}
      </HealthScreenSection>

      <HealthScreenSection dividerTop>
        <CrisisSupportCard compact />
        <PrimaryButton
          label="Ver apoio completo"
          variant="ghost"
          onPress={onGoApoio}
        />
      </HealthScreenSection>
    </View>
  )
}
