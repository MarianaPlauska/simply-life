import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { sharedGoalAlvoLabel, type SharedGoalMetrica } from '@simply-life/shared'
import { Screen, Text, Card, PrimaryButton, Icon } from '../../src/ui'
import { SHARED_GOAL_METRIC_ICON } from '../../src/components/sharedGoals/metricIcon'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useAuthStore } from '../../src/store/authStore'
import { useSharedGoalsStore } from '../../src/store/sharedGoalsStore'
import {
  acceptGoalInvite,
  previewGoalInvite,
  type GoalInvitePreview,
} from '../../src/lib/sync/sharedGoals'
import { METAS_HREF, goalHref } from '../../src/lib/sharedGoalRoutes'

export default function JoinGoalScreen()
{
  const { colors, space } = useTheme()
  const { code } = useLocalSearchParams<{ code: string }>()
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const mfaPending = useAuthStore((s) => s.mfaPendingFactorId)
  const [status, setStatus] = useState<'loading' | 'preview' | 'joining' | 'error'>('loading')
  const [preview, setPreview] = useState<GoalInvitePreview | null>(null)
  const [message, setMessage] = useState('')

  const loggedIn = Boolean(userId) && !isGuest && !mfaPending
  const clean = String(code ?? '').toUpperCase()

  useEffect(() =>
  {
    if (!clean || !loggedIn) return
    let cancelled = false
    setStatus('loading')
    void previewGoalInvite(clean).then((r) =>
    {
      if (cancelled) return
      if (!r.ok || !r.preview)
      {
        setMessage(r.message ?? 'Convite inválido ou expirado')
        setStatus('error')
        return
      }
      setPreview(r.preview)
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
    const r = await acceptGoalInvite(clean)
    if (!r.ok || !r.goal_id)
    {
      setMessage(r.message ?? 'Não deu para entrar agora')
      setStatus('error')
      return
    }
    await useSharedGoalsStore.getState().load()
    router.replace(goalHref(String(r.goal_id)))
  }

  return (
    <Screen tabBarInset={false}>
      <View style={{ flex: 1, justifyContent: 'center', gap: space.md, paddingHorizontal: space.sm }}>
        <Text variant="hero" style={{ textAlign: 'center' }}>
          Meta junto
        </Text>

        {!loggedIn ? (
          <>
            <Text variant="body" muted style={{ textAlign: 'center' }}>
              {isGuest
                ? 'Metas juntos precisam de uma conta. No modo convidado tudo fica só neste aparelho.'
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
            <PrimaryButton label="Ver minhas metas" variant="secondary" onPress={() => router.replace(METAS_HREF)} />
          </>
        ) : preview ? (
          <>
            <Card tone="elevated" style={{ gap: space.sm, alignItems: 'center' }}>
              <Icon name={SHARED_GOAL_METRIC_ICON[(preview.metrica as SharedGoalMetrica)] ?? 'flag-outline'} size={32} color={colors.ink} />
              <Text variant="section" style={{ textAlign: 'center' }}>
                {preview.titulo}
              </Text>
              <Text variant="caption" muted style={{ textAlign: 'center' }}>
                {sharedGoalAlvoLabel({
                  alvo: preview.alvo,
                  unidade: preview.unidade,
                  modo: preview.modo,
                  ciclo: preview.ciclo,
                  metrica: preview.metrica as SharedGoalMetrica,
                })}
              </Text>
              <Text variant="body" style={{ textAlign: 'center' }}>
                {preview.inviterName} chamou você.{' '}
                {preview.members > 1 ? `Já são ${preview.members} pessoas.` : ''}
              </Text>
            </Card>
            <Text variant="caption" muted style={{ textAlign: 'center' }}>
              Você segue anotando no seu app. O grupo vê só o caminho juntos, nunca o seu número. Dá para silenciar ou sair quando quiser.
            </Text>
            {preview.alreadyMember ? (
              <PrimaryButton label="Abrir a meta" loading={status === 'joining'} onPress={() => void join()} />
            ) : (
              <PrimaryButton label="Entrar na meta" loading={status === 'joining'} onPress={() => void join()} />
            )}
            <PrimaryButton label="Agora não" variant="link" onPress={() => router.replace('/(tabs)')} />
          </>
        ) : (
          <ActivityIndicator color={colors.axel} />
        )}
      </View>
    </Screen>
  )
}
