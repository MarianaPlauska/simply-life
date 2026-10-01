import { useEffect, useState } from 'react'
import { Share, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  LEAGUE_AREAS,
  LEAGUE_DIVISIONS,
  LEAGUE_MAX_MEMBERS,
  leagueDivisionName,
  leagueLastWeekLine,
  leaguePotLine,
} from '@simply-life/shared'
import { Screen, Text, Card, PrimaryButton, Icon } from '../../src/ui'
import { StackHeader } from '../../src/components/layout/StackHeader'
import { PersonAvatar } from '../../src/components/social/PersonAvatar'
import { LeaguePot } from '../../src/components/leagues/LeaguePot'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useLeagueStore } from '../../src/store/leagueStore'
import { createLeagueInvite } from '../../src/lib/sync/leagues'
import { confirmDestructive } from '../../src/lib/confirmDestructive'

/** Uma liga: pote da semana (só faixa), divisão, pessoas e convite. */
export default function LigaScreen()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const { id, convidar } = useLocalSearchParams<{ id: string; convidar?: string }>()
  const league = useLeagueStore((s) => s.leagues.find((l) => l.id === id) ?? null)
  const progress = useLeagueStore((s) => (id ? s.progress[id] ?? null : null))
  const members = useLeagueStore((s) => (id ? s.members[id] ?? [] : []))
  const load = useLeagueStore((s) => s.load)
  const loadDetail = useLeagueStore((s) => s.loadDetail)
  const leave = useLeagueStore((s) => s.leave)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() =>
  {
    if (!id) return
    if (!league) void load()
    void loadDetail(id)
  }, [id])

  const invite = async () =>
  {
    if (!id) return
    setBusy(true)
    setMsg(null)
    const r = await createLeagueInvite(id)
    setBusy(false)
    if (!r.ok || !r.url)
    {
      setMsg(r.message ?? 'Não deu para gerar o convite agora')
      return
    }
    try
    {
      await Share.share({ message: `Vem para a liga "${league?.nome ?? ''}" no Simply Life? A gente enche o pote da semana juntos: ${r.url}`, url: r.url })
    }
    catch
    {
      setMsg(`Link do convite: ${r.url}`)
    }
  }

  useEffect(() =>
  {
    if (convidar === '1' && league) void invite()
  }, [convidar, league?.id])

  if (!league)
  {
    return (
      <Screen scroll tabBarInset={false}>
        <StackHeader title="Liga" />
        <Text variant="body" muted>
          Carregando a liga...
        </Text>
      </Screen>
    )
  }

  const divisao = progress?.divisao ?? league.divisao
  const area = LEAGUE_AREAS.find((a) => a.id === league.area)
  const last = progress ? leagueLastWeekLine(progress) : null
  const next = leagueDivisionName(divisao + 1)

  return (
    <Screen scroll tabBarInset={false} onRefresh={() => id && void loadDetail(id)}>
      <StackHeader
        title={league.nome}
        subtitle={league.tipo === 'tematica' ? `Liga temática: ${area?.label}` : 'Liga de amigos'}
      />

      <View style={{ gap: space.md }}>
        <Card style={{ alignItems: 'center', gap: space.md }}>
          <LeaguePot faixa={progress?.faixa ?? null} size={112} />
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text variant="section">{leagueDivisionName(divisao)}</Text>
            <Text variant="body" muted style={{ textAlign: 'center' }}>
              {progress ? leaguePotLine(progress) : 'Carregando o pote...'}
            </Text>
            {progress && progress.membros >= 2 ? (
              <Text variant="caption" muted style={{ textAlign: 'center' }}>
                Encher o pote leva a liga para {next}.
              </Text>
            ) : null}
          </View>
          {area ? (
            <Text variant="caption" muted style={{ textAlign: 'center' }}>
              {area.hint}
            </Text>
          ) : null}
        </Card>

        {last ? (
          <Card style={{ backgroundColor: progress?.semanaPassada?.subiu ? colors.axelMuted : colors.brandMuted }}>
            <Text variant="body">{last}</Text>
          </Card>
        ) : null}

        <Card style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="section">Pessoas</Text>
            <Text variant="caption" muted>
              {members.length} de {LEAGUE_MAX_MEMBERS}
            </Text>
          </View>
          {members.map((m) => (
            <View key={m.userId} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <PersonAvatar name={m.isMe ? 'Você' : m.displayName} accent={m.accent} avatarStyle={m.avatarStyle} size={36} />
              <Text variant="body" style={{ flex: 1 }}>
                {m.isMe ? 'Você' : m.displayName}
              </Text>
              {m.role === 'owner' ? (
                <Text variant="caption" muted>
                  criou a liga
                </Text>
              ) : null}
            </View>
          ))}
          <Text variant="caption" muted>
            Ninguém vê quanto cada um fez. O pote mostra só o caminho juntos.
          </Text>
          {members.length < LEAGUE_MAX_MEMBERS ? (
            <PrimaryButton label="Convidar alguém" icon="person-add-outline" loading={busy} onPress={() => void invite()} />
          ) : null}
          {msg ? (
            <Text variant="caption" style={{ color: colors.brand }}>
              {msg}
            </Text>
          ) : null}
        </Card>

        <Card style={{ gap: space.sm }}>
          <Text variant="section">Divisões</Text>
          <Text variant="caption" muted>
            A liga sobe uma divisão por semana de pote cheio. O pote cresce um pouco a cada divisão.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {LEAGUE_DIVISIONS.map((d, i) => (
              <View
                key={d}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: i <= divisao ? colors.axelMuted : colors.surface,
                  borderWidth: 1,
                  borderColor: i === divisao ? colors.axel : colors.hairline,
                }}
              >
                {i < divisao ? <Icon name="checkmark" size={12} color={colors.axel} /> : null}
                <Text variant="caption" style={{ color: i <= divisao ? colors.ink : colors.inkMuted }}>
                  {d}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <PrimaryButton
          label="Sair da liga"
          variant="link"
          onPress={() =>
            confirmDestructive(
              'Sair da liga',
              'Você sai do grupo. O que você já somou nas semanas passadas continua contando para eles.',
              () =>
              {
                void leave(league.id).then((ok) =>
                {
                  if (ok) router.back()
                })
              },
              'Sair',
            )}
        />
      </View>
    </Screen>
  )
}
