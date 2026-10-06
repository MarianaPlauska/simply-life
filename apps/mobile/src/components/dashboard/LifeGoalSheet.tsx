import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import {
  LIFE_GOAL_TEMPLATES,
  LIFE_GOALS_MAX,
  MENTAL_PRACTICES,
  lifeGoalPeriodDays,
  practiceGoalTitle,
  activeLifeGoals,
  addDaysIso,
  brDateFromIso,
  isoFromBrDate,
  maskBrDate,
  lifeGoalsPaused,
  lifeGoalsPauseUntil,
  LIFE_GOALS_PAUSE_OPTIONS,
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
  /** o dia como a pessoa escreve: DD/MM/AAAA */
  const [dueText, setDueText] = useState('')
  /** "+": outros prazos e o dia escolhido à mão */
  const [customOpen, setCustomOpen] = useState(false)
  // saúde mental: prática, quantas vezes e o porquê
  const [pratica, setPratica] = useState<string | null>(null)
  const [vezes, setVezes] = useState<number | 'todo'>(3)
  const [porque, setPorque] = useState('')
  /** a pessoa mexeu no texto: não sobrescrever com o título automático */
  const [titleEdited, setTitleEdited] = useState(false)
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
    setDueText('')
    setCustomOpen(false)
    setPratica(null)
    setVezes(3)
    setPorque('')
    setTitleEdited(false)
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  if (!visible) return null

  const today = localTodayIso()
  const template = LIFE_GOAL_TEMPLATES.find((t) => t.id === category)
  const full = goals.length >= LIFE_GOALS_MAX
  const mental = category === 'mental'
  const pendingText = Boolean(title.trim()) || (mental && Boolean(pratica))

  /** quantas vezes, contando "todo dia" como os dias do prazo escolhido */
  const alvoAtual = (): number =>
    vezes === 'todo'
      ? lifeGoalPeriodDays({ cadence, periodStart: today, dueDate: cadence === 'date' ? dueDate : undefined })
      : vezes

  // título automático da prática, enquanto a pessoa não escreve o próprio
  const autoTitle = (nextPratica: string | null, nextVezes: number | 'todo') =>
  {
    if (titleEdited || !nextPratica) return
    const alvo = nextVezes === 'todo' ? 0 : nextVezes
    setTitle(practiceGoalTitle(nextPratica, alvo, nextVezes === 'todo'))
  }

  /** Meta do formulário, ou o motivo de não dar para usar ainda. */
  const draft = (): { goal: LifeGoal | null; error: string | null } =>
  {
    const trimmed = title.trim() || (mental && pratica ? practiceGoalTitle(pratica, alvoAtual(), vezes === 'todo') : '')
    if (!trimmed) return { goal: null, error: null }
    if (cadence === 'date')
    {
      if (!dueDate) return { goal: null, error: 'Escreva o dia da meta como DD/MM/AAAA.' }
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
        ...(mental && pratica ? { pratica, alvo: alvoAtual() } : {}),
        ...(porque.trim() ? { porque: porque.trim() } : {}),
      },
      error: null,
    }
  }

  /** prazo escolhido num atalho: guarda o ISO e mostra no campo como DD/MM/AAAA */
  const pickDue = (iso: string) =>
  {
    setDueDate(iso)
    setDueText(brDateFromIso(iso))
    setError(null)
  }

  const addToList = () =>
  {
    const d = draft()
    if (d.error) return setError(d.error)
    if (!d.goal) return
    if (full) return setError(`Até ${LIFE_GOALS_MAX} metas ao mesmo tempo.`)
    setGoals([...goals, d.goal])
    setTitle('')
    setPratica(null)
    setPorque('')
    setTitleEdited(false)
    setError(null)
  }

  const onSave = async () =>
  {
    // o que ficou escrito no formulário também entra, sem precisar tocar em "Adicionar"
    const d = draft()
    if (d.error) return setError(d.error)
    const list = d.goal && !full ? [...goals, d.goal] : goals
    setSaving(true)
    // meta nova traz a Home de volta, mesmo com as metas em pausa
    await patch({ life_goals: list, life_goal: list[0] ?? null, ...(list.length ? { life_goals_paused_until: null } : {}) })
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
                  {mental ? (
                    <View style={{ gap: space.sm }}>
                      <Text variant="label" muted>Escolha uma prática de cuidado</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {MENTAL_PRACTICES.map((pr) =>
                        {
                          const on = pratica === pr.id
                          return (
                            <Pressable
                              key={pr.id}
                              onPress={() =>
                              {
                                setPratica(pr.id)
                                autoTitle(pr.id, vezes)
                              }}
                              accessibilityRole="button"
                              accessibilityState={{ selected: on }}
                              accessibilityLabel={pr.label}
                              style={{
                                flexGrow: 1,
                                flexBasis: '46%',
                                minHeight: 64,
                                padding: 12,
                                borderRadius: 14,
                                gap: 4,
                                borderWidth: 1,
                                borderColor: on ? colors.health : colors.hairlineStrong,
                                backgroundColor: on ? colors.healthMuted : colors.canvas,
                              }}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Icon name={pr.icon as never} size={18} color={on ? colors.health : colors.inkMuted} />
                                <Text variant="bodyStrong" style={{ flex: 1, fontSize: 13, lineHeight: 18 }}>{pr.label}</Text>
                              </View>
                              <Text variant="micro" muted>{pr.hint}</Text>
                            </Pressable>
                          )
                        })}
                      </View>
                      <Text variant="label" muted>Quantas vezes até o fim do prazo</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                        {([2, 3, 5, 'todo'] as const).map((v) => (
                          <Chip
                            key={String(v)}
                            label={v === 'todo' ? 'Todo dia' : `${v} vezes`}
                            active={vezes === v}
                            onPress={() =>
                            {
                              setVezes(v)
                              autoTitle(pratica, v)
                            }}
                          />
                        ))}
                      </View>
                      <Text variant="micro" muted>Pouco e possível vale mais que muito e pesado. Dá para mudar depois.</Text>
                    </View>
                  ) : null}

                  {/* fundo da tela por baixo do cartão: a caixa de texto aparece nos dois modos */}
                  <Field
                    tone="widget"
                    label={mental ? 'Como chamar a meta (dá para ajustar)' : 'O que você quer alcançar'}
                    placeholder={template?.example ?? 'O que importa para você agora'}
                    value={title}
                    onChangeText={(v) =>
                    {
                      setTitle(v)
                      setTitleEdited(true)
                      setError(null)
                    }}
                    multiline
                    style={{ minHeight: 88 }}
                  />

                  <Field
                    tone="widget"
                    label="Por que isso importa para você (opcional)"
                    placeholder={mental ? 'Ex.: quero dormir mais leve' : 'Ex.: quero ter mais calma no fim do mês'}
                    value={porque}
                    onChangeText={setPorque}
                  />

                  <Text variant="label" muted>Até quando</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    <Chip label="Esta semana" active={cadence === 'week'} onPress={() => setCadence('week')} />
                    <Chip label="Este mês" active={cadence === 'month'} onPress={() => setCadence('month')} />
                    <Chip
                      label="Até amanhã"
                      active={cadence === 'date' && !customOpen && dueDate === addDaysIso(today, 1)}
                      onPress={() =>
                      {
                        setCadence('date')
                        setCustomOpen(false)
                        pickDue(addDaysIso(today, 1))
                      }}
                    />
                    <Chip
                      label=""
                      icon="add"
                      accessibilityLabel="Escolher outro prazo"
                      active={cadence === 'date' && customOpen}
                      onPress={() =>
                      {
                        setCadence('date')
                        setCustomOpen(true)
                        if (!dueDate || dueDate === addDaysIso(today, 1)) pickDue(addDaysIso(today, 7))
                      }}
                    />
                  </View>
                  {cadence === 'date' && customOpen ? (
                    <View style={{ gap: 8 }}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                        <Chip label="Em 7 dias" active={dueDate === addDaysIso(today, 7)} onPress={() => pickDue(addDaysIso(today, 7))} />
                        <Chip label="Em 15 dias" active={dueDate === addDaysIso(today, 15)} onPress={() => pickDue(addDaysIso(today, 15))} />
                        <Chip label="Fim do mês" active={dueDate === endOfMonthIso(today)} onPress={() => pickDue(endOfMonthIso(today))} />
                      </View>
                      <Field
                        tone="widget"
                        label="Dia (DD/MM/AAAA)"
                        placeholder={brDateFromIso(addDaysIso(today, 7))}
                        value={dueText}
                        keyboardType="number-pad"
                        maxLength={10}
                        onChangeText={(v) =>
                        {
                          const masked = maskBrDate(v)
                          setDueText(masked)
                          setDueDate(isoFromBrDate(masked) ?? '')
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
  const pausedUntil = usePrefsStore((s) => s.prefs.life_goals_paused_until)
  const patch = usePrefsStore((s) => s.patch)
  const [pauseOpen, setPauseOpen] = useState(false)
  const active = activeLifeGoals(list, legacy)
  // nada mais a fazer: sem metas, ou todas cumpridas
  const nothingLeft = active.every((g) => Boolean(g.feitaEm))

  // em pausa: só uma linha discreta, com o fim e o jeito de voltar antes
  if (nothingLeft && lifeGoalsPaused(pausedUntil))
  {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Text variant="micro" style={{ color: colors.featureMuted }}>
          {pausedUntil === localTodayIso() ? 'Metas em pausa hoje' : `Metas em pausa até ${brDateFromIso(pausedUntil ?? '').slice(0, 5)}`}
        </Text>
        <Text variant="micro" style={{ color: colors.featureMuted }}>·</Text>
        <Pressable
          onPress={() => void patch({ life_goals_paused_until: null })}
          accessibilityRole="button"
          accessibilityLabel="Voltar a ver as metas agora"
          hitSlop={8}
          style={{ minHeight: 32, justifyContent: 'center' }}
        >
          <Text variant="micro" style={{ color: colors.axel, fontWeight: '600' }}>Voltar agora</Text>
        </Pressable>
      </View>
    )
  }

  const pause = (days: number) =>
  {
    hapticLight()
    setPauseOpen(false)
    void patch({ life_goals_paused_until: lifeGoalsPauseUntil(days) })
  }

  if (pauseOpen)
  {
    return (
      <View style={{ gap: 8 }}>
        <Text variant="micro" style={{ color: colors.featureMuted, fontWeight: '600' }}>
          Esconder as metas por quanto tempo? Depois elas voltam sozinhas.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {LIFE_GOALS_PAUSE_OPTIONS.map((o) => (
            <Chip key={o.days} label={o.label} onPress={() => pause(o.days)} />
          ))}
        </View>
        <Pressable onPress={() => setPauseOpen(false)} accessibilityRole="button" hitSlop={8} style={{ alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' }}>
          <Text variant="micro" muted>Cancelar</Text>
        </Pressable>
      </View>
    )
  }

  const notNow = nothingLeft ? (
    <Pressable
      onPress={() => setPauseOpen(true)}
      accessibilityRole="button"
      accessibilityLabel="Não ver metas por um tempo"
      hitSlop={8}
      style={{ minHeight: 32, justifyContent: 'center' }}
    >
      <Text variant="micro" style={{ color: colors.featureMuted }}>Agora não</Text>
    </Pressable>
  ) : null

  if (!active.length)
  {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
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
        {notNow}
      </View>
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
        {notNow}
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
  const practice = goal.pratica ? MENTAL_PRACTICES.find((x) => x.id === goal.pratica) : null
  /** passo de hoje anotado: a meta encolhe numa linha; tocar abre de novo */
  const [expanded, setExpanded] = useState(false)

  if (p.passoHoje && !p.feita && !expanded)
  {
    const resumo = p.alvo
      ? `${Math.min(p.passos, p.alvo)} de ${p.alvo} · ${lifeGoalTimeLabel(p)}`
      : lifeGoalTimeLabel(p)
    return (
      <Pressable
        onPress={() => setExpanded(true)}
        accessibilityRole="button"
        accessibilityLabel={`${goal.title}. Hoje anotado, ${resumo}`}
        accessibilityHint="Mostra a meta inteira"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          minHeight: 44,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 14,
          backgroundColor: colors.elevated,
          borderWidth: 1,
          borderColor: colors.cardRim,
        }}
      >
        <Icon name="checkmark-circle" size={18} color={colors.health} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="bodyStrong" style={{ fontSize: 14, lineHeight: 20 }} numberOfLines={1}>{goal.title}</Text>
          <Text variant="micro" muted numberOfLines={1}>Hoje anotado · {resumo}</Text>
        </View>
        <Icon name="chevron-down" size={16} color={colors.inkMuted} />
      </Pressable>
    )
  }
  // prática de cuidado: "Fiz hoje"; meta livre: "Avancei hoje"
  const stepLabel = practice ? 'Fiz hoje' : 'Avancei hoje'
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
        {p.feita ? (
          <Icon name="checkmark-circle" size={18} color={colors.health} />
        ) : practice ? (
          <Icon name={practice.icon as never} size={18} color={colors.health} />
        ) : null}
        <Text variant="bodyStrong" style={{ flex: 1, fontSize: 14 }} numberOfLines={2}>{goal.title}</Text>
      </View>
      {goal.porque ? (
        <Text variant="micro" style={{ color: colors.featureMuted, fontStyle: 'italic' }} numberOfLines={2}>
          Para você: {goal.porque}
        </Text>
      ) : null}
      {p.alvo ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {p.alvo <= 10 ? (
            <View style={{ flexDirection: 'row', gap: 4 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {Array.from({ length: p.alvo }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: i < p.passos ? colors.health : 'transparent',
                    borderWidth: 1.5,
                    borderColor: i < p.passos ? colors.health : colors.hairlineStrong,
                  }}
                />
              ))}
            </View>
          ) : null}
          <Text variant="micro" style={{ color: colors.featureInk, fontWeight: '600' }}>
            {Math.min(p.passos, p.alvo)} de {p.alvo} {practice?.id === 'checkin' || p.alvo > 10 ? 'dias' : 'vezes'}
          </Text>
        </View>
      ) : null}
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
            accessibilityLabel={p.passoHoje ? 'Hoje anotado. Toque para desfazer' : stepLabel}
            style={pill(p.passoHoje)}
          >
            {p.passoHoje ? <Icon name="checkmark" size={14} color={colors.health} /> : null}
            <Text variant="micro" style={{ fontWeight: '600', color: p.passoHoje ? colors.health : colors.ink }}>
              {p.passoHoje ? (practice ? 'Hoje feito' : 'Passo de hoje anotado') : stepLabel}
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
          {p.passoHoje ? (
            <Pressable onPress={() => setExpanded(false)} accessibilityRole="button" hitSlop={8} style={{ minHeight: 36, justifyContent: 'center', paddingHorizontal: 4 }}>
              <Text variant="micro" muted>Recolher</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Pressable onPress={() => onChange(lifeGoalToggleFeita(goal))} accessibilityRole="button" hitSlop={8} style={{ alignSelf: 'flex-start', minHeight: 28, justifyContent: 'center' }}>
          <Text variant="micro" muted>Desfazer</Text>
        </Pressable>
      )}
    </View>
  )
}
