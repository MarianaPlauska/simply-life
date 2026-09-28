import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, Share, Switch, TextInput, View } from 'react-native'
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router'
import {
  SHARED_GOAL_CHEERS,
  SHARED_GOAL_MAX_MEMBERS,
  localTodayIso,
  sharedGoalAlvoLabel,
  sharedGoalCheerLabel,
  sharedGoalCycle,
  sharedGoalEndSummary,
  sharedGoalHeadline,
  sharedGoalMetricaSpec,
  suggestNextAlvo,
  type SharedGoalCheerKey,
} from '@simply-life/shared'
import { Screen, Text, Card, PrimaryButton, Icon } from '../../src/ui'
import { StackHeader } from '../../src/components/layout/StackHeader'
import { GoalMembersRow, GoalProgressVisual } from '../../src/components/sharedGoals/GoalVisual'
import { GuestGoalsState } from '../../src/components/sharedGoals/GuestGoalsState'
import { SHARED_GOAL_METRIC_ICON } from '../../src/components/sharedGoals/metricIcon'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useAuthStore } from '../../src/store/authStore'
import { useSharedGoalsStore } from '../../src/store/sharedGoalsStore'
import { confirmDestructive } from '../../src/lib/confirmDestructive'
import {
  createGoalInvite,
  fetchMyEntries,
  sendSharedGoalCheer,
  upsertMyEntries,
} from '../../src/lib/sync/sharedGoals'
import { METAS_HREF } from '../../src/lib/sharedGoalRoutes'

function fmt(n: number): string
{
  const r = Math.round(n * 10) / 10
  return Number.isInteger(r) ? String(r) : String(r).replace('.', ',')
}

