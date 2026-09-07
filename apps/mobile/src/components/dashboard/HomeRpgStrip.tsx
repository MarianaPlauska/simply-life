import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Card, Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useGamificationStore, gamificationLevel } from '../../store/gamificationStore'

/** Trilha RPG compacta na Home — opt-in no onboarding (TDAH). */
export function HomeRpgStrip()
{
  const { colors, space, radius } = useTheme()
  const router = useRouter()
  const totalXp = useGamificationStore((s) => s.totalXp)
  const gold = useGamificationStore((s) => s.gold)
  const streak = useGamificationStore((s) => s.streak)
  const { level, pct, xpInLevel, xpToNext, next } = gamificationLevel(totalXp)

  return (
    <PressableScale onPress={() => router.push('/ofensiva')}>
      <Card
        tone="hero"
        style={{
          gap: space.sm,
          borderWidth: 1,
          borderColor: colors.axel,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
              Modo aventura
            </Text>
            <Text variant="bodyStrong">Nível {level} · {gold} moedas</Text>
          </View>
          <Text variant="caption" muted>
            Ofensiva {streak}
          </Text>
        </View>
        <View
          style={{
            height: 8,
            borderRadius: radius.pill,
            backgroundColor: colors.hairline,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${pct}%`,
              height: '100%',
              backgroundColor: colors.axel,
            }}
          />
        </View>
        <Text variant="caption" muted>
          {xpInLevel}/{xpToNext} XP · {next ? `Próximo: ${next.title}` : 'Trilha completa neste ciclo'}
        </Text>
        <Text variant="caption" muted>
          Cada passo de tarefa e hábito soma experiência. Sem penalidade por dias sem abrir.
        </Text>
      </Card>
    </PressableScale>
  )
}
