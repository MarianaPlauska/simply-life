import { useEffect } from 'react'
import { Pressable, Share, Switch, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  GOAL_CARE_LABEL,
  formatDuration,
  formatWaitAge,
  sharedGoalHeadline,
  waitReasonPhrase,
  type CircleFriendSummary,
  type CircleGoalItem,
} from '@simply-life/shared'
import { Screen, Text, Card, PrimaryButton, EmptyState, Icon } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { PersonAvatar } from '../src/components/social/PersonAvatar'
import { SHARED_GOAL_METRIC_ICON } from '../src/components/sharedGoals/metricIcon'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { useActivityStore } from '../src/store/activityStore'
import { useCircleStore } from '../src/store/circleStore'
import { useSharedGoalsStore } from '../src/store/sharedGoalsStore'
import { useTaskWaitStore } from '../src/store/taskWaitStore'
import { useCircleOverview } from '../src/hooks/useCircleOverview'
import { usePrefsStore } from '../src/store/prefsStore'
import { minutesToLabel } from '@simply-life/shared'
import { AMIGOS_HREF, METAS_HREF, goalHref } from '../src/lib/sharedGoalRoutes'

/** Uma meta: ícone da métrica, título e o progresso do grupo (nunca número por pessoa). */
function GoalLine({ item, onPress, last }: { item: CircleGoalItem; onPress: () => void; last?: boolean })
{
  const { colors } = useTheme()
  const care = item.care
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Meta ${item.goal.titulo}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 48,
        paddingVertical: 8,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.hairline,
      }}
    >
      <Icon
        name={SHARED_GOAL_METRIC_ICON[item.goal.metrica]}
        size={18}
        color={care ? colors.attention : colors.brand}
      />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text variant="body" numberOfLines={1}>
          {item.goal.titulo}
        </Text>
        <Text variant="caption" style={{ color: care ? colors.attention : colors.inkMuted }}>
          {care ? GOAL_CARE_LABEL[care] : item.progress ? sharedGoalHeadline(item.progress) : 'Carregando o progresso'}
        </Text>
      </View>
      <Icon name="chevron-forward" size={16} color={colors.inkMuted} />
    </Pressable>
  )
}

