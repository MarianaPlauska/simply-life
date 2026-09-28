import { useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import {
  CARE_PACE_OPTIONS,
  NOTIFY_CADENCE_OPTIONS,
  GAMIFICATION_MODE_OPTIONS,
  LIFE_GOAL_TEMPLATES,
  localTodayIso,
  type CarePace,
  type NotifyCadence,
  type GamificationMode,
  type LifeGoalCadence,
  type LifeGoalCategory,
} from '@simply-life/shared'
import { Screen, Text, Card, PrimaryButton, Field, PressableScale, Chip, Icon } from '../src/ui'
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
import {
  SETUP_PRIORITY,
  SETUP_STEPS,
  SETUP_STEP_COUNT,
  setupStepTitle,
} from '../src/lib/setupOnboarding'
import { CreditCardVisual } from '../src/components/finance/CreditCardVisual'
import {
  FinanceCardForm,
  cardDraftToPatch,
  emptyCardDraft,
  validateCardDraft,
  type CardDraft,
} from '../src/components/finance/FinanceCardForm'

function ChoiceCard({
  title,
  body,
  active,
  onPress,
}: {
  title: string
  body: string
  active: boolean
  onPress: () => void
})
{
  const { colors, space, radius } = useTheme()
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{
        minHeight: 56,
        padding: space.md,
        borderRadius: radius.control,
        gap: 4,
        backgroundColor: active ? colors.axelMuted : colors.elevated,
        borderWidth: 1,
        borderColor: active ? colors.axel : colors.hairline,
      }}
    >
      <Text variant="bodyStrong">{title}</Text>
      <Text variant="caption" muted>
        {body}
      </Text>
    </PressableScale>
  )
}

