import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { CALM_EXERCISES, humorDoDia, localTodayIso } from '@simply-life/shared'
import { Card, Text, SectionHeader, PressableScale, IconBadge, PrimaryButton } from '../../ui'
import { MoodFaceRow } from '../MoodFace'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'
import { CrisisSupportCard } from './CrisisSupportCard'

type Props = {
  onGoApoio: () => void
  onGoDiario: () => void
}

/** Aba Hoje reduzida quando o humor do dia é 1 ou 2. */
export function HealthSoftModeView({ onGoApoio, onGoDiario }: Props)
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const humor = useDataStore((s) => s.humor)
  const addHumor = useDataStore((s) => s.addHumor)
  const isGuest = useAuthStore((s) => s.isGuest)
  const humorHoje = humorDoDia(humor, localTodayIso()) ?? null

  return (
    <View style={{ gap: space.md }}>
      <Card
        tone="elevated"
        style={{
          gap: space.sm,
          borderRadius: 18,
          borderTopWidth: 1,
          borderTopColor: colors.axel,
          flexDirection: 'row',
          alignItems: 'flex-start',
        }}
      >
        <IconBadge name="sparkles" color={colors.axel} size={44} iconSize={22} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
            AXEL
          </Text>
          <Text variant="voice">
            Hoje pesa. Está tudo bem ir devagar. Só o que couber agora.
          </Text>
        </View>
      </Card>

      <Card tone="elevated" style={{ gap: space.md, borderRadius: 18 }}>
        <SectionHeader
          title="Como você está?"
          subtitle="Pode atualizar se o sentimento mudar"
        />
        <MoodFaceRow
          value={humorHoje?.humor}
          onChange={(m) => void addHumor(m, undefined, isGuest)}
        />
        <PressableScale onPress={onGoDiario} accessibilityRole="button">
          <Text variant="caption" color={colors.axel} style={{ fontWeight: '600' }}>
            Abrir diário completo
          </Text>
        </PressableScale>
      </Card>

      <Card tone="elevated" style={{ gap: space.sm, borderRadius: 18 }}>
        <SectionHeader
          title="Baixar o ritmo"
          subtitle="Um guia curto. Não precisa fazer os dois."
        />
        {CALM_EXERCISES.map((ex) => (
          <PressableScale
            key={ex.id}
            onPress={() => router.push(ex.route as '/calm/box-breathing' | '/calm/grounding')}
            style={{
              minHeight: 52,
              padding: space.md,
              borderRadius: 18,
              backgroundColor: colors.axelMuted,
              gap: 4,
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
      </Card>

      <CrisisSupportCard compact />

      <PrimaryButton
        label="Ver apoio completo"
        variant="ghost"
        onPress={onGoApoio}
      />
    </View>
  )
}