function FriendCardBlock({ s }: { s: CircleFriendSummary })
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const nudge = useTaskWaitStore((st) => st.nudge)
  const finish = useTaskWaitStore((st) => st.finish)

  const parts: string[] = []
  if (s.goals.length) parts.push(`${s.goals.length} meta${s.goals.length === 1 ? '' : 's'} juntos`)
  if (s.waiting.length) parts.push(`${s.waiting.length} tarefa${s.waiting.length === 1 ? '' : 's'} esperando`)
  const summary = parts.length ? parts.join(' · ') : 'Nada em comum agora'

  return (
    <Card style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <PersonAvatar name={s.friend.displayName} accent={s.friend.accent} avatarStyle={s.friend.avatarStyle} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {s.friend.displayName}
          </Text>
          <Text variant="caption" muted>
            {summary}
          </Text>
        </View>
        {s.attention > 0 ? (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: colors.attentionMuted,
            }}
          >
            <Text variant="caption" style={{ color: colors.attention, fontWeight: '600', fontSize: 12 }}>
              {s.attention} pede atenção
            </Text>
          </View>
        ) : null}
      </View>

      {s.goals.length > 0 ? (
        <View>
          {s.goals.map((g, i) => (
            <GoalLine
              key={g.goal.id}
              item={g}
              last={i === s.goals.length - 1}
              onPress={() => router.push(goalHref(g.goal.id))}
            />
          ))}
        </View>
      ) : null}

      {s.waiting.length > 0 ? (
        <View style={{ gap: 12 }}>
          <Text variant="caption" muted>
            Tarefas esperando {s.friend.displayName}
          </Text>
          {s.waiting.map(({ wait, task, days, nudge: late }) => (
            <View key={wait.id} style={{ gap: 6 }}>
              <Pressable
                onPress={() => task && router.push(`/task/${task.id}?aba=espera`)}
                accessibilityRole="button"
                style={{ gap: 2 }}
              >
                <Text variant="body" numberOfLines={2}>
                  {task?.titulo ?? 'Tarefa'}
                </Text>
                <Text variant="caption" style={{ color: late ? colors.attention : colors.inkMuted }}>
                  Para {waitReasonPhrase(wait.motivo)} · {formatWaitAge(days)}
                  {wait.cobrancas.length ? ` · ${wait.cobrancas.length}x cobrado` : ''}
                </Text>
              </Pressable>
              <View style={{ flexDirection: 'row', gap: space.md }}>
                <PrimaryButton label="Cobrei agora" variant="link" size="sm" onPress={() => nudge(wait.id)} />
                <PrimaryButton label="Já voltou" variant="link" size="sm" onPress={() => finish(wait.id)} />
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {s.waitCount > 0 ? (
        <Text variant="caption" muted>
          Últimos 30 dias: {formatDuration(s.waitMs)} esperando, em {s.waitCount} pedido{s.waitCount === 1 ? '' : 's'}
          {s.cobrancas ? `, ${s.cobrancas} cobrança${s.cobrancas === 1 ? '' : 's'}` : ''}.
        </Text>
      ) : null}
    </Card>
  )
}

/** Cantinho do perfil: sua chama, metas juntos e o que espera por cada amigo. */
export default function JuntosScreen()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const hydrateActivity = useActivityStore((s) => s.hydrate)
  const reloadFriends = useCircleStore((s) => s.load)
  const reloadGoals = useSharedGoalsStore((s) => s.load)
  const overview = useCircleOverview()
  const friends = useCircleStore((s) => s.friends)
  const shareFocus = usePrefsStore((s) => Boolean(s.prefs.share_focus_status))
  const patchPrefs = usePrefsStore((s) => s.patch)
  const focusingNow = friends.filter((f) => f.focandoAte && new Date(f.focandoAte).getTime() > Date.now())

  const inviteFocus = async (name: string) =>
  {
    try
    {
      await Share.share({
        message: `${name}, bora focar junto agora? Eu abro o timer no SunFy e a gente se fala no fim.`,
      })
    }
    catch
    {
      /* a pessoa fechou o compartilhar */
    }
  }

  useEffect(() =>
  {
    hydrateActivity()
  }, [hydrateActivity])

  // status de foco dos amigos muda rápido: ao abrir, busca de novo
  useEffect(() =>
  {
    void reloadFriends(true)
  }, [reloadFriends])

  const waitingTotal = overview.friends.reduce((n, f) => n + f.waiting.length, 0)

  return (
    <Screen
      scroll
      tabBarInset={false}
      refreshing={overview.loading}
      onRefresh={() =>
      {
        void reloadFriends(true)
        void reloadGoals()
      }}
    >
      <StackHeader title="Juntos" subtitle="Quem caminha com você e o que vocês fazem juntos" />

      <View style={{ gap: space.md }}>
        {/* o elo é pessoal (qualquer ação do dia conta): mora na Home, não aqui */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.md }}>
          <PrimaryButton
            label="Ligas"
            variant="link"
            size="sm"
            icon="people-outline"
            onPress={() => router.push('/ligas' as never)}
          />
          <PrimaryButton
            label="Álbum e prêmios"
            variant="link"
            size="sm"
            icon="gift-outline"
            onPress={() => router.push('/colecao' as never)}
          />
          <PrimaryButton
            label="Desbloqueios"
            variant="link"
            size="sm"
            icon="trophy-outline"
            onPress={() => router.push('/desbloqueios' as never)}
          />
        </View>

        {isGuest ? (
          <Card>
            <EmptyState
              icon="people-outline"
              title="Metas juntos precisam de uma conta"
              body="No modo convidado tudo fica neste aparelho. Com uma conta você chama amigos e vê aqui o progresso de vocês."
            />
            <PrimaryButton label="Criar conta ou entrar" style={{ alignSelf: 'center' }} onPress={() => router.push('/login')} />
          </Card>
        ) : (
          <>
            {overview.goalsNeedingCare.length > 0 ? (
              <Card style={{ gap: space.sm }}>
                <View style={{ gap: 2 }}>
                  <Text variant="section">Pede um empurrãozinho</Text>
                  <Text variant="caption" muted>
                    Metas do grupo abaixo do ritmo. Semana vale mais que dia, e ninguém paga pela falha do outro.
                  </Text>
                </View>
                <View>
                  {overview.goalsNeedingCare.map((g, i) => (
                    <GoalLine
                      key={g.goal.id}
                      item={g}
                      last={i === overview.goalsNeedingCare.length - 1}
                      onPress={() => router.push(goalHref(g.goal.id))}
                    />
                  ))}
                </View>
              </Card>
            ) : overview.activeGoals > 0 ? (
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <Icon name="checkmark-circle-outline" size={20} color={colors.brand} />
                <Text variant="body" style={{ flex: 1 }}>
                  {overview.activeGoals === 1 ? 'A meta juntos está no ritmo.' : `As ${overview.activeGoals} metas juntos estão no ritmo.`}
                </Text>
              </Card>
            ) : null}

            <Card style={{ gap: space.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <Icon name="timer-outline" size={20} color={colors.brand} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="section">Foco junto</Text>
                  <Text variant="caption" muted>
                    Cada um na sua tarefa, no mesmo horário. Sem ranking e sem ver o que o outro faz.
                  </Text>
                </View>
              </View>
              {focusingNow.length > 0 ? (
                focusingNow.map((f) => (
                  <View key={f.userId} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <PersonAvatar name={f.displayName} accent={f.accent} avatarStyle={f.avatarStyle} size={32} />
                    <Text variant="body" style={{ flex: 1 }}>
                      {f.displayName} está focando até{' '}
                      {minutesToLabel(new Date(f.focandoAte!).getHours() * 60 + new Date(f.focandoAte!).getMinutes())}
                    </Text>
                    <PrimaryButton label="Focar junto" size="sm" onPress={() => router.push('/foco' as never)} />
                  </View>
                ))
              ) : (
                <Text variant="caption" muted>
                  Ninguém do Círculo está focando agora.
                </Text>
              )}
              {friends.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
                  {friends.slice(0, 4).map((f) => (
                    <PrimaryButton
                      key={f.userId}
                      label={`Chamar ${f.displayName.split(' ')[0]}`}
                      variant="link"
                      size="sm"
                      icon="send-outline"
                      onPress={() => void inviteFocus(f.displayName.split(' ')[0]!)}
                    />
                  ))}
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <Text variant="caption" muted style={{ flex: 1 }}>
                  Mostrar aos amigos quando eu estiver focando (só o horário de término)
                </Text>
                <Switch
                  value={shareFocus}
                  onValueChange={(v) => void patchPrefs({ share_focus_status: v })}
                  accessibilityLabel="Mostrar aos amigos quando eu estiver focando"
                  trackColor={{ true: colors.axelFill, false: colors.hairline }}
                />
              </View>
            </Card>

            {waitingTotal > 0 ? (
              <Text variant="caption" muted>
                {waitingTotal} tarefa{waitingTotal === 1 ? '' : 's'} esperando alguém do Círculo
              </Text>
            ) : null}

            {overview.friends.length === 0 && !overview.loading ? (
              <Card>
                <EmptyState
                  icon="people-outline"
                  title="Ninguém no Círculo ainda"
                  body="Chame alguém para fazer metas juntos, como beber água na semana ou treinar."
                />
              </Card>
            ) : null}

            {overview.friends.map((s) => (
              <FriendCardBlock key={s.friend.userId} s={s} />
            ))}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.md }}>
              <PrimaryButton label="Metas juntos" variant="link" size="sm" onPress={() => router.push(METAS_HREF)} />
              <PrimaryButton label="Amigos e convites" variant="link" size="sm" onPress={() => router.push(AMIGOS_HREF)} />
              <PrimaryButton
                label="Relatório de esperas"
                variant="link"
                size="sm"
                onPress={() => router.push('/kanban?relatorio=esperas' as never)}
              />
            </View>
          </>
        )}
      </View>
    </Screen>
  )
}
