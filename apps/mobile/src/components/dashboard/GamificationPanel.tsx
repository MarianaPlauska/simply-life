import { View } from 'react-native'
import {
  STARTER_ACHIEVEMENTS,
  REWARD_SHOP,
  TRAIL_MILESTONES,
} from '@simply-life/shared'
import { Card, Text, PrimaryButton, SectionHeader } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useGamificationStore, gamificationLevel } from '../../store/gamificationStore'

export function GamificationPanel()
{
  const { space, colors, radius } = useTheme()
  const totalXp = useGamificationStore((s) => s.totalXp)
  const gold = useGamificationStore((s) => s.gold)
  const unlocked = useGamificationStore((s) => s.unlocked)
  const owned = useGamificationStore((s) => s.owned)
  const streak = useGamificationStore((s) => s.streak)
  const buyItem = useGamificationStore((s) => s.buyItem)
  const { level, pct, xpInLevel, xpToNext, next } = gamificationLevel(totalXp)

  return (
    <View style={{ gap: space.lg }}>
      <Card tone="hero" style={{ gap: space.sm }}>
        <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
          Trilha AXEL
        </Text>
        <Text variant="hero">Nível {level}</Text>
        <Text variant="caption" muted>
          {xpInLevel}/{xpToNext} XP neste nível · {gold} moedas · ofensiva {streak}
        </Text>
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
        {next ? (
          <Text variant="caption" muted>
            Próximo: {next.title} (nível {next.level})
          </Text>
        ) : null}
      </Card>

      <Card tone="elevated" style={{ gap: space.sm }}>
        <SectionHeader title="Marcos" subtitle="Desbloqueios da trilha" />
        {TRAIL_MILESTONES.map((m) => (
          <Text key={m.level} variant="caption" muted>
            Nv {m.level} · {m.title}: {m.reward}
          </Text>
        ))}
      </Card>

      <Card tone="elevated" style={{ gap: space.sm }}>
        <SectionHeader title="Conquistas" />
        {STARTER_ACHIEVEMENTS.map((a) => (
          <View key={a.id} style={{ gap: 2 }}>
            <Text variant="bodyStrong">
              {unlocked.includes(a.id) ? '● ' : '○ '}
              {a.title}
            </Text>
            <Text variant="caption" muted>
              {a.description} · +{a.xpReward} XP
            </Text>
          </View>
        ))}
      </Card>

      <Card tone="elevated" style={{ gap: space.sm }}>
        <SectionHeader title="Loja de recompensas" subtitle={`${gold} moedas`} />
        {REWARD_SHOP.map((item) => (
          <View key={item.id} style={{ gap: 6 }}>
            <Text variant="bodyStrong">{item.title}</Text>
            <Text variant="caption" muted>
              {item.cost} moedas · {item.kind}
            </Text>
            <PrimaryButton
              label={owned.includes(item.id) ? 'Adquirido' : 'Comprar'}
              variant={owned.includes(item.id) ? 'ghost' : 'secondary'}
              disabled={owned.includes(item.id)}
              size="sm"
              onPress={() =>
              {
                void buyItem(item.id, item.cost)
              }}
            />
          </View>
        ))}
      </Card>
    </View>
  )
}
