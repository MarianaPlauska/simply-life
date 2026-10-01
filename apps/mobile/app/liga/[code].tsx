import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { LEAGUE_AREAS, leagueDivisionName } from '@simply-life/shared'
import { Screen, Text, Card, PrimaryButton, Icon } from '../../src/ui'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useAuthStore } from '../../src/store/authStore'
import { useLeagueStore } from '../../src/store/leagueStore'
import { acceptLeagueInvite, previewLeagueInvite } from '../../src/lib/sync/leagues'

type Preview = { nome: string; tipo: string; area: string; divisao: number; membros: number; convidou: string }

/** Aceite do convite de liga: mostra a liga antes de entrar. */
export default function JoinLeagueScreen()
{
  const { colors, space } = useTheme()
  const { code } = useLocalSearchParams<{ code: string }>()
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const mfaPending = useAuthStore((s) => s.mfaPendingFactorId)
  const [status, setStatus] = useState<'loading' | 'preview' | 'joining' | 'error'>('loading')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [message, setMessage] = useState('')

  const loggedIn = Boolean(userId) && !isGuest && !mfaPending
  const clean = String(code ?? '').toUpperCase()

  useEffect(() =>
  {
    if (!clean || !loggedIn) return
    let cancelled = false
    void previewLeagueInvite(clean).then((r) =>
    {
      if (cancelled) return
      if (!r.ok)
      {
        setMessage(r.message ?? 'Convite inválido ou expirado')
        setStatus('error')
        return
      }
      setPreview({
        nome: String(r.nome),
        tipo: String(r.tipo),
        area: String(r.area),
        divisao: Number(r.divisao) || 0,
        membros: Number(r.membros) || 0,
        convidou: String(r.convidou),
      })
      setStatus('preview')
    })
    return () =>
    {
      cancelled = true
    }
  }, [clean, loggedIn])

  const join = async () =>
  {
    setStatus('joining')
    const r = await acceptLeagueInvite(clean)
    if (!r.ok || !r.id)
    {
      setMessage(r.message ?? 'Não deu para entrar agora')
      setStatus('error')
      return
    }
    await useLeagueStore.getState().load()
    router.replace(`/ligas/${r.id}` as never)
  }

  const areaLabel = LEAGUE_AREAS.find((a) => a.id === preview?.area)?.label ?? 'Tudo'

  return (
    <Screen tabBarInset={false}>
      <View style={{ flex: 1, justifyContent: 'center', gap: space.md, paddingHorizontal: space.sm }}>
        <Text variant="hero" style={{ textAlign: 'center' }}>
          Liga
        </Text>

        {!loggedIn ? (
          <>
            <Text variant="body" muted style={{ textAlign: 'center' }}>
              {isGuest
                ? 'Ligas precisam de uma conta. No modo convidado tudo fica só neste aparelho.'
                : `Entre ou crie sua conta para ver o convite ${clean}.`}
            </Text>
            <PrimaryButton label="Entrar no Simply Life" onPress={() => router.replace('/login')} />
          </>
        ) : status === 'loading' ? (
          <ActivityIndicator color={colors.axel} />
        ) : status === 'error' ? (
          <>
            <Text variant="body" style={{ textAlign: 'center' }}>
              {message}
            </Text>
            <PrimaryButton label="Ver minhas ligas" variant="secondary" onPress={() => router.replace('/ligas' as never)} />
          </>
        ) : preview ? (
          <>
            <Card tone="elevated" style={{ gap: space.sm, alignItems: 'center' }}>
              <Icon name="people-outline" size={32} color={colors.ink} />
              <Text variant="section" style={{ textAlign: 'center' }}>
                {preview.nome}
              </Text>
              <Text variant="caption" muted style={{ textAlign: 'center' }}>
                {preview.tipo === 'tematica' ? `Temática: ${areaLabel}` : 'Liga de amigos'} · {leagueDivisionName(preview.divisao)}
              </Text>
              <Text variant="body" style={{ textAlign: 'center' }}>
                {preview.convidou} chamou você. {preview.membros > 1 ? `Já são ${preview.membros} pessoas.` : ''}
              </Text>
            </Card>
            <Text variant="caption" muted style={{ textAlign: 'center' }}>
              O XP que você ganha na semana ajuda a encher o pote. Ninguém vê quanto cada um fez, e dá para sair quando quiser.
            </Text>
            <PrimaryButton label="Entrar na liga" loading={status === 'joining'} onPress={() => void join()} />
            <PrimaryButton label="Agora não" variant="link" onPress={() => router.replace('/(tabs)')} />
          </>
        ) : null}
      </View>
    </Screen>
  )
}
