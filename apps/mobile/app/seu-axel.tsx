import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { UNLOCKS, isUnlocked } from '@simply-life/shared'
import { Screen, Text, GroupedList, GroupedRow, RowGlyph } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { AxelSun } from '../src/components/AxelSun'
import { ProfileAvatarBadge } from '../src/components/social/ProfileAvatarBadge'
import { useTheme } from '../src/theme/ThemeProvider'
import { usePrefsStore } from '../src/store/prefsStore'
import { gamificationLevel, useGamificationStore } from '../src/store/gamificationStore'
import { useElo } from '../src/hooks/useElo'
import { resolveAxelName } from '../src/lib/axelName'
import { useAuthStore } from '../src/store/authStore'

const PARTES = [
  {
    href: '/(tabs)' as const,
    title: 'Início',
    subtitle: 'Só o agora: busca, atalhos, a próxima tarefa e três linhas do dia.',
    icon: 'home' as const,
    colorKey: 'axelFill' as const,
  },
  {
    href: '/(tabs)/saude' as const,
    title: 'Saúde',
    subtitle: 'Marque o humor. O que falta abre em Cuidados, uma aba de cada vez.',
    icon: 'heart' as const,
    colorKey: 'health' as const,
  },
  {
    href: '/(tabs)/financeiro' as const,
    title: 'Carteira',
    subtitle: 'O saldo da conta e o botão de anotar. Lista, cartões e gráficos ficam nas abas.',
    icon: 'wallet' as const,
    colorKey: 'finance' as const,
  },
  {
    href: '/(tabs)/kanban' as const,
    title: 'Tarefas',
    subtitle: 'A fila do que fazer. Marque o que terminou. Uma coisa por linha.',
    icon: 'checkbox' as const,
    colorKey: 'tasks' as const,
  },
]

