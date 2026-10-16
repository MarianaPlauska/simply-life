import { useCallback, useEffect, useState } from 'react'
import { Pressable, Share, View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { buildJoinUrl } from '@simply-life/shared'
import { Screen, Text, Card, PrimaryButton, EmptyState, Icon } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { PersonAvatar } from '../src/components/social/PersonAvatar'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { confirmDestructive } from '../src/lib/confirmDestructive'
import { appOrigin } from '../src/lib/appOrigin'
import {
  createFriendInviteLink,
  fetchFriends,
  fetchPendingFriendInvites,
  removeFriend,
  revokeFriendInvite,
  setFriendMuted,
  type FriendCard,
  type PendingFriendInvite,
} from '../src/lib/sync/friends'
import { METAS_HREF } from '../src/lib/sharedGoalRoutes'

function daysLeft(iso: string): number
{
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))
}

export default function AmigosScreen()
{
  const { colors, space, radius } = useTheme()
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const [friends, setFriends] = useState<FriendCard[]>([])
  const [pending, setPending] = useState<PendingFriendInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [lastLink, setLastLink] = useState<string | null>(null)

  const reload = useCallback(async () =>
  {
    if (isGuest) return
    setLoading(true)
    try
    {
      const [f, p] = await Promise.all([fetchFriends(), fetchPendingFriendInvites()])
      setFriends(f)
      setPending(p)
    }
    catch
    {
      setMsg('Não deu para carregar o Círculo agora')
    }
    finally
    {
      setLoading(false)
    }
  }, [isGuest])

  useEffect(() =>
  {
    void reload()
  }, [reload])

  if (!userId) return <Redirect href="/login" />

  const shareLink = async (url: string) =>
  {
    try
    {
      await Share.share({
        message: `Vem para o meu Círculo no SunFy: ${url}`,
        url,
      })
    }
    catch
    {
      /* a pessoa fechou o compartilhar */
    }
  }

  const invite = async () =>
  {
    setBusy(true)
    setMsg(null)
    const res = await createFriendInviteLink()
    setBusy(false)
    if (!res)
    {
      setMsg('Não deu para gerar o convite agora')
      return
    }
    setLastLink(res.url)
    void reload()
    await shareLink(res.url)
  }

  if (isGuest)
  {
    return (
      <Screen scroll tabBarInset={false}>
        <StackHeader title="Círculo" />
        <Card>
          <EmptyState
            icon="people-outline"
            title="O Círculo precisa de uma conta"
            body="No modo convidado tudo fica só neste aparelho. Crie uma conta para chamar amigos e fazer metas juntos."
          />
          <PrimaryButton label="Criar conta ou entrar" style={{ alignSelf: 'center' }} onPress={() => router.push('/login')} />
        </Card>
      </Screen>
    )
  }

  return (
    <Screen scroll tabBarInset={false} refreshing={loading} onRefresh={() => void reload()}>
      <StackHeader title="Círculo" subtitle="Quem caminha com você" />

      <View style={{ gap: space.md }}>
        <Card tone="elevated" style={{ gap: space.sm }}>
          <Text variant="section">Chamar alguém</Text>
          <Text variant="caption" muted>
            O link vale por 7 dias. Amigos veem só seu nome e avatar, nunca seus registros.
          </Text>
          <PrimaryButton label="Convidar" icon="person-add-outline" loading={busy} onPress={() => void invite()} />
          {lastLink ? (
            <Text variant="caption" muted selectable>
              {lastLink}
            </Text>
          ) : null}
          {msg ? (
            <Text variant="caption" muted>
              {msg}
            </Text>
          ) : null}
        </Card>

        <Pressable
          onPress={() => router.push(METAS_HREF)}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.sm,
            padding: space.md,
            borderRadius: radius.card,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.cardRim,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Icon name="flag-outline" size={22} color={colors.ink} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Metas juntos</Text>
            <Text variant="caption" muted>
              Água, treino, foco ou o que quiserem, sem ver o número de ninguém.
            </Text>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.inkMuted} />
        </Pressable>

        <View style={{ gap: space.sm }}>
          <Text variant="label" muted>
            Amigos
          </Text>
          {friends.length === 0 && !loading ? (
            <Card>
              <EmptyState
                icon="people-outline"
                title="Ainda só você por aqui"
                body="Quando alguém aceitar seu convite, a pessoa aparece nesta lista."
              />
            </Card>
          ) : (
            friends.map((f) => (
              <Card key={f.userId} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <PersonAvatar name={f.displayName} accent={f.accent} avatarStyle={f.avatarStyle} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {f.displayName}
                  </Text>
                  {f.muted ? (
                    <Text variant="caption" muted>
                      Silenciado: o apoio chega sem aviso.
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={f.muted ? `Voltar a ouvir ${f.displayName}` : `Silenciar ${f.displayName}`}
                  onPress={() =>
                  {
                    void setFriendMuted(f.userId, !f.muted).then((ok) =>
                    {
                      if (ok) setFriends((cur) => cur.map((x) => (x.userId === f.userId ? { ...x, muted: !f.muted } : x)))
                    })
                  }}
                  style={{ width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.elevated }}
                >
                  <Icon name={f.muted ? 'volume-mute' : 'notifications-outline'} size={20} color={colors.inkMuted} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remover ${f.displayName}`}
                  onPress={() =>
                    confirmDestructive(
                      'Remover do Círculo?',
                      `${f.displayName} não será avisado. Vocês podem se conectar de novo por um convite.`,
                      () =>
                      {
                        void removeFriend(f.userId).then((ok) =>
                        {
                          if (ok) setFriends((cur) => cur.filter((x) => x.userId !== f.userId))
                          else setMsg('Não deu para remover agora')
                        })
                      },
                      'Remover',
                    )}
                  style={{ width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.elevated }}
                >
                  <Icon name="close" size={20} color={colors.inkMuted} />
                </Pressable>
              </Card>
            ))
          )}
        </View>

        {pending.length > 0 ? (
          <View style={{ gap: space.sm }}>
            <Text variant="label" muted>
              Convites abertos
            </Text>
            {pending.map((p) => (
              <Card key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <Icon name="link" size={20} color={colors.inkMuted} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{p.code}</Text>
                  <Text variant="caption" muted>
                    {daysLeft(p.expiresAt) <= 1 ? 'Vale até amanhã' : `Vale por mais ${daysLeft(p.expiresAt)} dias`}
                  </Text>
                </View>
                <PrimaryButton
                  label="Enviar"
                  size="sm"
                  variant="secondary"
                  onPress={() => void shareLink(buildJoinUrl(appOrigin(), p.code))}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar convite"
                  onPress={() =>
                  {
                    void revokeFriendInvite(p.id).then((ok) =>
                    {
                      if (ok) setPending((cur) => cur.filter((x) => x.id !== p.id))
                    })
                  }}
                  style={{ width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name="close" size={18} color={colors.inkMuted} />
                </Pressable>
              </Card>
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  )
}
