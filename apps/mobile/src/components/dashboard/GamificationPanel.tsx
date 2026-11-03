import { View } from 'react-native'
import {
  STARTER_ACHIEVEMENTS,
  REWARD_SHOP,
  TRAIL_MILESTONES,
  AXEL_ACCESSORIES,
} from '@simply-life/shared'
import { Card, Text, PrimaryButton, SectionHeader } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useGamificationStore, gamificationLevel } from '../../store/gamificationStore'
import { usePrefsStore } from '../../store/prefsStore'
import { useElo } from '../../hooks/useElo'

function shopKindLabel(kind: string): string
{
  if (kind === 'cosmetic') return 'só muda a aparência'
  if (kind === 'boost') return 'um empurrão no foco, sem mudar a tarefa'
  return kind
}

export function GamificationPanel()
{
  const { space, colors, radius } = useTheme()
  const totalXp = useGamificationStore((s) => s.totalXp)
  const gold = useGamificationStore((s) => s.gold)
  const unlocked = useGamificationStore((s) => s.unlocked)
  const owned = useGamificationStore((s) => s.owned)
  const streak = useElo().atual
  const buyItem = useGamificationStore((s) => s.buyItem)
  const accessory = usePrefsStore((s) => s.prefs.axel_accessory)
  const patch = usePrefsStore((s) => s.patch)
  const { level, pct, xpInLevel, xpToNext, next } = gamificationLevel(totalXp)

  return (
    <View style={{ gap: space.md }}>
      <View style={{ gap: 6 }}>
        <Text variant="section">Como o placar funciona</Text>
        <Text variant="body" muted>
          É um jogo simples, sem nota e sem dinheiro de verdade. Você cuida do dia e o placar sobe.
        </Text>
        <Text variant="caption" muted>
          Pontos sobem ao concluir tarefa, registrar água ou anotar um gasto. A cada 500 pontos, sobe 1 nível. O dia para em 90 pontos, para não virar obrigação.
        </Text>
        <Text variant="caption" muted>
          Moedas compram só aparência na loja. Elo é outra coisa: conta quantos dias seguidos você fez alguma ação. Um descanso por semana não quebra o elo.
        </Text>
      </View>
      <Card tone="hero" style={{ gap: space.sm }}>
        <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
          Seu nível agora
        </Text>
        <Text variant="hero">Nível {level}</Text>
        <Text variant="caption" muted>
          {xpInLevel} de {xpToNext} pontos neste nível. {gold} moedas. Elo de {streak} dia{streak === 1 ? '' : 's'}.
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
              backgroundColor: colors.axelFill,
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
        <SectionHeader title="Fases" subtitle="Nomes de nível, como num jogo. Não escondem função do app." />
        {TRAIL_MILESTONES.map((m) => (
          <Text key={m.level} variant="caption" muted>
            Nv {m.level} · {m.title}: {m.reward}
          </Text>
        ))}
      </Card>

      <Card tone="elevated" style={{ gap: space.sm }}>
        <SectionHeader title="Conquistas" />
        {STARTER_ACHIEVEMENTS.map((a) => (
          <View key={a.id} style={{ gap: 4 }}>
            <Text variant="bodyStrong">
              {unlocked.includes(a.id) ? '● ' : '○ '}
              {a.title}
            </Text>
            <Text variant="caption" muted>
              {a.description} Vale {a.xpReward} pontos.
            </Text>
          </View>
        ))}
      </Card>

      <Card tone="elevated" style={{ gap: space.sm }}>
        <SectionHeader title="Loja" subtitle={`${gold} moedas. Não pagam conta.`} />
        {REWARD_SHOP.map((item) => (
          <View key={item.id} style={{ gap: 8 }}>
            <Text variant="bodyStrong">{item.title}</Text>
            <Text variant="caption" muted>
              {item.cost} moedas. {shopKindLabel(item.kind)}
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
        {AXEL_ACCESSORIES.map((item) => (
          <View key={item.id} style={{ gap: 8 }}>
            <Text variant="bodyStrong">{item.label}</Text>
            <Text variant="caption" muted>{item.coins} moedas. Uma peça para o AXEL usar.</Text>
            <View style={{ gap: 8 }}>
              <PrimaryButton
                label={owned.includes(item.id) ? 'Adquirido' : 'Comprar'}
                variant={owned.includes(item.id) ? 'ghost' : 'secondary'}
                disabled={owned.includes(item.id)}
                size="sm"
                onPress={() =>
                {
                  void buyItem(item.id, item.coins)
                }}
              />
              {owned.includes(item.id) ? (
                <PrimaryButton
                  label={accessory === item.id ? 'Usando' : 'Usar'}
                  variant="ghost"
                  size="sm"
                  onPress={() => void patch({ axel_accessory: item.id })}
                />
              ) : null}
            </View>
          </View>
        ))}
      </Card>
    </View>
  )
}