/** O lugar do AXEL: como o app funciona, o jogo e os ícones do rosto. */
export default function SeuAxelScreen()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const email = useAuthStore((s) => s.sessionEmail)
  const prefs = usePrefsStore((s) => s.prefs)
  const patch = usePrefsStore((s) => s.patch)
  const totalXp = useGamificationStore((s) => s.totalXp)
  const gold = useGamificationStore((s) => s.gold)
  const owned = useGamificationStore((s) => s.owned)
  const elo = useElo().atual
  const { level, pct, xpInLevel, xpToNext } = gamificationLevel(totalXp)
  const name = resolveAxelName({
    isGuest,
    callsYou: prefs.axel_calls_you,
    displayName: prefs.display_name,
    email,
  })
  const calm = prefs.gamification_mode !== 'rpg'
  const avatars = UNLOCKS.filter((item) => item.kind === 'avatar').sort((a, b) => a.level - b.level)
  const current = prefs.profile_avatar_icon ?? 'initials'

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader
        title="Seu AXEL"
        subtitle="Um lugar para cada coisa. O jogo só muda a aparência."
      />

      <View style={{ gap: space.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <AxelSun size={72} mood="calm" />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="section">{name}</Text>
            <Text variant="caption" muted>
              O AXEL sugere a próxima coisa e diz o motivo. A decisão continua sua. Ele não cobra sequência de dias.
            </Text>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text variant="caption" muted style={{ marginLeft: 4 }}>
            Como usar, na melhor ordem
          </Text>
          <GroupedList>
            {PARTES.map((parte) => (
              <GroupedRow
                key={parte.title}
                leading={<RowGlyph name={parte.icon} color={colors[parte.colorKey]} />}
                title={parte.title}
                subtitle={parte.subtitle}
                subtitleLines={2}
                onPress={() => router.push(parte.href)}
              />
            ))}
          </GroupedList>
        </View>

        <View style={{ gap: 8 }}>
          <Text variant="caption" muted style={{ marginLeft: 4 }}>
            O jogo, em uma frase cada
          </Text>
          <GroupedList>
            <GroupedRow
              leading={<RowGlyph name="star" color={colors.axelFill} />}
              title={`Nível ${level}`}
              subtitle={`${xpInLevel} de ${xpToNext} pontos neste nível. A cada 500 pontos, sobe 1. O dia para em 90, para não virar obrigação.`}
              subtitleLines={3}
            >
              <View
                style={{
                  marginTop: 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: colors.hairline,
                  overflow: 'hidden',
                }}
              >
                <View style={{ width: `${pct}%`, height: '100%', backgroundColor: colors.axelFill }} />
              </View>
            </GroupedRow>
            <GroupedRow
              leading={<RowGlyph name="cash" color={colors.attention} />}
              title={`${gold} moedas`}
              subtitle="Compram só aparência: ícone, fundo do quadro, anel. Não pagam conta e não são dinheiro."
              subtitleLines={2}
            />
            <GroupedRow
              leading={<RowGlyph name="flame" color={colors.health} />}
              title={`Elo de ${elo} dia${elo === 1 ? '' : 's'}`}
              subtitle="Conta dias seguidos com alguma ação. Um descanso por semana não quebra. Ficar sem abrir o app não tira ponto."
              subtitleLines={3}
              onPress={() => router.push('/ofensiva')}
            />
            <GroupedRow
              title={calm ? 'Modo calmo ligado' : 'Modo aventura ligado'}
              subtitle={
                calm
                  ? 'Os pontos existem, mas o Início não mostra o palco. Dá para ligar a aventura em Configurações.'
                  : 'O Início mostra o palco, a energia e o baú. Nada disso tira o que você já ganhou. Dá para desligar em Configurações.'
              }
              subtitleLines={2}
              onPress={() => router.push('/configuracoes')}
            />
          </GroupedList>
          <Text variant="caption" muted style={{ marginHorizontal: 4 }}>
            Pontos sobem ao concluir tarefa, registrar água, humor ou um gasto. Pular um dia não desconta.
          </Text>
        </View>

        <View style={{ gap: space.sm }}>
          <Text variant="caption" muted style={{ marginLeft: 4 }}>
            Seu rosto agora
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <ProfileAvatarBadge size={64} />
            <Text variant="body" muted style={{ flex: 1 }}>
              Toque um ícone liberado para usar. Os apagados abrem no nível escrito, ou antes com moedas.
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {avatars.map((item) =>
            {
              const open = isUnlocked(item, level, owned)
              const on = current === item.value
              return (
                <Pressable
                  key={item.id}
                  disabled={!open}
                  onPress={() => void patch({ profile_avatar_icon: item.value })}
                  accessibilityRole="button"
                  accessibilityLabel={open ? item.label : `${item.label}, abre no nível ${item.level}`}
                  accessibilityState={{ selected: on, disabled: !open }}
                  style={{
                    width: 76,
                    minHeight: 96,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    paddingVertical: 8,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: on ? colors.axel : colors.hairline,
                    backgroundColor: on ? colors.axelMuted : colors.surface,
                    opacity: open ? 1 : 0.45,
                  }}
                >
                  <ProfileAvatarBadge size={44} icon={item.value} />
                  <Text variant="micro" numberOfLines={1} style={{ paddingHorizontal: 4 }}>
                    {item.label}
                  </Text>
                  <Text variant="micro" muted>
                    {open ? (on ? 'Em uso' : 'Usar') : `Nível ${item.level}`}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text variant="caption" muted style={{ marginLeft: 4 }}>
            O resto do jogo
          </Text>
          <GroupedList>
            <GroupedRow
              title="Desbloqueios"
              subtitle="Fundos do quadro, anéis e o que as moedas compram"
              onPress={() => router.push('/desbloqueios')}
            />
            <GroupedRow
              title="Coleção"
              subtitle="Álbum e prêmios que você mesmo combina"
              onPress={() => router.push('/colecao')}
            />
            <GroupedRow
              title="Histórico do AXEL"
              subtitle="O que ele sugeriu e o que você decidiu"
              onPress={() => router.push('/axel/historico')}
            />
          </GroupedList>
        </View>
      </View>
    </Screen>
  )
}
