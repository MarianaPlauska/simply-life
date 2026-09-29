import { useEffect, useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import {
  CARE_PACE_OPTIONS,
  NOTIFY_CADENCE_OPTIONS,
  GAMIFICATION_MODE_OPTIONS,
  formatSleepHours,
  type CarePace,
  type NotifyCadence,
  type GamificationMode,
} from '@simply-life/shared'
import { Screen, Text, PrimaryButton, Field } from '../src/ui'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { usePrefsStore } from '../src/store/prefsStore'
import { useDataStore } from '../src/store/dataStore'
import { useGamificationStore } from '../src/store/gamificationStore'
import { widgetsForModuleOrder, type DashboardPriority } from '../src/lib/dashboardWidgets'
import {
  HOME_METRIC_CATALOG,
  normalizeHomeMetrics,
  toggleHomeMetric,
  type HomeMetricId,
} from '../src/lib/homeMetrics'
import { SETUP_PRIORITY } from '../src/lib/setupOnboarding'
import {
  ALL_APP_MODULES,
  filterMetrics,
  filterPriorities,
  isModuleOn,
  metricAllowed,
  moduleLabel,
  modulesOfGroup,
  type AppModuleId,
} from '../src/lib/appModules'
import { CreditCardVisual } from '../src/components/finance/CreditCardVisual'
import {
  FinanceCardForm,
  cardDraftToPatch,
  emptyCardDraft,
  validateCardDraft,
  type CardDraft,
} from '../src/components/finance/FinanceCardForm'
import { OnbStep, OnbBlock } from '../src/components/onboarding/OnbStep'
import { OnbChoice } from '../src/components/onboarding/OnbChoice'
import { ModulePicker } from '../src/components/onboarding/ModulePicker'
import { HealthStartForm } from '../src/components/onboarding/HealthStartForm'
import { TasksStartForm } from '../src/components/onboarding/TasksStartForm'
import { FinanceStartForm } from '../src/components/onboarding/FinanceStartForm'
import {
  EMPTY_FINANCE_DRAFT,
  EMPTY_TASKS_DRAFT,
  applyFinanceDraft,
  applyHealthDraft,
  applyTasksDraft,
  healthDraftFrom,
  type FinanceDraft,
  type HealthDraft,
  type TasksDraft,
} from '../src/components/onboarding/startDrafts'

type StepId =
  | 'welcome'
  | 'name'
  | 'modules'
  | 'tasks'
  | 'health'
  | 'finance'
  | 'cards'
  | 'rhythm'
  | 'home'
  | 'summary'

const PRIORITY_MODULES: Record<DashboardPriority, AppModuleId[]> = {
  tasks: ['tasks', 'routine'],
  health: ['mood', 'water', 'sleep', 'food', 'gym', 'meds', 'support'],
  finance: ['spend', 'cards', 'bills', 'goals'],
}

/**
 * Boas-vindas: tema, nome, o que usar e perguntas só dos módulos escolhidos.
 * As respostas viram dados reais (metas, tarefas, rotina, saldo, contas).
 * Tudo pode ser pulado e mudado depois em Preferências.
 */
export default function SetupScreen()
{
  const { colors, space, mode, setMode } = useTheme()
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const prefs = usePrefsStore((s) => s.prefs)
  const loaded = usePrefsStore((s) => s.loaded)
  const hydrate = usePrefsStore((s) => s.hydrate)
  const patch = usePrefsStore((s) => s.patch)
  const habits = useDataStore((s) => s.habits)
  const cards = useDataStore((s) => s.financeCards)
  const addCard = useDataStore((s) => s.addFinanceCard)
  const updateCard = useDataStore((s) => s.updateFinanceCard)
  const refreshAll = useDataStore((s) => s.refreshAll)
  const startGuestOwnData = useDataStore((s) => s.startGuestOwnData)
  const guestOwnData = useDataStore((s) => s.guestOwnData)
  const logEvent = useGamificationStore((s) => s.logEvent)
  const grantXp = useGamificationStore((s) => s.grantXp)

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [modules, setModules] = useState<AppModuleId[]>(prefs.enabled_modules ?? ALL_APP_MODULES)
  const [tasksDraft, setTasksDraft] = useState<TasksDraft>(EMPTY_TASKS_DRAFT)
  const [healthDraft, setHealthDraft] = useState<HealthDraft>(() => healthDraftFrom(habits))
  const [healthTouched, setHealthTouched] = useState(false)
  const [financeDraft, setFinanceDraft] = useState<FinanceDraft>(EMPTY_FINANCE_DRAFT)
  const [moduleOrder, setModuleOrder] = useState<DashboardPriority[]>(prefs.home_module_order ?? [])
  const [metrics, setMetrics] = useState<HomeMetricId[]>(() => normalizeHomeMetrics(prefs.home_metric_cards))
  const [pace, setPace] = useState<CarePace>(prefs.care_pace || 'balanced')
  const [notifyCadence, setNotifyCadence] = useState<NotifyCadence>(prefs.notify_cadence || 'off')
  const [adhdSupport, setAdhdSupport] = useState(Boolean(prefs.adhd_support))
  const [gamificationMode, setGamificationMode] = useState<GamificationMode>(prefs.gamification_mode || 'calm')
  const [cardFormOpen, setCardFormOpen] = useState(false)
  const [cardDraft, setCardDraft] = useState<CardDraft>(emptyCardDraft)
  const [cardMsg, setCardMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [problems, setProblems] = useState<string[]>([])

  useEffect(() =>
  {
    void hydrate()
    // convidado entra direto aqui: carrega os hábitos para as metas partirem do que existe
    void refreshAll({ isGuest })
  }, [hydrate, refreshAll, isGuest])

  useEffect(() =>
  {
    if (prefs.axel_calls_you) setName((n) => n || prefs.axel_calls_you)
  }, [prefs.axel_calls_you])

  // metas partem dos hábitos carregados, até a pessoa mexer nelas
  useEffect(() =>
  {
    if (!healthTouched && habits.length) setHealthDraft((d) => ({ ...healthDraftFrom(habits), meds: d.meds }))
  }, [habits, healthTouched])

  const on = (id: AppModuleId) => isModuleOn(modules, id)
  const steps = useMemo<StepId[]>(() =>
  {
    const list: StepId[] = ['welcome', 'name', 'modules']
    if (on('tasks') || on('routine')) list.push('tasks')
    if (on('water') || on('sleep') || on('food') || on('gym') || on('meds')) list.push('health')
    if (on('spend') || on('bills') || on('goals')) list.push('finance')
    if (on('cards')) list.push('cards')
    list.push('rhythm', 'home', 'summary')
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules])

  if (!userId) return <Redirect href="/login" />
  if (loaded && prefs.setup_completed_at && !saving && !problems.length) return <Redirect href="/(tabs)" />

  const current = steps[Math.min(step, steps.length - 1)]
  const total = steps.length
  const goTo = (id: StepId) => setStep(Math.max(0, steps.indexOf(id)))
  const next = () => setStep((s) => Math.min(total - 1, s + 1))
  const back = () => setStep((s) => Math.max(0, s - 1))

  const toggleModule = (id: AppModuleId) =>
    setModules((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const setGroup = (group: 'tarefas' | 'saude' | 'carteira', value: boolean) =>
  {
    const ids = modulesOfGroup(group).map((m) => m.id)
    setModules((prev) => (value ? [...new Set([...prev, ...ids])] : prev.filter((x) => !ids.includes(x))))
  }

  const priorities = SETUP_PRIORITY.filter((p) => PRIORITY_MODULES[p.id].some((m) => on(m)))
  const order = filterPriorities(modules, moduleOrder.length ? moduleOrder : priorities.map((p) => p.id))
  const homeMetrics = filterMetrics(modules, metrics)

  const saveCard = () =>
  {
    const problem = validateCardDraft(cardDraft)
    if (problem)
    {
      setCardMsg(problem)
      return
    }
    const { validadeMesAno, banco, enderecoCobranca, cep, ...base } = cardDraftToPatch(cardDraft)
    const created = addCard(base)
    updateCard(created.id, { validadeMesAno, banco, enderecoCobranca, cep })
    setCardMsg(`${base.nome} entrou na sua carteira.`)
    setCardDraft(emptyCardDraft())
    setCardFormOpen(false)
  }

  /** Convidado que só quer olhar: fica com os dados de exemplo e tudo ligado. */
  const exploreDemo = async () =>
  {
    setSaving(true)
    await patch({ color_scheme: mode, setup_completed_at: new Date().toISOString() })
    setSaving(false)
    router.replace('/(tabs)')
  }

  const startOwn = async () =>
  {
    // só na primeira vez: voltar e tocar de novo não apaga o que já foi cadastrado
    if (isGuest && !guestOwnData) await startGuestOwnData()
    next()
  }

  const finish = async () =>
  {
    setSaving(true)
    const finalOrder: DashboardPriority[] = order.length ? order : ['tasks', 'health', 'finance']
    const trimmed = name.trim()
    await patch({
      axel_calls_you: trimmed,
      display_name: trimmed,
      color_scheme: mode,
      enabled_modules: modules,
      dashboard_priority: finalOrder[0] ?? 'tasks',
      home_module_order: finalOrder,
      dashboard_quick_widgets: widgetsForModuleOrder(finalOrder),
      home_metric_cards: normalizeHomeMetrics(homeMetrics.length ? homeMetrics : metrics),
      home_metrics_configured_at: new Date().toISOString(),
      care_pace: pace,
      notify_cadence: notifyCadence,
      adhd_support: adhdSupport,
      gamification_mode: adhdSupport ? gamificationMode : 'calm',
    })
    await applyHealthDraft(healthDraft, modules, isGuest)
    await applyTasksDraft(tasksDraft, modules, isGuest)
    const issues = await applyFinanceDraft(financeDraft, modules, isGuest)
    await patch({ setup_completed_at: new Date().toISOString() })
    logEvent('setup', 'Boas-vindas concluídas', trimmed || 'setup')
    grantXp(15, 'Configuração concluída', 'Onboarding')
    setSaving(false)
    if (issues.length)
    {
      // não trava a entrada: mostra o que falhou e deixa seguir
      setProblems(issues)
      return
    }
    router.replace('/(tabs)')
  }

  const stepProps = {
    step: Math.min(step, total - 1),
    total,
    onBack: step > 0 ? back : undefined,
  }

  const summaryRows: { label: string; value: string; step: StepId }[] = [
    { label: 'Nome', value: name.trim() || 'Não informado', step: 'name' },
    { label: 'Aparência', value: mode === 'dark' ? 'Escura' : 'Clara', step: 'welcome' },
    { label: 'O que você usa', value: modules.map(moduleLabel).join(', ') || 'Nada escolhido', step: 'modules' },
    ...(on('tasks') || on('routine')
      ? [{
          label: 'Tarefas e rotina',
          value: [
            `${tasksDraft.week.filter((t) => t.trim()).length} tarefa(s)`,
            `${tasksDraft.habits.length} hábito(s)`,
          ].join(', '),
          step: 'tasks' as StepId,
        }]
      : []),
    ...(steps.includes('health')
      ? [{
          label: 'Saúde',
          value: [
            on('water') ? `${healthDraft.waterGoal} copos` : '',
            on('sleep') ? formatSleepHours(healthDraft.sleepGoal) : '',
            on('food') ? `${healthDraft.proteinGoal} g proteína` : '',
            on('gym') ? `${healthDraft.gymDays.length} dia(s) de treino` : '',
            on('meds') ? `${healthDraft.meds.length} remédio(s)` : '',
          ].filter(Boolean).join(', '),
          step: 'health' as StepId,
        }]
      : []),
    ...(steps.includes('finance')
      ? [{
          label: 'Carteira',
          value: [
            financeDraft.balance.trim() ? `saldo R$ ${financeDraft.balance.trim()}` : '',
            financeDraft.salary.trim() ? `salário R$ ${financeDraft.salary.trim()}` : '',
            financeDraft.fixas.length ? `${financeDraft.fixas.length} conta(s) fixa(s)` : '',
            financeDraft.goalTitle.trim() ? `meta: ${financeDraft.goalTitle.trim()}` : '',
          ].filter(Boolean).join(', ') || 'Nada por enquanto',
          step: 'finance' as StepId,
        }]
      : []),
    ...(on('cards')
      ? [{ label: 'Cartões', value: cards.length ? cards.map((c) => c.nome).join(', ') : 'Nenhum por enquanto', step: 'cards' as StepId }]
      : []),
    {
      label: 'Ritmo',
      value: [
        CARE_PACE_OPTIONS.find((p) => p.id === pace)?.label ?? '',
        adhdSupport ? 'apoio para foco' : '',
        NOTIFY_CADENCE_OPTIONS.find((p) => p.id === notifyCadence)?.label ?? '',
      ].filter(Boolean).join(', '),
      step: 'rhythm',
    },
    {
      label: 'Início',
      value: homeMetrics.map((id) => HOME_METRIC_CATALOG.find((m) => m.id === id)?.label).join(', ') || 'Padrão',
      step: 'home',
    },
  ]

  return (
    <Screen scroll tabBarInset={false}>
      <View style={{ paddingTop: space.xl, paddingBottom: space.xl, maxWidth: 520, alignSelf: 'center', width: '100%' }}>
        {current === 'welcome' ? (
          <OnbStep
            {...stepProps}
            onBack={undefined}
            title="Bem-vindo ao Simply Life"
            subtitle="Tarefas, saúde e dinheiro num lugar só. Você escolhe o que usar e o app se monta com os seus dados."
            nextLabel="Começar"
            onNext={() => void startOwn()}
            onSkip={isGuest ? () => void exploreDemo() : undefined}
            skipLabel="Só explorar com dados de exemplo"
          >
            <OnbBlock title="Aparência" hint="Dá para trocar depois, no menu Mais.">
              <View style={{ gap: space.sm }}>
                <OnbChoice
                  kind="radio"
                  icon="sunny"
                  title="Clara"
                  hint="Mais luz durante o dia."
                  selected={mode === 'light'}
                  onPress={() => setMode('light')}
                />
                <OnbChoice
                  kind="radio"
                  icon="moon"
                  title="Escura"
                  hint="Menos brilho, melhor à noite."
                  selected={mode === 'dark'}
                  onPress={() => setMode('dark')}
                />
              </View>
            </OnbBlock>
            <Text variant="caption" muted>
              O app organiza a rotina. Não substitui psicoterapia, psiquiatria nem diagnóstico. Em
              sofrimento intenso, procure um profissional ou o CVV (188).
            </Text>
          </OnbStep>
        ) : null}

        {current === 'name' ? (
          <OnbStep
            {...stepProps}
            title="Como quer ser chamado?"
            subtitle="Aparece só para você, na tela inicial e nas mensagens do AXEL."
            onNext={next}
            canNext={Boolean(name.trim())}
          >
            <Field
              label="Nome ou apelido"
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              autoCapitalize="words"
            />
          </OnbStep>
        ) : null}

        {current === 'modules' ? (
          <OnbStep
            {...stepProps}
            title="O que você quer usar?"
            subtitle="Não precisa usar tudo. O que ficar de fora some do app, e você liga de novo em Preferências quando quiser."
            onNext={next}
            canNext={modules.length > 0}
            nextLabel={modules.length ? `Continuar com ${modules.length}` : 'Escolha pelo menos um'}
          >
            <ModulePicker value={modules} onToggle={toggleModule} onGroup={setGroup} />
          </OnbStep>
        ) : null}

        {current === 'tasks' ? (
          <OnbStep
            {...stepProps}
            kicker="Tarefas"
            title="Sua semana"
            subtitle="O que já está na sua cabeça. Tirar daqui e pôr no app alivia."
            onNext={next}
            onSkip={next}
          >
            <TasksStartForm value={tasksDraft} onChange={setTasksDraft} enabled={modules} />
          </OnbStep>
        ) : null}

        {current === 'health' ? (
          <OnbStep
            {...stepProps}
            kicker="Saúde"
            title="Suas metas de cuidado"
            subtitle="Pontos de partida, não cobrança. O app mostra o quanto falta, sem sequência obrigatória."
            onNext={next}
            onSkip={next}
          >
            <HealthStartForm
              value={healthDraft}
              onChange={(d) =>
              {
                setHealthTouched(true)
                setHealthDraft(d)
              }}
              enabled={modules}
            />
          </OnbStep>
        ) : null}

        {current === 'finance' ? (
          <OnbStep
            {...stepProps}
            kicker="Carteira"
            title="Seu dinheiro hoje"
            subtitle="Com o saldo e as contas fixas, o app já diz quanto sobra no fim do mês."
            onNext={next}
            onSkip={next}
          >
            <FinanceStartForm value={financeDraft} onChange={setFinanceDraft} enabled={modules} />
          </OnbStep>
        ) : null}

        {current === 'cards' ? (
          <OnbStep
            {...stepProps}
            kicker="Carteira"
            title="Seus cartões"
            subtitle="Débito e PIX saem do saldo na hora. No crédito, só quando você paga a fatura."
            onNext={next}
            onSkip={cardFormOpen ? undefined : next}
            nextLabel={cards.length ? 'Continuar' : 'Pular por agora'}
            canNext={!cardFormOpen}
          >
            {cards.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
                {cards.map((c) => (
                  <CreditCardVisual key={c.id} card={c} width={240} />
                ))}
              </ScrollView>
            ) : null}
            {cardMsg && !cardFormOpen ? <Text variant="caption" color={colors.health}>{cardMsg}</Text> : null}
            {cardFormOpen ? (
              <View style={{ gap: space.md }}>
                <FinanceCardForm value={cardDraft} onChange={setCardDraft} previewWidth={300} />
                {cardMsg ? <Text variant="caption" color={colors.danger}>{cardMsg}</Text> : null}
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  <PrimaryButton
                    label="Cancelar"
                    variant="ghost"
                    style={{ flex: 1 }}
                    onPress={() =>
                    {
                      setCardFormOpen(false)
                      setCardMsg('')
                    }}
                  />
                  <PrimaryButton label="Salvar cartão" variant="secondary" style={{ flex: 1 }} onPress={saveCard} />
                </View>
              </View>
            ) : (
              <PrimaryButton
                label={cards.length ? 'Adicionar outro cartão' : 'Adicionar cartão'}
                variant="secondary"
                icon="add"
                onPress={() =>
                {
                  setCardMsg('')
                  setCardFormOpen(true)
                }}
              />
            )}
          </OnbStep>
        ) : null}

        {current === 'rhythm' ? (
          <OnbStep
            {...stepProps}
            title="Seu ritmo"
            subtitle="Como o AXEL fala com você e quantos avisos chegam no celular."
            onNext={next}
          >
            <OnbBlock title="Tom das mensagens">
              {CARE_PACE_OPTIONS.map((opt) => (
                <OnbChoice
                  key={opt.id}
                  kind="radio"
                  title={opt.label}
                  hint={opt.hint}
                  selected={pace === opt.id}
                  onPress={() => setPace(opt.id)}
                />
              ))}
            </OnbBlock>
            <OnbBlock title="Foco e TDAH" hint="Não é diagnóstico. Deixa as tarefas em passos menores e a linha do dia mais visível.">
              <OnbChoice
                kind="radio"
                title="Quero esse apoio"
                selected={adhdSupport}
                onPress={() => setAdhdSupport(true)}
              />
              <OnbChoice
                kind="radio"
                title="Prefiro o modo padrão"
                selected={!adhdSupport}
                onPress={() => setAdhdSupport(false)}
              />
              {adhdSupport
                ? GAMIFICATION_MODE_OPTIONS.map((opt) => (
                    <OnbChoice
                      key={opt.id}
                      kind="radio"
                      title={opt.label}
                      hint={opt.hint}
                      selected={gamificationMode === opt.id}
                      onPress={() => setGamificationMode(opt.id)}
                    />
                  ))
                : null}
            </OnbBlock>
            <OnbBlock title="Avisos no celular" hint="Nunca à noite: silêncio das 22h às 8h.">
              {NOTIFY_CADENCE_OPTIONS.map((opt) => (
                <OnbChoice
                  key={opt.id}
                  kind="radio"
                  title={opt.label}
                  hint={opt.hint}
                  selected={notifyCadence === opt.id}
                  onPress={() => setNotifyCadence(opt.id)}
                />
              ))}
            </OnbBlock>
          </OnbStep>
        ) : null}

        {current === 'home' ? (
          <OnbStep
            {...stepProps}
            title="Sua tela inicial"
            subtitle="A ordem define o que aparece primeiro. Os atalhos são os números que você vê ao abrir o app."
            onNext={next}
          >
            {priorities.length > 1 ? (
              <OnbBlock title="O que vem primeiro" hint="Toque na ordem de importância.">
                {priorities.map((p) =>
                {
                  const pos = moduleOrder.indexOf(p.id)
                  return (
                    <OnbChoice
                      key={p.id}
                      title={pos >= 0 ? `${pos + 1}. ${p.label}` : p.label}
                      hint={p.hint}
                      selected={pos >= 0}
                      onPress={() =>
                        setModuleOrder((prev) => (prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]))}
                    />
                  )
                })}
              </OnbBlock>
            ) : null}
            <OnbBlock title="Atalhos do Início" hint="Só aparecem os dos módulos que você escolheu.">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                {HOME_METRIC_CATALOG.filter((m) => metricAllowed(modules, m.id)).map((m) => (
                  <OnbChoice
                    key={m.id}
                    half
                    title={m.label}
                    hint={m.hint}
                    selected={metrics.includes(m.id)}
                    onPress={() => setMetrics((prev) => toggleHomeMetric(prev, m.id))}
                  />
                ))}
              </View>
            </OnbBlock>
          </OnbStep>
        ) : null}

        {current === 'summary' ? (
          <OnbStep
            {...stepProps}
            title="Tudo pronto"
            subtitle="Confira antes de começar. Toque em Editar para voltar a qualquer passo."
            nextLabel={problems.length ? 'Entrar mesmo assim' : 'Começar'}
            loading={saving}
            onNext={() => (problems.length ? router.replace('/(tabs)') : void finish())}
          >
            <View
              style={{
                borderRadius: 20,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.hairline,
                paddingHorizontal: space.md,
              }}
            >
              {summaryRows.map((row, i) => (
                <View
                  key={row.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space.md,
                    paddingVertical: 12,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: colors.hairline,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="caption" muted>{row.label}</Text>
                    <Text variant="body">{row.value}</Text>
                  </View>
                  <PrimaryButton label="Editar" variant="link" size="sm" onPress={() => goTo(row.step)} />
                </View>
              ))}
            </View>
            {problems.length ? (
              <View style={{ gap: 4 }}>
                <Text variant="bodyStrong" color={colors.danger}>Algumas coisas não foram salvas</Text>
                {problems.map((p) => (
                  <Text key={p} variant="caption" color={colors.danger}>{p}</Text>
                ))}
                <Text variant="caption" muted>Você pode completar depois em Preferências.</Text>
              </View>
            ) : null}
          </OnbStep>
        ) : null}
      </View>
    </Screen>
  )
}