function whenLabel(iso: string): string
{
  const d = new Date(iso)
  const today = localTodayIso()
  const day = localTodayIso(d)
  const hh = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return day === today ? `hoje, ${hh}` : d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

export default function MetaDetailScreen()
{
  const { colors, space, radius } = useTheme()
  const router = useRouter()
  const { id, convidar } = useLocalSearchParams<{ id: string; convidar?: string }>()
  const goalId = String(id ?? '')
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const goal = useSharedGoalsStore((s) => s.goals.find((g) => g.id === goalId) ?? null)
  const loaded = useSharedGoalsStore((s) => s.loaded)
  const membership = useSharedGoalsStore((s) => s.memberships[goalId] ?? null)
  const progress = useSharedGoalsStore((s) => s.progress[goalId] ?? null)
  const members = useSharedGoalsStore((s) => s.members[goalId] ?? [])
  const cheers = useSharedGoalsStore((s) => s.cheers[goalId] ?? [])
  const load = useSharedGoalsStore((s) => s.load)
  const loadDetail = useSharedGoalsStore((s) => s.loadDetail)
  const setMuted = useSharedGoalsStore((s) => s.setMuted)
  const leave = useSharedGoalsStore((s) => s.leave)

  const [refreshing, setRefreshing] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [inviteBusy, setInviteBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [cheerNote, setCheerNote] = useState<string | null>(null)
  const [cheerBusy, setCheerBusy] = useState<SharedGoalCheerKey | null>(null)
  const [mine, setMine] = useState<Record<string, number>>({})
  const [todayTxt, setTodayTxt] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const today = localTodayIso()
  const cycle = useMemo(() => (goal ? sharedGoalCycle(goal, today) : null), [goal, today])

  const reload = useCallback(async () =>
  {
    if (isGuest || !goalId) return
    setRefreshing(true)
    if (!useSharedGoalsStore.getState().loaded) await load()
    await loadDetail(goalId)
    setRefreshing(false)
  }, [goalId, isGuest, load, loadDetail])

  useEffect(() =>
  {
    void reload()
  }, [reload])

  useEffect(() =>
  {
    if (!goal || !cycle || isGuest) return
    void fetchMyEntries(goal.id, cycle.start, cycle.end).then(setMine)
  }, [goal, cycle, isGuest, progress])

  const makeInvite = useCallback(async () =>
  {
    if (!goalId) return
    setInviteBusy(true)
    setNote(null)
    const r = await createGoalInvite(goalId)
    setInviteBusy(false)
    if (!r.ok || !r.url)
    {
      setNote(r.message ?? 'Não deu para gerar o convite agora')
      return
    }
    setInviteUrl(r.url)
    try
    {
      await Share.share({
        message: `Bora fazer uma meta juntos no Simply Life? Ninguém vê o número de ninguém. ${r.url} (código ${r.code})`,
        url: r.url,
      })
    }
    catch
    {
      /* fechou o compartilhar */
    }
  }, [goalId])

  useEffect(() =>
  {
    if (convidar === '1' && goal && !inviteUrl && !inviteBusy) void makeInvite()
    // só na chegada da criação
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convidar, goal?.id])

  if (!userId) return <Redirect href="/login" />

  if (isGuest)
  {
    return (
      <Screen scroll tabBarInset={false}>
        <StackHeader title="Metas juntos" />
        <GuestGoalsState />
      </Screen>
    )
  }

  if (!goal)
  {
    return (
      <Screen scroll tabBarInset={false}>
        <StackHeader title="Meta" />
        <Card>
          <Text variant="body" muted>
            {loaded ? 'Esta meta não está mais com você. Pode ter sido encerrada ou você saiu.' : 'Carregando…'}
          </Text>
        </Card>
      </Screen>
    )
  }

  const spec = sharedGoalMetricaSpec(goal.metrica)
  const unit = goal.unidade || spec.unidade
  const active = goal.status === 'ativa' && !progress?.ended
  const myCycleTotal = Object.values(mine).reduce((a, b) => a + b, 0)
  const myToday = mine[today] ?? 0
  const nameOf = (uid: string) =>
  {
    const m = members.find((x) => x.userId === uid)
    if (!m) return 'Alguém'
    return m.isMe ? 'Você' : m.displayName
  }

  const saveToday = async () =>
  {
    const v = Number((todayTxt ?? '').replace(',', '.'))
    if (!Number.isFinite(v) || v < 0) return
    setSaving(true)
    const ok = await upsertMyEntries(goal.id, { [today]: v })
    setSaving(false)
    if (ok)
    {
      setMine((cur) => ({ ...cur, [today]: v }))
      setTodayTxt(null)
      void useSharedGoalsStore.getState().refreshProgress(goal.id)
    }
  }

  const cheer = async (key: SharedGoalCheerKey) =>
  {
    setCheerBusy(key)
    const r = await sendSharedGoalCheer(goal.id, key)
    setCheerBusy(null)
    setCheerNote(r.ok ? 'Apoio enviado' : r.message ?? 'Não deu para enviar agora')
    if (r.ok) void loadDetail(goal.id)
  }

  const dayLine = !progress
    ? null
    : progress.notStarted
      ? 'Começa em breve'
      : goal.ciclo === 'semanal'
        ? `Dia ${progress.daysElapsed} de ${progress.daysTotal} desta semana`
        : `Dia ${progress.daysElapsed} de ${progress.daysTotal}`

  return (
    <Screen scroll tabBarInset={false} refreshing={refreshing} onRefresh={() => void reload()}>
      <StackHeader title={goal.titulo} subtitle={sharedGoalAlvoLabel(goal)} />

      <View style={{ gap: space.md }}>
        <Card tone="hero" style={{ alignItems: 'center', gap: space.md, paddingVertical: space.xl }}>
          <GoalProgressVisual progress={progress} />
          {progress ? (
            <>
              <Text variant="voice" style={{ textAlign: 'center' }}>
                {progress.ended && progress.faixa != null ? sharedGoalEndSummary(progress.faixa) : sharedGoalHeadline(progress)}
              </Text>
              {dayLine ? (
                <Text variant="caption" muted>
                  {dayLine}
                </Text>
              ) : null}
            </>
          ) : (
            <Text variant="caption" muted>
              Carregando o caminho juntos…
            </Text>
          )}
          {progress?.ended && progress.faixa != null ? (
            <Text variant="caption" muted style={{ textAlign: 'center' }}>
              Para a próxima, que tal {fmt(suggestNextAlvo(goal.alvo, progress.faixa))} {unit}?
            </Text>
          ) : null}
        </Card>

        <Card style={{ gap: space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <GoalMembersRow members={members} />
            <Text variant="caption" muted style={{ flex: 1 }}>
              {members.length <= 1 ? 'Só você por enquanto' : `${members.length} pessoas`}
            </Text>
          </View>
          {active && members.length < SHARED_GOAL_MAX_MEMBERS ? (
            <PrimaryButton
              label="Chamar alguém"
              icon="person-add-outline"
              variant={members.length <= 1 ? 'primary' : 'secondary'}
              loading={inviteBusy}
              onPress={() => void makeInvite()}
            />
          ) : null}
          {inviteUrl ? (
            <Text variant="caption" muted selectable>
              {inviteUrl}
            </Text>
          ) : null}
          {note ? (
            <Text variant="caption" muted>
              {note}
            </Text>
          ) : null}
        </Card>

        {goal.metrica === 'livre' ? (
          <Card style={{ gap: space.sm }}>
            <Text variant="section">Registrar hoje</Text>
            <Text variant="caption" muted>
              Quanto de {unit} você fez hoje. Só você vê este número.
            </Text>
            <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
              <TextInput
                value={todayTxt ?? (myToday ? fmt(myToday) : '')}
                onChangeText={(t) => setTodayTxt(t.replace(/[^0-9.,]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.inkFaint}
                accessibilityLabel={`Hoje, em ${unit}`}
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: radius.control,
                  backgroundColor: colors.elevated,
                  color: colors.ink,
                  paddingHorizontal: space.md,
                  fontFamily: 'Lexend_500Medium',
                  fontSize: 18,
                }}
              />
              <PrimaryButton
                label="Registrar"
                loading={saving}
                disabled={todayTxt == null || !active}
                onPress={() => void saveToday()}
              />
            </View>
          </Card>
        ) : (
          <Card tone="inset" style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
            <Icon name={SHARED_GOAL_METRIC_ICON[goal.metrica]} size={20} color={colors.inkMuted} />
            <Text variant="caption" muted style={{ flex: 1 }}>
              Conta sozinho o que você já anota no app.
              {myCycleTotal > 0 ? ` Sua parte ${goal.ciclo === 'semanal' ? 'nesta semana' : 'até aqui'}: ${fmt(myCycleTotal)} ${unit}. Só você vê.` : ''}
            </Text>
          </Card>
        )}

        {members.length > 1 ? (
          <Card style={{ gap: space.sm }}>
            <Text variant="section">Mandar apoio</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {SHARED_GOAL_CHEERS.map((c) => (
                <Pressable
                  key={c.key}
                  accessibilityRole="button"
                  disabled={cheerBusy != null}
                  onPress={() => void cheer(c.key)}
                  style={({ pressed }) => ({
                    minHeight: 40,
                    paddingHorizontal: 14,
                    borderRadius: radius.pill,
                    justifyContent: 'center',
                    backgroundColor: colors.elevated,
                    opacity: pressed || cheerBusy === c.key ? 0.7 : 1,
                  })}
                >
                  <Text variant="label">{c.label}</Text>
                </Pressable>
              ))}
            </View>
            {cheerNote ? (
              <Text variant="caption" muted>
                {cheerNote}
              </Text>
            ) : null}
            {cheers.slice(0, 6).map((c) => (
              <View key={c.id} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
                <Icon name="heart-outline" size={16} color={colors.inkMuted} />
                <Text variant="caption" style={{ flex: 1 }}>
                  {nameOf(c.fromUser)}: {sharedGoalCheerLabel(c.presetKey)}
                </Text>
                <Text variant="micro" muted>
                  {whenLabel(c.createdAt)}
                </Text>
              </View>
            ))}
          </Card>
        ) : null}

        <Card style={{ gap: space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Icon name="volume-mute-outline" size={20} color={colors.inkMuted} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Silenciar</Text>
              <Text variant="caption" muted>
                Sem avisos desta meta. Ninguém fica sabendo.
              </Text>
            </View>
            <Switch
              value={Boolean(membership?.muted)}
              onValueChange={(v) => void setMuted(goal.id, v)}
              trackColor={{ true: colors.brand, false: colors.hairlineStrong }}
            />
          </View>
          <PrimaryButton
            label="Sair da meta"
            variant="ghost"
            onPress={() =>
              confirmDestructive(
                'Sair desta meta?',
                'Ninguém é avisado. Sua parte sai do pote e você pode voltar por um convite novo.',
                () =>
                {
                  void leave(goal.id).then((ok) =>
                  {
                    if (ok) router.replace(METAS_HREF)
                  })
                },
                'Sair',
              )}
          />
        </Card>
      </View>
    </Screen>
  )
}
