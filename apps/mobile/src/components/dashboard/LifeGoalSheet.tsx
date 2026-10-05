import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import {
  LIFE_GOAL_TEMPLATES,
  LIFE_GOALS_MAX,
  activeLifeGoals,
  addDaysIso,
  lifeGoalDueLabel,
  lifeGoalCheer,
  lifeGoalMicroLabel,
  lifeGoalProgress,
  lifeGoalTimeLabel,
  lifeGoalToggleFeita,
  lifeGoalTogglePasso,
  localTodayIso,
  type LifeGoal,
  type LifeGoalCadence,
  type LifeGoalCategory,
} from '@simply-life/shared'
import { Card, Text, Field, PrimaryButton, Chip, CloseButton } from '../../ui'
import { Icon } from '../../ui/Icon'
import { useTheme } from '../../theme/ThemeProvider'
import { usePrefsStore } from '../../store/prefsStore'
import { hapticLight, hapticRestDone } from '../../lib/haptics'

type Props = {
  visible: boolean
  onClose: () => void
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/

function endOfMonthIso(today: string): string
{
  const [y, m] = today.split('-').map(Number)
  return `${today.slice(0, 7)}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
}

function newId(): string
{
  return `lg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

/** Definir metas: várias de uma vez, por semana, mês ou até um dia exato. */
export function LifeGoalSheet({ visible, onClose }: Props)
{
  const { colors, space } = useTheme()
  const prefs = usePrefsStore((s) => s.prefs)
  const patch = usePrefsStore((s) => s.patch)
  const [goals, setGoals] = useState<LifeGoal[]>([])
  const [category, setCategory] = useState<LifeGoalCategory>('custom')
  const [title, setTitle] = useState('')
  const [cadence, setCadence] = useState<LifeGoalCadence>('week')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // ao abrir: começa pelas metas que ainda valem
  useEffect(() =>
  {
    if (!visible) return
    setGoals(activeLifeGoals(prefs.life_goals, prefs.life_goal).map((g) => ({ ...g, id: g.id ?? newId() })))
    setTitle('')
    setCategory('custom')
    setCadence('week')
    setDueDate('')
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  if (!visible) return null

  const today = localTodayIso()
  const template = LIFE_GOAL_TEMPLATES.find((t) => t.id === category)
  const full = goals.length >= LIFE_GOALS_MAX
  const pendingText = Boolean(title.trim())

  /** Meta do formulário, ou o motivo de não dar para usar ainda. */
  const draft = (): { goal: LifeGoal | null; error: string | null } =>
  {
    const trimmed = title.trim()
    if (!trimmed) return { goal: null, error: null }
    if (cadence === 'date')
    {
      if (!ISO_RE.test(dueDate)) return { goal: null, error: 'Escolha o dia da meta (AAAA-MM-DD).' }
      if (dueDate < today) return { goal: null, error: 'O dia da meta já passou.' }
    }
    return {
      goal: {
        id: newId(),
        title: trimmed,
        category,
        cadence,
        periodStart: today,
        ...(cadence === 'date' ? { dueDate } : {}),
      },
      error: null,
    }
  }

  const addToList = () =>
  {
    const d = draft()
    if (d.error) return setError(d.error)
    if (!d.goal) return
    if (full) return setError(`Até ${LIFE_GOALS_MAX} metas ao mesmo tempo.`)
    setGoals([...goals, d.goal])
    setTitle('')
    setError(null)
  }

  const onSave = async () =>
  {
    // o que ficou escrito no formulário também entra, sem precisar tocar em "Adicionar"
    const d = draft()
    if (d.error) return setError(d.error)
    const list = d.goal && !full ? [...goals, d.goal] : goals
    setSaving(true)
    await patch({ life_goals: list, life_goal: list[0] ?? null })
    setSaving(false)
    onClose()
  }

  const total = goals.length + (pendingText ? 1 : 0)

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '92%' }}>
          <Card
            tone="elevated"
            style={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: space.xl,
              gap: space.md,
              // a ficha encolhe até a altura da tela; o conteúdo rola e o botão de salvar fica sempre à vista
              flexShrink: 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text variant="section" style={{ flex: 1 }}>Suas metas</Text>
              <CloseButton onPress={onClose} label="Fechar metas" size={32} />
            </View>
            <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} contentContainerStyle={{ gap: space.md }} keyboardShouldPersistTaps="handled">
              <Text variant="caption" muted>
                Por semana, por mês ou até um dia exato. Dá para ter até {LIFE_GOALS_MAX} ao mesmo tempo.
              </Text>

              {goals.length ? (
                <View style={{ gap: 8 }}>
                  <Text variant="label" muted>Na lista ({goals.length} de {LIFE_GOALS_MAX})</Text>
                  {goals.map((g) => (
                    <View
                      key={g.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        backgroundColor: colors.canvas,
                      }}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text variant="bodyStrong" style={{ fontSize: 14 }} numberOfLines={2}>{g.title}</Text>
                        <Text variant="micro" muted>
                          {LIFE_GOAL_TEMPLATES.find((t) => t.id === g.category)?.label ?? 'Personalizada'} · {lifeGoalDueLabel(g)}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => setGoals(goals.filter((x) => x.id !== g.id))}
                        accessibilityRole="button"
                        accessibilityLabel={`Tirar a meta ${g.title}`}
                        hitSlop={8}
                        style={{ minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Icon name="close" size={18} color={colors.inkMuted} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}

              {full ? (
                <Text variant="caption" muted>
                  Lista cheia. Tire uma meta para colocar outra.
                </Text>
              ) : (
                <View style={{ gap: space.md }}>
                  <Text variant="label" muted>{goals.length ? 'Mais uma meta' : 'Nova meta'}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    {LIFE_GOAL_TEMPLATES.map((t) => (
                      <Chip
                        key={t.id}
                        label={t.label}
                        active={category === t.id}
                        onPress={() => setCategory(t.id)}
                      />
                    ))}
                  </View>
                  {/* fundo da tela por baixo do cartão: a caixa de texto aparece nos dois modos */}
                  <Field
                    tone="widget"
                    label="O que você quer alcançar"
                    placeholder={template?.example ?? 'O que importa para você agora'}
                    value={title}
                    onChangeText={(v) =>
                    {
                      setTitle(v)
                      setError(null)
                    }}
                    multiline
                    style={{ minHeight: 88 }}
                  />

                  <Text variant="label" muted>Até quando</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    <Chip label="Esta semana" active={cadence === 'week'} onPress={() => setCadence('week')} />
                    <Chip label="Este mês" active={cadence === 'month'} onPress={() => setCadence('month')} />
                    <Chip
                      label="Até um dia"
                      active={cadence === 'date'}
                      onPress={() =>
                      {
                        setCadence('date')
                        if (!dueDate) setDueDate(addDaysIso(today, 7))
                      }}
                    />
                  </View>
                  {cadence === 'date' ? (
                    <View style={{ gap: 8 }}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                        <Chip label="Amanhã" active={dueDate === addDaysIso(today, 1)} onPress={() => setDueDate(addDaysIso(today, 1))} />
                        <Chip label="Em 7 dias" active={dueDate === addDaysIso(today, 7)} onPress={() => setDueDate(addDaysIso(today, 7))} />
                        <Chip label="Em 15 dias" active={dueDate === addDaysIso(today, 15)} onPress={() => setDueDate(addDaysIso(today, 15))} />
                        <Chip label="Fim do mês" active={dueDate === endOfMonthIso(today)} onPress={() => setDueDate(endOfMonthIso(today))} />
                      </View>
                      <Field
                        tone="widget"
                        label="Dia (AAAA-MM-DD)"
                        placeholder={addDaysIso(today, 7)}
                        value={dueDate}
                        onChangeText={(v) =>
                        {
                          setDueDate(v.trim())
                          setError(null)
                        }}
                      />
                    </View>
                  ) : null}

                  <PrimaryButton
                    label="Adicionar à lista"
                    variant="secondary"
                    icon="add"
                    disabled={!pendingText}
                    onPress={addToList}
                  />
                </View>
              )}

            </ScrollView>

            {error ? <Text variant="caption" color={colors.danger}>{error}</Text> : null}

            <PrimaryButton
              label={total > 1 ? 'Salvar metas' : 'Salvar meta'}
              loading={saving}
              disabled={!total && !prefs.life_goals?.length && !prefs.life_goal}
              onPress={() => void onSave()}
            />
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

/**
 * Metas na Home. Sem meta: o atalho "Defina sua meta". Com metas: cada uma com o tempo
 * em tom calmo, uma frase de orgulho que cresce com os passos e os botões
 * "Avancei hoje" e "Cheguei lá". Nada em vermelho, nada de "atrasada" ou "falhou".
 */
export function LifeGoalMicroLine({ onPress }: { onPress: () => void })
{
  const { colors } = useTheme()
  const legacy = usePrefsStore((s) => s.prefs.life_goal)
  const list = usePrefsStore((s) => s.prefs.life_goals)
  const patch = usePrefsStore((s) => s.patch)
  const active = activeLifeGoals(list, legacy)

  if (!active.length)
  {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={lifeGoalMicroLabel(null)}
        accessibilityHint="Abre a definição das suas metas"
        style={{
          alignSelf: 'flex-start',
          maxWidth: '100%',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 10,
          backgroundColor: colors.elevated,
          borderWidth: 1,
          borderColor: colors.hairline,
        }}
      >
        <Text variant="micro" style={{ color: colors.axel, fontWeight: '600' }} numberOfLines={1}>
          {lifeGoalMicroLabel(null)}
        </Text>
      </Pressable>
    )
  }

  // a mudança vale para a lista inteira; metas antigas ganham id na primeira vez
  const update = (target: LifeGoal, next: LifeGoal) =>
  {
    const goals = active.map((g) => (g === target ? next : g)).map((g) => ({ ...g, id: g.id ?? `lg-${g.periodStart}-${g.title.length}` }))
    void patch({ life_goals: goals, life_goal: goals[0] ?? null })
  }

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text variant="micro" style={{ flex: 1, color: colors.featureMuted, fontWeight: '600' }}>
          {active.length === 1 ? 'Sua meta' : `Suas ${active.length} metas`}
        </Text>
        <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8} style={{ minHeight: 32, justifyContent: 'center' }}>
          <Text variant="micro" style={{ color: colors.axel, fontWeight: '700' }}>Editar</Text>
        </Pressable>
      </View>
      {active.map((g, i) => (
        <LifeGoalRow key={g.id ?? `${g.periodStart}-${i}`} goal={g} seed={i} onChange={(next) => update(g, next)} />
      ))}
    </View>
  )
}

function LifeGoalRow({ goal, seed, onChange }: { goal: LifeGoal; seed: number; onChange: (g: LifeGoal) => void })
{
  const { colors } = useTheme()
  const p = lifeGoalProgress(goal)
  const pill = (active: boolean) => ({
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    borderWidth: 1,
    borderColor: active ? colors.health : colors.hairlineStrong,
    backgroundColor: active ? colors.healthMuted : 'transparent',
  })

  return (
    <View
      style={{
        gap: 6,
        padding: 12,
        borderRadius: 14,
        backgroundColor: p.feita ? colors.healthMuted : colors.elevated,
        borderWidth: 1,
        borderColor: p.feita ? colors.health : colors.cardRim,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        {p.feita ? <Icon name="checkmark-circle" size={18} color={colors.health} /> : null}
        <Text variant="bodyStrong" style={{ flex: 1, fontSize: 14 }} numberOfLines={2}>{goal.title}</Text>
      </View>
      <Text variant="micro" muted>{lifeGoalTimeLabel(p)}</Text>
      <Text variant="caption" style={{ color: p.feita ? colors.health : colors.featureInk }}>
        {lifeGoalCheer(p, seed)}
      </Text>
      {!p.feita ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 2 }}>
          <Pressable
            onPress={() =>
            {
              if (!p.passoHoje) hapticLight()
              onChange(lifeGoalTogglePasso(goal))
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: p.passoHoje }}
            accessibilityLabel={p.passoHoje ? 'Passo de hoje anotado. Toque para desfazer' : 'Avancei hoje'}
            style={pill(p.passoHoje)}
          >
            {p.passoHoje ? <Icon name="checkmark" size={14} color={colors.health} /> : null}
            <Text variant="micro" style={{ fontWeight: '600', color: p.passoHoje ? colors.health : colors.ink }}>
              {p.passoHoje ? 'Passo de hoje anotado' : 'Avancei hoje'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() =>
            {
              hapticRestDone()
              onChange(lifeGoalToggleFeita(goal))
            }}
            accessibilityRole="button"
            accessibilityLabel="Cheguei lá"
            style={pill(false)}
          >
            <Text variant="micro" style={{ fontWeight: '600', color: colors.ink }}>Cheguei lá</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={() => onChange(lifeGoalToggleFeita(goal))} accessibilityRole="button" hitSlop={8} style={{ alignSelf: 'flex-start', minHeight: 28, justifyContent: 'center' }}>
          <Text variant="micro" muted>Desfazer</Text>
        </Pressable>
      )}
    </View>
  )
}
