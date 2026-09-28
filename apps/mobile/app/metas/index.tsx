import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { sharedGoalAlvoLabel, sharedGoalHeadline } from '@simply-life/shared'
import { Screen, Text, Card, PrimaryButton, EmptyState, Field, Icon } from '../../src/ui'
import { StackHeader } from '../../src/components/layout/StackHeader'
import { GoalProgressVisual } from '../../src/components/sharedGoals/GoalVisual'
import { SHARED_GOAL_METRIC_ICON } from '../../src/components/sharedGoals/metricIcon'
import { GuestGoalsState } from '../../src/components/sharedGoals/GuestGoalsState'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useAuthStore } from '../../src/store/authStore'
import { useSharedGoalsStore } from '../../src/store/sharedGoalsStore'
import { NOVA_META_HREF, AMIGOS_HREF, goalHref, goalInviteHref } from '../../src/lib/sharedGoalRoutes'

export default function MetasScreen()
{
  const { colors, space, radius } = useTheme()
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const goals = useSharedGoalsStore((s) => s.goals)
  const progress = useSharedGoalsStore((s) => s.progress)
  const loading = useSharedGoalsStore((s) => s.loading)
  const error = useSharedGoalsStore((s) => s.error)
  const load = useSharedGoalsStore((s) => s.load)
  const [codeOpen, setCodeOpen] = useState(false)
  const [code, setCode] = useState('')

  useEffect(() =>
  {
    if (!isGuest) void load()
  }, [isGuest, load])

  if (!userId) return <Redirect href="/login" />

  const ativas = goals.filter((g) => g.status === 'ativa')
  const encerradas = goals.filter((g) => g.status !== 'ativa')

  return (
    <Screen scroll tabBarInset={false} refreshing={loading} onRefresh={isGuest ? undefined : () => void load()}>
      <StackHeader title="Metas juntos" subtitle="Apoiar sem vigiar" />

      {isGuest ? (
        <GuestGoalsState />
      ) : (
        <View style={{ gap: space.md }}>
          <Card tone="elevated" style={{ gap: space.sm }}>
            <Text variant="voice">Cada um anota no próprio app. O grupo vê só o caminho juntos.</Text>
            <Text variant="caption" muted>
              Ninguém vê o número de ninguém. Perder um dia não zera nada, e sair é livre.
            </Text>
            <PrimaryButton label="Nova meta" icon="add" onPress={() => router.push(NOVA_META_HREF)} />
            {codeOpen ? (
              <View style={{ gap: space.sm }}>
                <Field
                  label="Código do convite"
                  value={code}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={12}
                  onChangeText={(t) => setCode(t.replace(/[^a-z0-9]/gi, '').toUpperCase())}
                  placeholder="Ex.: K7MPQ2XA"
                />
                <PrimaryButton
                  label="Ver convite"
                  variant="secondary"
                  disabled={code.length < 6}
                  onPress={() => router.push(goalInviteHref(code))}
                />
              </View>
            ) : (
              <PrimaryButton label="Tenho um código" variant="link" onPress={() => setCodeOpen(true)} />
            )}
          </Card>

          {error ? (
            <Text variant="caption" muted>
              {error}
            </Text>
          ) : null}

          {ativas.length === 0 && !loading ? (
            <Card>
              <EmptyState
                icon="flag-outline"
                title="Nenhuma meta por enquanto"
                body="Comece com algo pequeno, como água juntos nesta semana. Depois é só mandar o link."
              />
            </Card>
          ) : null}

          {ativas.map((g) =>
          {
            const p = progress[g.id] ?? null
            return (
              <Pressable
                key={g.id}
                accessibilityRole="button"
                onPress={() => router.push(goalHref(g.id))}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  padding: space.md,
                  borderRadius: radius.card,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.cardRim,
                  opacity: pressed ? 0.88 : 1,
                })}
              >
                <Icon name={SHARED_GOAL_METRIC_ICON[g.metrica]} size={24} color={colors.ink} />
                <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {g.titulo}
                  </Text>
                  <Text variant="caption" muted numberOfLines={1}>
                    {sharedGoalAlvoLabel(g)}
                  </Text>
                  {p ? (
                    <Text variant="caption" numberOfLines={1}>
                      {sharedGoalHeadline(p)}
                    </Text>
                  ) : null}
                </View>
                {p?.exibicao === 'faixas' ? <GoalProgressVisual progress={p} compact /> : null}
                <Icon name="chevron-forward" size={18} color={colors.inkMuted} />
              </Pressable>
            )
          })}

          {encerradas.length > 0 ? (
            <View style={{ gap: space.sm }}>
              <Text variant="label" muted>
                Encerradas
              </Text>
              {encerradas.map((g) => (
                <Pressable key={g.id} onPress={() => router.push(goalHref(g.id))} accessibilityRole="button">
                  <Card tone="inset">
                    <Text variant="body" muted>
                      {g.titulo}
                    </Text>
                  </Card>
                </Pressable>
              ))}
            </View>
          ) : null}

          <PrimaryButton label="Meu Círculo" variant="ghost" icon="people-outline" onPress={() => router.push(AMIGOS_HREF)} />
        </View>
      )}
    </Screen>
  )
}
