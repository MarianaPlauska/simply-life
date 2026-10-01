import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  LEAGUE_AREAS,
  leagueDivisionName,
  leaguePotLine,
  type LeagueArea,
  type LeagueType,
} from '@simply-life/shared'
import { Screen, Text, Card, Chip, Field, PrimaryButton, EmptyState, Icon } from '../../src/ui'
import { StackHeader } from '../../src/components/layout/StackHeader'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useAuthStore } from '../../src/store/authStore'
import { useLeagueStore } from '../../src/store/leagueStore'
import { createLeague } from '../../src/lib/sync/leagues'
import { LeaguePot } from '../../src/components/leagues/LeaguePot'

/** Ligas cooperativas: o grupo enche o pote da semana e sobe junto. */
export default function LigasScreen()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const leagues = useLeagueStore((s) => s.leagues)
  const progress = useLeagueStore((s) => s.progress)
  const loading = useLeagueStore((s) => s.loading)
  const load = useLeagueStore((s) => s.load)
  const [creating, setCreating] = useState(false)
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<LeagueType>('amigos')
  const [area, setArea] = useState<LeagueArea>('tarefas')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() =>
  {
    void load()
  }, [load])

  const create = async () =>
  {
    setBusy(true)
    setMsg(null)
    const r = await createLeague(nome.trim(), tipo, tipo === 'amigos' ? 'geral' : area)
    setBusy(false)
    if (!r.ok || !r.id)
    {
      setMsg(r.message ?? 'Não deu para criar a liga agora')
      return
    }
    setNome('')
    setCreating(false)
    await load()
    router.push(`/ligas/${r.id}?convidar=1` as never)
  }

  if (isGuest)
  {
    return (
      <Screen scroll tabBarInset={false}>
        <StackHeader title="Ligas" />
        <Card>
          <EmptyState
            icon="people-outline"
            title="Ligas precisam de uma conta"
            body="No modo convidado tudo fica neste aparelho. Com uma conta você cria ligas com amigos e enchem o pote juntos."
          />
          <PrimaryButton label="Criar conta ou entrar" onPress={() => router.push('/login')} />
        </Card>
      </Screen>
    )
  }

  return (
    <Screen scroll tabBarInset={false} refreshing={loading} onRefresh={() => void load()}>
      <StackHeader title="Ligas" subtitle="Um pote por semana, enchido juntos" />

      <View style={{ gap: space.md }}>
        <Card style={{ gap: space.sm }}>
          <Text variant="section">Como funciona</Text>
          <Text variant="body" muted>
            De 2 a 8 pessoas. Cada XP que alguém ganha na semana enche o pote da liga. Pote cheio até domingo, a liga inteira sobe de divisão na segunda.
          </Text>
          <Text variant="body" muted>
            Ninguém vê quanto cada um fez, só o quanto o pote encheu. Não existe rebaixamento: semana que não enche só não sobe.
          </Text>
        </Card>

        {leagues.length === 0 && !loading ? (
          <Text variant="caption" muted>
            Você ainda não está em nenhuma liga. Crie uma e chame quem você quiser.
          </Text>
        ) : null}

        {leagues.map((l) =>
        {
          const p = progress[l.id] ?? null
          const areaLabel = LEAGUE_AREAS.find((a) => a.id === l.area)?.label ?? 'Tudo'
          return (
            <Pressable key={l.id} onPress={() => router.push(`/ligas/${l.id}` as never)} accessibilityRole="button">
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <LeaguePot faixa={p?.faixa ?? null} size={52} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {l.nome}
                  </Text>
                  <Text variant="caption" muted>
                    {leagueDivisionName(p?.divisao ?? l.divisao)} · {l.tipo === 'tematica' ? `Temática: ${areaLabel}` : 'Amigos'}
                  </Text>
                  {p ? (
                    <Text variant="caption" muted numberOfLines={2}>
                      {leaguePotLine(p)}
                    </Text>
                  ) : null}
                </View>
                <Icon name="chevron-forward" size={16} color={colors.inkMuted} />
              </Card>
            </Pressable>
          )
        })}

        {creating ? (
          <Card style={{ gap: space.md }}>
            <Text variant="section">Nova liga</Text>
            <Field label="Nome da liga" value={nome} onChangeText={setNome} placeholder="Turma do foco, Casa, Amigas do treino" maxLength={40} />
            <View style={{ gap: 12 }}>
              <Text variant="caption" muted>
                Tipo
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <Chip label="Amigos (todo XP)" active={tipo === 'amigos'} onPress={() => setTipo('amigos')} />
                <Chip label="Temática" active={tipo === 'tematica'} onPress={() => setTipo('tematica')} />
              </View>
            </View>
            {tipo === 'tematica' ? (
              <View style={{ gap: 12 }}>
                <Text variant="caption" muted>
                  O que conta
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {LEAGUE_AREAS.filter((a) => a.id !== 'geral').map((a) => (
                    <Chip key={a.id} label={a.label} active={area === a.id} onPress={() => setArea(a.id)} />
                  ))}
                </View>
                <Text variant="caption" muted>
                  {LEAGUE_AREAS.find((a) => a.id === area)?.hint}
                </Text>
              </View>
            ) : null}
            {msg ? (
              <Text variant="caption" style={{ color: colors.danger }}>
                {msg}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Cancelar" variant="ghost" onPress={() => setCreating(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Criar e convidar" loading={busy} disabled={!nome.trim()} onPress={() => void create()} />
              </View>
            </View>
          </Card>
        ) : (
          <PrimaryButton label="Criar uma liga" icon="add" onPress={() => setCreating(true)} />
        )}
      </View>
    </Screen>
  )
}