/** Onboarding: poucos passos, cada um com uma decisão. Tudo pode ser mudado depois. */
export default function SetupScreen()
{
  const { colors, space, radius, setMode } = useTheme()
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const prefs = usePrefsStore((s) => s.prefs)
  const loaded = usePrefsStore((s) => s.loaded)
  const hydrate = usePrefsStore((s) => s.hydrate)
  const patch = usePrefsStore((s) => s.patch)
  const cards = useDataStore((s) => s.financeCards)
  const addCard = useDataStore((s) => s.addFinanceCard)
  const updateCard = useDataStore((s) => s.updateFinanceCard)
  const logEvent = useGamificationStore((s) => s.logEvent)
  const grantXp = useGamificationStore((s) => s.grantXp)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [moduleOrder, setModuleOrder] = useState<DashboardPriority[]>(
    prefs.home_module_order?.length ? prefs.home_module_order : [],
  )
  const [metrics, setMetrics] = useState<HomeMetricId[]>(() => normalizeHomeMetrics(prefs.home_metric_cards))
  const [goalCategory, setGoalCategory] = useState<LifeGoalCategory>('custom')
  const [goalTitle, setGoalTitle] = useState(prefs.life_goal?.title ?? '')
  const [goalCadence, setGoalCadence] = useState<LifeGoalCadence>(
    prefs.life_goal?.cadence ?? 'week',
  )
  const [pace, setPace] = useState<CarePace>(prefs.care_pace || 'balanced')
  const [scheme, setScheme] = useState<'light' | 'dark'>(prefs.color_scheme || 'light')
  const [notifyCadence, setNotifyCadence] = useState<NotifyCadence>('off')
  const [adhdSupport, setAdhdSupport] = useState(false)
  const [gamificationMode, setGamificationMode] = useState<GamificationMode>('calm')
  const [cardFormOpen, setCardFormOpen] = useState(false)
  const [cardDraft, setCardDraft] = useState<CardDraft>(emptyCardDraft)
  const [cardMsg, setCardMsg] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  useEffect(() =>
  {
    if (prefs.axel_calls_you) setName(prefs.axel_calls_you)
    if (prefs.home_module_order?.length) setModuleOrder(prefs.home_module_order)
    if (prefs.life_goal?.title) setGoalTitle(prefs.life_goal.title)
    if (prefs.life_goal?.category) setGoalCategory(prefs.life_goal.category)
    if (prefs.life_goal?.cadence) setGoalCadence(prefs.life_goal.cadence)
    if (prefs.care_pace) setPace(prefs.care_pace)
    if (prefs.color_scheme === 'dark' || prefs.color_scheme === 'light')
    {
      setScheme(prefs.color_scheme)
    }
    if (prefs.home_metric_cards?.length) setMetrics(normalizeHomeMetrics(prefs.home_metric_cards))
    if (prefs.notify_cadence) setNotifyCadence(prefs.notify_cadence)
    if (prefs.adhd_support) setAdhdSupport(true)
    if (prefs.gamification_mode === 'rpg') setGamificationMode('rpg')
  }, [
    prefs.axel_calls_you,
    prefs.home_module_order,
    prefs.life_goal,
    prefs.care_pace,
    prefs.color_scheme,
    prefs.home_metric_cards,
    prefs.notify_cadence,
    prefs.adhd_support,
    prefs.gamification_mode,
  ])

  if (!userId) return <Redirect href="/login" />
  if (loaded && prefs.setup_completed_at)
  {
    return <Redirect href="/(tabs)" />
  }

  const current = SETUP_STEPS[step]
  const back = () => setStep((s) => Math.max(0, s - 1))
  const next = () => setStep((s) => Math.min(SETUP_STEP_COUNT - 1, s + 1))

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

  const finish = async () =>
  {
    setSaving(true)
    const order: DashboardPriority[] = moduleOrder.length
      ? moduleOrder
      : ['tasks', 'health', 'finance']
    const primary = order[0] ?? 'tasks'
    const trimmedGoal = goalTitle.trim()
    await patch({
      axel_calls_you: name.trim(),
      display_name: name.trim(),
      dashboard_priority: primary,
      home_module_order: order,
      dashboard_quick_widgets: widgetsForModuleOrder(order),
      life_goal: trimmedGoal
        ? {
            title: trimmedGoal,
            category: goalCategory,
            cadence: goalCadence,
            periodStart: localTodayIso(),
          }
        : null,
      care_pace: pace,
      notify_cadence: notifyCadence,
      adhd_support: adhdSupport,
      gamification_mode: gamificationMode,
      color_scheme: scheme,
      home_metric_cards: normalizeHomeMetrics(metrics),
      home_metrics_configured_at: new Date().toISOString(),
      setup_completed_at: new Date().toISOString(),
    })
    setMode(scheme)
    logEvent('setup', 'AXEL configurado', name.trim() || 'setup')
    grantXp(15, 'Configuração concluída', 'Onboarding')
    setSaving(false)
    router.replace('/(tabs)')
  }

  const nav = (canContinue: boolean, onContinue: () => void, label?: string) => (
    <View style={{ gap: space.sm }}>
      <PrimaryButton
        label={label ?? (step === SETUP_STEP_COUNT - 1 ? 'Entrar no aplicativo' : 'Continuar')}
        disabled={!canContinue}
        loading={saving}
        onPress={onContinue}
      />
      {step > 0 ? (
        <PrimaryButton label="Voltar" variant="ghost" onPress={back} />
      ) : null}
    </View>
  )

  return (
    <Screen scroll tabBarInset={false}>
      <View style={{ gap: space.lg, paddingTop: space.xl, maxWidth: 480, alignSelf: 'center', width: '100%' }}>
        <Text variant="caption" muted>
          Passo {step + 1} de {SETUP_STEP_COUNT}
        </Text>
        <View
          style={{ flexDirection: 'row', gap: 4 }}
          accessibilityRole="progressbar"
          accessibilityValue={{ now: step + 1, min: 1, max: SETUP_STEP_COUNT }}
        >
          {SETUP_STEPS.map((id, i) => (
            <View
              key={id}
              style={{
                flex: 1,
                height: 4,
                borderRadius: radius.pill,
                backgroundColor: i <= step ? colors.axelFill : colors.hairline,
              }}
            />
          ))}
        </View>
        <Text variant="hero">{setupStepTitle(step)}</Text>

        {current === 'welcome' ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="body">
              Simply Life reúne tarefas, saúde e finanças. O AXEL apoia, prioriza e registra o que
              você faz, para o dia caber em uma tela.
            </Text>
            {[
              { icon: 'home-outline', title: 'Início', body: 'O dia de hoje, do jeito que você escolher no próximo passo.' },
              { icon: 'checkbox-outline', title: 'Tarefas', body: 'Lista, pastas, rotina e prazos. Contas perto do vencimento entram sozinhas.' },
              { icon: 'heart-outline', title: 'Saúde', body: 'Água, sono, treino, medicamentos e diário. Na aba Apoio: TDAH, TCC e CVV.' },
              { icon: 'wallet-outline', title: 'Finanças', body: 'Saldo, cartões, extrato e relatórios. O botão + registra um gasto ou uma tarefa.' },
            ].map((a) => (
              <View key={a.title} style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    backgroundColor: colors.brandMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={a.icon as 'home-outline'} size={18} color={colors.ink} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{a.title}</Text>
                  <Text variant="caption" muted>{a.body}</Text>
                </View>
              </View>
            ))}
            <Text variant="caption" muted>
              Este aplicativo organiza a rotina. Não substitui psicoterapia, psiquiatria nem
              diagnóstico. Em sofrimento intenso, procure um profissional de saúde ou o CVV (188).
            </Text>
            {nav(true, next, 'Começar')}
          </Card>
        ) : null}

        {current === 'name' ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="body" muted>
              Esse nome aparece só para você, na tela inicial. Não é público.
            </Text>
            <Field
              label="Nome ou como prefere ser chamado"
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              autoCapitalize="words"
            />
            {nav(Boolean(name.trim()), next)}
          </Card>
        ) : null}

        {current === 'pace' ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="body" muted>
              Escolha o ritmo das mensagens. Em dias pesados, o aplicativo mostra um único passo.
            </Text>
            {CARE_PACE_OPTIONS.map((opt) => (
              <ChoiceCard
                key={opt.id}
                title={opt.label}
                body={opt.hint}
                active={pace === opt.id}
                onPress={() => setPace(opt.id)}
              />
            ))}
            <Text variant="bodyStrong">Aparência</Text>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <View style={{ flex: 1 }}>
                <ChoiceCard
                  title="Clara"
                  body="Mais luz durante o dia."
                  active={scheme === 'light'}
                  onPress={() =>
                  {
                    setScheme('light')
                    setMode('light')
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ChoiceCard
                  title="Escura"
                  body="Menos brilho, melhor à noite."
                  active={scheme === 'dark'}
                  onPress={() =>
                  {
                    setScheme('dark')
                    setMode('dark')
                  }}
                />
              </View>
            </View>
            {nav(true, next)}
          </Card>
        ) : null}

        {current === 'focus' ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="body" muted>
              Isto não é diagnóstico. Serve para ajustar quebra de tarefas, linha do dia e
              gamificação opcional. Depois você altera em Saúde → Apoio.
            </Text>
            <ChoiceCard
              title="Quero apoio para foco / TDAH"
              body="Sugestão de passos menores ao capturar tarefas e linha do dia mais visível."
              active={adhdSupport}
              onPress={() => setAdhdSupport(true)}
            />
            <ChoiceCard
              title="Prefiro o modo padrão"
              body="Sem ênfase extra. Você pode mudar depois em Preferências."
              active={!adhdSupport}
              onPress={() =>
              {
                setAdhdSupport(false)
                setGamificationMode('calm')
              }}
            />
            {adhdSupport ? (
              <>
                <Text variant="bodyStrong">Motivação</Text>
                {GAMIFICATION_MODE_OPTIONS.map((opt) => (
                  <ChoiceCard
                    key={opt.id}
                    title={opt.label}
                    body={opt.hint}
                    active={gamificationMode === opt.id}
                    onPress={() => setGamificationMode(opt.id)}
                  />
                ))}
              </>
            ) : null}
            {nav(true, next)}
          </Card>
        ) : null}

        {current === 'home' ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="bodyStrong">O que vem primeiro</Text>
            <Text variant="caption" muted style={{ marginTop: -space.sm }}>
              Toque na ordem de importância. Ela define os atalhos e o resumo do dia.
            </Text>
            {SETUP_PRIORITY.map((p) =>
            {
              const pos = moduleOrder.indexOf(p.id)
              const active = pos >= 0
              return (
                <PressableScale
                  key={p.id}
                  onPress={() =>
                    setModuleOrder((prev) => (prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]))}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={{
                    minHeight: 56,
                    padding: space.md,
                    borderRadius: radius.control,
                    gap: 4,
                    backgroundColor: active ? colors.axelMuted : colors.elevated,
                    borderWidth: 1,
                    borderColor: active ? colors.axel : colors.hairline,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text variant="bodyStrong">{p.label}</Text>
                    <Text variant="caption" muted>{p.hint}</Text>
                  </View>
                  {active ? (
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        backgroundColor: colors.axelFill,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text variant="label" color={colors.axelOnFill}>{pos + 1}</Text>
                    </View>
                  ) : null}
                </PressableScale>
              )
            })}

            <Text variant="bodyStrong" style={{ marginTop: space.sm }}>Resumo no topo do Início</Text>
            <Text variant="caption" muted style={{ marginTop: -space.sm }}>
              Escolha os números que você quer ver ao abrir o app. Humor é opcional e nunca é diagnóstico.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {HOME_METRIC_CATALOG.map((m) =>
              {
                const on = metrics.includes(m.id)
                return (
                  <PressableScale
                    key={m.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    onPress={() => setMetrics((prev) => toggleHomeMetric(prev, m.id))}
                    style={{
                      width: '48%',
                      flexGrow: 1,
                      minHeight: 64,
                      padding: space.sm + 2,
                      borderRadius: radius.control,
                      backgroundColor: on ? colors.brandMuted : colors.elevated,
                      borderWidth: 1,
                      borderColor: on ? colors.brand : colors.hairline,
                      gap: 2,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text variant="bodyStrong">{m.label}</Text>
                      <Icon name={on ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={on ? colors.health : colors.inkFaint} />
                    </View>
                    <Text variant="micro" muted>{m.hint}</Text>
                  </PressableScale>
                )
              })}
            </View>
            <Text variant="caption" muted>
              {metrics.length} {metrics.length === 1 ? 'item escolhido' : 'itens escolhidos'}. Dá para mudar em Mais → Personalizar Início.
            </Text>
            {nav(moduleOrder.length > 0, next)}
          </Card>
        ) : null}

        {current === 'cards' ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="body" muted>
              Cadastre seus cartões de crédito para acompanhar limite, fatura e vencimento. Gastos no
              débito ou PIX saem do saldo na hora; no crédito, só quando você paga a fatura.
            </Text>

            {cards.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
                {cards.map((c) => (
                  <CreditCardVisual key={c.id} card={c} width={240} />
                ))}
              </ScrollView>
            ) : null}
            {cardMsg && !cardFormOpen ? (
              <Text variant="caption" color={colors.health}>{cardMsg}</Text>
            ) : null}

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
                  <PrimaryButton label="Salvar cartão" style={{ flex: 1 }} onPress={saveCard} />
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

            {cardFormOpen ? null : nav(true, next, cards.length ? 'Continuar' : 'Pular por agora')}
          </Card>
        ) : null}

        {current === 'goal' ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="body" muted>
              Uma meta por semana ou por mês: gastos, sono, saúde mental, tarefa ou o que você
              escolher. Semanal renova todo domingo; mensal, no próximo mês. É opcional.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {LIFE_GOAL_TEMPLATES.map((t) => (
                <Chip
                  key={t.id}
                  label={t.label}
                  active={goalCategory === t.id}
                  onPress={() =>
                  {
                    setGoalCategory(t.id)
                    if (!goalTitle.trim()) setGoalTitle(t.example)
                  }}
                />
              ))}
            </View>
            <Field
              label="Sua meta"
              placeholder="O que você quer alcançar?"
              value={goalTitle}
              onChangeText={setGoalTitle}
              multiline
              style={{ minHeight: 72, textAlignVertical: 'top', paddingTop: 14 }}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip label="Semana" active={goalCadence === 'week'} onPress={() => setGoalCadence('week')} />
              <Chip label="Mês" active={goalCadence === 'month'} onPress={() => setGoalCadence('month')} />
            </View>
            {nav(true, next, goalTitle.trim() ? 'Continuar' : 'Pular por agora')}
          </Card>
        ) : null}

        {current === 'alerts' ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="body" muted>
              Alertas frequentes aumentam tensão. O aplicativo não cobra sequência e não envia
              urgência à noite. Medicamentos continuam podendo lembrar, se você cadastrar horários.
            </Text>
            {NOTIFY_CADENCE_OPTIONS.map((opt) => (
              <ChoiceCard
                key={opt.id}
                title={opt.label}
                body={opt.hint}
                active={notifyCadence === opt.id}
                onPress={() => setNotifyCadence(opt.id)}
              />
            ))}
            <Text variant="caption" muted>
              Horário silencioso: 22h às 8h. Três leituras por dia: 9h, 15h e 21h. Você pode mudar isso em Preferências.
            </Text>
            {nav(true, next)}
          </Card>
        ) : null}

        {current === 'summary' ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            {[
              ['Nome', name.trim() || 'Não informado'],
              ['Ritmo', CARE_PACE_OPTIONS.find((p) => p.id === pace)?.label ?? ''],
              ['Aparência', scheme === 'dark' ? 'Escura' : 'Clara'],
              ['Ordem no Início', moduleOrder.map((id) => SETUP_PRIORITY.find((p) => p.id === id)?.label).join(', ') || 'Padrão'],
              ['Resumo do Início', metrics.map((id) => HOME_METRIC_CATALOG.find((m) => m.id === id)?.label).join(', ')],
              ['Cartões', cards.length ? cards.map((c) => c.nome).join(', ') : 'Nenhum por enquanto'],
              ['Meta', goalTitle.trim() ? `${goalTitle.trim()} (${goalCadence === 'week' ? 'semana' : 'mês'})` : 'Sem meta por enquanto'],
              ['Apoio foco/TDAH', adhdSupport ? 'Sim' : 'Não'],
              ['Alertas', NOTIFY_CADENCE_OPTIONS.find((p) => p.id === notifyCadence)?.label ?? ''],
            ].map(([k, v], i) => (
              <View
                key={k}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: space.md,
                  paddingTop: i === 0 ? 0 : space.sm,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.hairline,
                }}
              >
                <Text variant="caption" muted>{k}</Text>
                <Text variant="label" style={{ flexShrink: 1, textAlign: 'right' }}>{v}</Text>
              </View>
            ))}
            <Text variant="caption" muted>
              Tudo isso pode ser alterado em Perfil e Preferências. Se o dia pesar, um único
              passo já basta. Cuidado profissional continua sendo o caminho para saúde mental.
            </Text>
            {nav(true, () => void finish())}
          </Card>
        ) : null}
      </View>
    </Screen>
  )
}
