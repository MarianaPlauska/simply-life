import { useEffect, useMemo, useState } from 'react'
import { ScrollView, Share, View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import {
  CARE_PACE_OPTIONS,
  NOTIFY_CADENCE_OPTIONS,
  GAMIFICATION_MODE_OPTIONS,
  formatSleepHours,
  demoFinanceCards,
  isDemoFinanceCard,
  localTodayIso,
  parseBlocoFala,
  type CarePace,
  type NotifyCadence,
  type GamificationMode,
} from '@simply-life/shared'
import { Screen, Text, PrimaryButton, Field } from '../src/ui'
import { AdventurePreview } from '../src/components/play/AdventurePreview'
import { AvatarIconPicker } from '../src/components/profile/AvatarIconPicker'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { usePrefsStore } from '../src/store/prefsStore'
import { useDataStore } from '../src/store/dataStore'
import { useGamificationStore } from '../src/store/gamificationStore'
import { newBlocoId, useMeuMundoStore } from '../src/store/meuMundoStore'
import { widgetsForModuleOrder, type DashboardPriority } from '../src/lib/dashboardWidgets'
import {
  HOME_METRIC_CATALOG,
  normalizeHomeMetrics,
  toggleHomeMetric,
  type HomeMetricId,
} from '../src/lib/homeMetrics'
import { SETUP_PRIORITY } from '../src/lib/setupOnboarding'
import { supabaseConfigured } from '../src/lib/supabase'
import { registerExpoPushAsync } from '../src/lib/pushRegister'
import { scheduleCadenceAlerts } from '../src/lib/pushNotifications'
import { acceptFriendCode, createFriendInviteLink } from '../src/lib/sync/friends'
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
import { AxelSun } from '../src/components/AxelSun'
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
  | 'axel'
  | 'guide'
  | 'modules'
  | 'tasks'
  | 'mundo'
  | 'health'
  | 'finance'
  | 'cards'
  | 'rhythm'
  | 'circle'
  | 'home'
  | 'summary'

const AXEL_INTRO: { title: string; hint: string }[] = [
  { title: 'Organiza o seu dia', hint: 'Monta o plano de hoje com o que vence primeiro e replaneja quando o dia sai do roteiro.' },
  { title: 'Tira tudo da cabeça', hint: 'Escreva do seu jeito, "pagar luz sexta e comprar pão 8 reais", e ele separa em tarefa e gasto.' },
  { title: 'Cuida sem julgar', hint: 'Lembra de água, remédio e pausa, e no fim da semana mostra como foi o seu humor.' },
  { title: 'Ajuda com o dinheiro', hint: 'Diz se uma compra cabe no mês e avisa antes de a conta vencer.' },
  { title: 'Descobre o que mexe com você', hint: 'Com o tempo, mostra padrões entre sono, humor, treino, gastos e tarefas.' },
]

const SUNFY_GUIDE: { title: string; hint: string }[] = [
  { title: 'Início', hint: 'Humor e o botão + para tirar o dia da cabeça.' },
  { title: 'Tarefas', hint: 'A lista e o Meu Mundo, a sua semana em formato de planilha.' },
  { title: 'Saúde', hint: 'Hoje, Cuidados e Diário. Água, comida, academia e remédios.' },
  { title: 'Carteira', hint: 'Saldo, extrato, contas e para onde o dinheiro foi.' },
  { title: 'Calendário', hint: 'O mês e a agenda, se você ligar.' },
  { title: 'Mais', hint: 'Perfil, preferências e sair. Fechar só esconde o menu.' },
]

const MUNDO_INTRO: { title: string; hint: string }[] = [
  { title: 'Semana e dia', hint: 'Veja a semana em grade ou o dia em linha do tempo, com o tempo livre entre um bloco e outro.' },
  { title: 'Repete sozinho', hint: 'Todo dia, em certos dias da semana ou a cada 2 semanas. "academia seg qua sex 7h" já entende.' },
  { title: 'Avisa antes', hint: 'Um aviso antes de cada bloco e, se quiser, a pergunta "deu para fazer?" no fim.' },
  { title: 'Aponta conflitos', hint: 'Se dois horários batem, ele mostra e sugere o próximo horário livre.' },
  { title: 'Encaixa o flexível', hint: 'O que não tem hora certa, como "estudar 1h", vai para os espaços livres com o botão Ajeitar.' },
]

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
  const rawCards = useDataStore((s) => s.financeCards)
  const cards = rawCards.filter((c) => !isDemoFinanceCard(c))
  const addCard = useDataStore((s) => s.addFinanceCard)
  const removeCard = useDataStore((s) => s.removeFinanceCard)
  const updateCard = useDataStore((s) => s.updateFinanceCard)
  const refreshAll = useDataStore((s) => s.refreshAll)
  const startGuestOwnData = useDataStore((s) => s.startGuestOwnData)
  const guestOwnData = useDataStore((s) => s.guestOwnData)
  const logEvent = useGamificationStore((s) => s.logEvent)
  const grantXp = useGamificationStore((s) => s.grantXp)

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [avatarIcon, setAvatarIcon] = useState(prefs.profile_avatar_icon || 'initials')
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
  const [friendCode, setFriendCode] = useState('')
  const [circleBusy, setCircleBusy] = useState(false)
  const [circleMsg, setCircleMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [joinedCount, setJoinedCount] = useState(0)
  const [invitesSent, setInvitesSent] = useState(0)
  const [reviewing, setReviewing] = useState(false)
  const [editing, setEditing] = useState<StepId | null>(null)
  const [mundoFala, setMundoFala] = useState('')
  const [mundoMsg, setMundoMsg] = useState('')
  const saveMundoBloco = useMeuMundoStore((s) => s.save)

  useEffect(() =>
  {
    void (async () =>
    {
      await hydrate()
      await refreshAll({ isGuest })
      // conta em criação: some com Nubank/Inter de exemplo, se o fetch tiver plantado
      const leftover = useDataStore.getState().financeCards.filter(isDemoFinanceCard)
      for (const card of leftover)
      {
        removeCard(card.id)
      }
    })()
  }, [hydrate, refreshAll, isGuest, removeCard])

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
    const list: StepId[] = ['welcome', 'name', 'axel', 'modules']
    if (on('tasks') || on('routine')) list.push('tasks', 'mundo')
    if (on('water') || on('sleep') || on('food') || on('gym') || on('meds')) list.push('health')
    if (on('spend') || on('bills') || on('goals')) list.push('finance')
    if (on('cards')) list.push('cards')
    list.push('rhythm')
    // Círculo precisa de conta: convidado não vê este passo
    if (!isGuest && supabaseConfigured) list.push('circle')
    list.push('home', 'summary')
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules, isGuest])

  if (!userId) return <Redirect href="/login" />
  if (loaded && prefs.setup_completed_at && !saving && !problems.length) return <Redirect href="/(tabs)" />

  const current = steps[Math.min(step, steps.length - 1)]
  const total = steps.length
  const goSummary = () =>
  {
    setReviewing(false)
    setStep(Math.max(0, steps.indexOf('summary')))
  }
  const goTo = (id: StepId) =>
  {
    setReviewing(true)
    setStep(Math.max(0, steps.indexOf(id)))
  }
  const next = () =>
  {
    if (reviewing)
    {
      goSummary()
      return
    }
    setStep((s) => Math.min(total - 1, s + 1))
  }
  const back = () =>
  {
    if (reviewing)
    {
      goSummary()
      return
    }
    setStep((s) => Math.max(0, s - 1))
  }

  const saveMundo = () =>
  {
    if (!mundoFala.trim())
    {
      next()
      return
    }
    const fala = parseBlocoFala(mundoFala)
    if (!fala)
    {
      setMundoMsg('Não achei a repetição. Tente com os dias, como "inglês toda terça 19h", ou pule.')
      return
    }
    void saveMundoBloco({
      ...fala,
      id: newBlocoId(),
      tipo: fala.horaMinutos == null ? 'flexivel' : 'fixo',
      dataInicio: localTodayIso(),
      repeteAte: null,
      avisoMinutos: fala.horaMinutos == null ? null : 10,
      avisoFim: false,
      cor: null,
      categoria: null,
    })
    setMundoFala('')
    next()
  }

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
    // modo vitrine: devolve os cartões de exemplo (Nubank/Inter) só neste caminho
    if (!useDataStore.getState().financeCards.length)
    {
      useDataStore.setState({ financeCards: demoFinanceCards() })
    }
    await patch({ color_scheme: mode, setup_completed_at: new Date().toISOString() })
    setSaving(false)
    router.replace('/(tabs)')
  }

  const startOwn = async () =>
  {
    setSaving(true)
    try
    {
    // só na primeira vez: voltar e tocar de novo não apaga o que já foi cadastrado
    if (isGuest && !guestOwnData)
    {
      await Promise.race([
        startGuestOwnData(),
        new Promise((resolve) => setTimeout(resolve, 8000)),
      ])
    }
    // conta nova começa sem cartão; Nubank/Inter de exemplo não entram
    const leftover = useDataStore.getState().financeCards.filter(isDemoFinanceCard)
    for (const card of leftover)
    {
      removeCard(card.id)
    }
    next()
    }
    finally
    {
      setSaving(false)
    }
  }

  const finish = async () =>
  {
    setSaving(true)
    if (notifyCadence !== 'off')
    {
      void registerExpoPushAsync(true).then((res) =>
      {
        if (res.ok) void scheduleCadenceAlerts(notifyCadence)
      })
    }
    const finalOrder: DashboardPriority[] = order.length ? order : ['tasks', 'health', 'finance']
    const trimmed = name.trim()
    try
    {
    await patch({
      axel_calls_you: trimmed,
      display_name: trimmed,
      profile_avatar_icon: avatarIcon,
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
      gamification_mode: gamificationMode,
      setup_completed_at: new Date().toISOString(),
    })
    await Promise.race([
      applyHealthDraft(healthDraft, modules, isGuest),
      new Promise((resolve) => setTimeout(resolve, 8000)),
    ])
    await Promise.race([
      applyTasksDraft(tasksDraft, modules, isGuest),
      new Promise((resolve) => setTimeout(resolve, 8000)),
    ])
    const issues = await Promise.race([
      applyFinanceDraft(financeDraft, modules, isGuest),
      new Promise<string[]>((resolve) => setTimeout(() => resolve([]), 8000)),
    ])
    logEvent('setup', 'Boas-vindas concluídas', trimmed || 'setup')
    grantXp(15, 'Configuração concluída', 'Onboarding')
    if (issues.length)
    {
      setProblems(issues)
      return
    }
    router.replace('/(tabs)')
    }
    catch
    {
      router.replace('/(tabs)')
    }
    finally
    {
      setSaving(false)
    }
  }

  const joinFriend = async () =>
  {
    setCircleBusy(true)
    const res = await acceptFriendCode(friendCode)
    setCircleBusy(false)
    setCircleMsg({ ok: res.ok, text: res.message })
    if (res.ok)
    {
      setJoinedCount((n) => n + 1)
      setFriendCode('')
    }
  }

  const inviteFriends = async () =>
  {
    setCircleBusy(true)
    const res = await createFriendInviteLink()
    setCircleBusy(false)
    if (!res)
    {
      setCircleMsg({ ok: false, text: 'Não deu para gerar o convite agora' })
      return
    }
    try
    {
      await Share.share({ message: `Vem para o meu Círculo no SunFy: ${res.url}`, url: res.url })
      setInvitesSent((n) => n + 1)
    }
    catch
    {
      /* a pessoa fechou o compartilhar */
    }
  }

  const stepProps = {
    reviewing,
    step: Math.min(step, total - 1),
    total,
    onBack: reviewing || step > 0 ? back : undefined,
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
    ...(steps.includes('circle')
      ? [{
          label: 'Círculo',
          value: [
            joinedCount ? `${joinedCount} amigo(s) conectado(s)` : '',
            invitesSent ? `${invitesSent} convite(s) enviado(s)` : '',
          ].filter(Boolean).join(', ') || 'Ninguém por enquanto',
          step: 'circle' as StepId,
        }]
      : []),
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
            title="Boas-vindas ao SunFy"
            subtitle="Tarefas, saúde e dinheiro num lugar só. Você escolhe o que usar e o app se monta com os seus dados."
            nextLabel="Começar"
            loading={saving}
            onNext={() => (reviewing ? next() : void startOwn())}
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
            subtitle="O nome aparece na tela inicial. O ícone é o seu rosto no app. No começo são poucos. Os outros abrem com o nível."
            onNext={next}
            canNext={Boolean(name.trim())}
          >
            <AvatarIconPicker
              selected={avatarIcon}
              onSelect={setAvatarIcon}
              level={1}
              owned={[]}
              startersOnly
            />
            <Field
              label="Nome ou apelido"
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              autoCapitalize="words"
            />
          </OnbStep>
        ) : null}

        {current === 'axel' ? (
          <OnbStep
            {...stepProps}
            kicker="Conheça o AXEL"
            title={name.trim() ? `${name.trim()}, este é o AXEL` : 'Este é o AXEL'}
            subtitle="O girassol que acompanha você no SunFy. Ele usa inteligência artificial para pensar junto, nunca para cobrar."
            onNext={next}
            nextLabel="Entendi"
          >
            <View style={{ alignItems: 'center', paddingVertical: space.sm }}>
              <AxelSun size={88} mood="happy" />
            </View>
            <OnbBlock title="O que ele faz por você">
              {AXEL_INTRO.map((b) => (
                <View key={b.title} style={{ gap: 2, paddingVertical: 4 }}>
                  <Text variant="bodyStrong">{b.title}</Text>
                  <Text variant="caption" muted>{b.hint}</Text>
                </View>
              ))}
            </OnbBlock>
            <OnbBlock title="Onde fica cada coisa">
              {SUNFY_GUIDE.map((item) => (
                <View key={item.title} style={{ gap: 2, paddingVertical: 4 }}>
                  <Text variant="bodyStrong">{item.title}</Text>
                  <Text variant="caption" muted>{item.hint}</Text>
                </View>
              ))}
            </OnbBlock>
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

        {current === 'mundo' ? (
          <OnbStep
            {...stepProps}
            kicker="Meu Mundo"
            title="Sua agenda em formato de planilha"
            subtitle="Fica em Tarefas, na aba Meu Mundo. Cada compromisso vira um bloco na semana."
            onNext={saveMundo}
            nextLabel={mundoFala.trim() ? 'Salvar e continuar' : 'Continuar'}
            onSkip={next}
          >
            <OnbBlock title="O que ele faz por você">
              {MUNDO_INTRO.map((b) => (
                <View key={b.title} style={{ gap: 2, paddingVertical: 4 }}>
                  <Text variant="bodyStrong">{b.title}</Text>
                  <Text variant="caption" muted>{b.hint}</Text>
                </View>
              ))}
            </OnbBlock>
            <OnbBlock title="Comece com algo que se repete" hint="Opcional. Escreva do seu jeito; dá para mudar depois.">
              <Field
                label="O que se repete na sua semana"
                value={mundoFala}
                onChangeText={(t) =>
                {
                  setMundoFala(t)
                  setMundoMsg('')
                }}
                placeholder="academia seg qua sex 7h"
              />
              {mundoMsg ? <Text variant="caption" muted>{mundoMsg}</Text> : null}
            </OnbBlock>
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
            </OnbBlock>
            <OnbBlock title="Como o dia aparece" hint="O jogo é opcional. Os pontos existem nos dois modos.">
              {GAMIFICATION_MODE_OPTIONS.map((opt) => (
                <OnbChoice
                  key={opt.id}
                  kind="radio"
                  title={opt.label}
                  hint={opt.hint}
                  selected={gamificationMode === opt.id}
                  onPress={() => setGamificationMode(opt.id)}
                />
              ))}
              {gamificationMode === 'rpg' ? <AdventurePreview /> : null}
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

        {current === 'circle' ? (
          <OnbStep
            {...stepProps}
            kicker="Círculo"
            title="Traga quem caminha com você"
            subtitle="Amigos veem só seu nome, avatar e Elo. Nunca seus registros de humor, saúde ou dinheiro."
            onNext={next}
            onSkip={next}
            nextLabel={joinedCount || invitesSent ? 'Continuar' : 'Pular por agora'}
          >
            <OnbBlock title="Recebeu um convite?" hint="Cole o código ou o link que seu amigo mandou.">
              <Field
                label="Código do convite"
                value={friendCode}
                onChangeText={setFriendCode}
                placeholder="Ex.: K7M2QX9P"
                autoCapitalize="characters"
              />
              <PrimaryButton
                label="Entrar no Círculo"
                variant="secondary"
                loading={circleBusy}
                disabled={!friendCode.trim()}
                onPress={() => void joinFriend()}
              />
            </OnbBlock>
            <OnbBlock title="Chamar alguém" hint="O link vale por 7 dias. Quando aceitarem, vocês aparecem um na linha do tempo do outro.">
              <PrimaryButton
                label="Convidar amigos"
                icon="person-add-outline"
                variant="secondary"
                loading={circleBusy}
                onPress={() => void inviteFriends()}
              />
            </OnbBlock>
            {circleMsg ? (
              <Text variant="caption" color={circleMsg.ok ? colors.health : colors.danger}>
                {circleMsg.text}
              </Text>
            ) : null}
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
            subtitle="Toque em Editar e mude aqui mesmo. Não precisa refazer os outros passos."
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
                  <PrimaryButton
                    label={editing === row.step ? 'Fechar' : 'Editar'}
                    variant="link"
                    size="sm"
                    onPress={() => setEditing((cur) => (cur === row.step ? null : row.step))}
                  />
                </View>
              ))}
            </View>
            {editing === 'name' ? (
              <View style={{ gap: space.sm }}>
                <AvatarIconPicker selected={avatarIcon} onSelect={setAvatarIcon} level={1} owned={[]} startersOnly />
                <Field label="Nome ou apelido" value={name} onChangeText={setName} placeholder="Seu nome" autoCapitalize="words" />
              </View>
            ) : null}
            {editing === 'welcome' ? (
              <View style={{ gap: space.sm }}>
                <OnbChoice kind="radio" icon="sunny" title="Clara" selected={mode === 'light'} onPress={() => setMode('light')} />
                <OnbChoice kind="radio" icon="moon" title="Escura" selected={mode === 'dark'} onPress={() => setMode('dark')} />
              </View>
            ) : null}
            {editing === 'modules' ? <ModulePicker value={modules} onToggle={toggleModule} onGroup={setGroup} /> : null}
            {editing === 'tasks' ? <TasksStartForm value={tasksDraft} onChange={setTasksDraft} enabled={modules} /> : null}
            {editing === 'health' ? (
              <HealthStartForm
                value={healthDraft}
                onChange={(d) =>
                {
                  setHealthTouched(true)
                  setHealthDraft(d)
                }}
                enabled={modules}
              />
            ) : null}
            {editing === 'finance' ? <FinanceStartForm value={financeDraft} onChange={setFinanceDraft} enabled={modules} /> : null}
            {editing === 'rhythm' ? (
              <View style={{ gap: space.sm }}>
                {CARE_PACE_OPTIONS.map((opt) => (
                  <OnbChoice key={opt.id} kind="radio" title={opt.label} hint={opt.hint} selected={pace === opt.id} onPress={() => setPace(opt.id)} />
                ))}
                {NOTIFY_CADENCE_OPTIONS.map((opt) => (
                  <OnbChoice key={opt.id} kind="radio" title={opt.label} hint={opt.hint} selected={notifyCadence === opt.id} onPress={() => setNotifyCadence(opt.id)} />
                ))}
                <OnbChoice kind="radio" title="Quero apoio de foco" selected={adhdSupport} onPress={() => setAdhdSupport(true)} />
                <OnbChoice kind="radio" title="Prefiro o modo padrão" selected={!adhdSupport} onPress={() => setAdhdSupport(false)} />
                {GAMIFICATION_MODE_OPTIONS.map((opt) => (
                  <OnbChoice key={opt.id} kind="radio" title={opt.label} hint={opt.hint} selected={gamificationMode === opt.id} onPress={() => setGamificationMode(opt.id)} />
                ))}
              </View>
            ) : null}
            {editing === 'cards' ? (
              <View style={{ gap: space.sm }}>
                {cards.map((c) => (
                  <Text key={c.id} variant="body">{c.nome}</Text>
                ))}
                {cardFormOpen ? (
                  <View style={{ gap: space.sm }}>
                    <FinanceCardForm value={cardDraft} onChange={setCardDraft} previewWidth={280} />
                    {cardMsg ? <Text variant="caption" color={colors.danger}>{cardMsg}</Text> : null}
                    <PrimaryButton label="Salvar cartão" variant="secondary" onPress={saveCard} />
                  </View>
                ) : (
                  <PrimaryButton label="Adicionar cartão" variant="secondary" onPress={() => setCardFormOpen(true)} />
                )}
              </View>
            ) : null}
            {editing === 'circle' ? (
              <View style={{ gap: space.sm }}>
                <Field label="Código do convite" value={friendCode} onChangeText={setFriendCode} placeholder="Ex.: K7M2QX9P" autoCapitalize="characters" />
                <PrimaryButton label="Entrar no Círculo" variant="secondary" loading={circleBusy} disabled={!friendCode.trim()} onPress={() => void joinFriend()} />
                {circleMsg ? <Text variant="caption" color={circleMsg.ok ? colors.health : colors.danger}>{circleMsg.text}</Text> : null}
              </View>
            ) : null}
            {editing === 'home' ? (
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
            ) : null}
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
