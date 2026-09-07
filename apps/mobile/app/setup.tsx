import { useEffect, useState } from 'react'
import { View } from 'react-native'
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
import { Screen, Text, Card, PrimaryButton, Field, PressableScale, Chip } from '../src/ui'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { usePrefsStore } from '../src/store/prefsStore'
import { useGamificationStore } from '../src/store/gamificationStore'
import { widgetsForModuleOrder, type DashboardPriority } from '../src/lib/dashboardWidgets'
import { DEFAULT_HOME_METRICS, type HomeMetricId } from '../src/lib/homeMetrics'
import {
  SETUP_PRIORITY,
  SETUP_STEP_COUNT,
  setupStepTitle,
} from '../src/lib/setupOnboarding'

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
  const { colors, space } = useTheme()
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{
        minHeight: 56,
        padding: space.md,
        borderRadius: 16,
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

/** Onboarding institucional: ensina o app e registra escolhas com cuidado. */
export default function SetupScreen()
{
  const { colors, space, radius, setMode } = useTheme()
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const prefs = usePrefsStore((s) => s.prefs)
  const loaded = usePrefsStore((s) => s.loaded)
  const hydrate = usePrefsStore((s) => s.hydrate)
  const patch = usePrefsStore((s) => s.patch)
  const logEvent = useGamificationStore((s) => s.logEvent)
  const grantXp = useGamificationStore((s) => s.grantXp)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [moduleOrder, setModuleOrder] = useState<DashboardPriority[]>(
    prefs.home_module_order?.length ? prefs.home_module_order : [],
  )
  const [goalCategory, setGoalCategory] = useState<LifeGoalCategory>('custom')
  const [goalTitle, setGoalTitle] = useState(prefs.life_goal?.title ?? '')
  const [goalCadence, setGoalCadence] = useState<LifeGoalCadence>(
    prefs.life_goal?.cadence ?? 'week',
  )
  const [pace, setPace] = useState<CarePace>(prefs.care_pace || 'balanced')
  const [scheme, setScheme] = useState<'light' | 'dark'>(prefs.color_scheme || 'light')
  const [moodOnHome, setMoodOnHome] = useState(true)
  const [notifyCadence, setNotifyCadence] = useState<NotifyCadence>('off')
  const [adhdSupport, setAdhdSupport] = useState(false)
  const [gamificationMode, setGamificationMode] = useState<GamificationMode>('calm')
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
    if (prefs.home_metric_cards)
    {
      setMoodOnHome(prefs.home_metric_cards.includes('humor'))
    }
    if (prefs.notify_cadence)
    {
      setNotifyCadence(prefs.notify_cadence)
    }
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

  const back = () => setStep((s) => Math.max(0, s - 1))
  const next = () => setStep((s) => Math.min(SETUP_STEP_COUNT - 1, s + 1))

  const finish = async () =>
  {
    setSaving(true)
    const order: DashboardPriority[] = moduleOrder.length
      ? moduleOrder
      : ['tasks', 'health', 'finance']
    const primary = order[0] ?? 'tasks'
    const metrics: HomeMetricId[] = moodOnHome
      ? [...DEFAULT_HOME_METRICS]
      : DEFAULT_HOME_METRICS.filter((id) => id !== 'humor')
    const trimmedGoal = goalTitle.trim()
    const template = LIFE_GOAL_TEMPLATES.find((t) => t.id === goalCategory)
    await patch({
      axel_calls_you: name.trim(),
      display_name: name.trim(),
      dashboard_priority: primary,
      home_module_order: order,
      dashboard_quick_widgets: widgetsForModuleOrder(order),
      life_goal: trimmedGoal || template?.example
        ? {
            title: trimmedGoal || template?.example || 'Minha meta',
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
      home_metric_cards: metrics.length ? metrics : ['tasks'],
      home_metrics_configured_at: new Date().toISOString(),
      setup_completed_at: new Date().toISOString(),
    })
    setMode(scheme)
    logEvent('setup', 'AXEL configurado', name.trim() || 'setup')
    grantXp(15, 'Configuração concluída', 'Onboarding')
    setSaving(false)
    router.replace('/(tabs)')
  }

  const nav = (canContinue: boolean, onContinue: () => void) => (
    <View style={{ gap: space.sm }}>
      <PrimaryButton
        label={step === SETUP_STEP_COUNT - 1 ? 'Entrar no aplicativo' : 'Continuar'}
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
          style={{
            flexDirection: 'row',
            gap: 4,
          }}
          accessibilityRole="progressbar"
          accessibilityValue={{ now: step + 1, min: 1, max: SETUP_STEP_COUNT }}
        >
          {Array.from({ length: SETUP_STEP_COUNT }, (_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: radius.pill,
                backgroundColor: i <= step ? colors.axel : colors.hairline,
              }}
            />
          ))}
        </View>
        <Text variant="hero">{setupStepTitle(step)}</Text>

        {step === 0 ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="body">
              Simply Life reúne tarefas, saúde e finanças. O AXEL é o eixo do aplicativo:
              ele apoia, prioriza e registra o que você faz, para o dia caber em uma tela.
            </Text>
            <Text variant="body" muted>
              Você verá o essencial primeiro. Detalhes ficam a um toque, nunca todos de uma vez.
            </Text>
            <Text variant="caption" muted>
              Este aplicativo organiza a rotina. Não substitui psicoterapia, psiquiatria nem
              diagnóstico. Em sofrimento intenso, procure um profissional de saúde ou o CVV (188).
            </Text>
            {nav(true, next)}
          </Card>
        ) : null}

        {step === 1 ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="body" muted>
              Quatro áreas, sempre no mesmo lugar:
            </Text>
            <Text variant="bodyStrong">Início</Text>
            <Text variant="caption" muted>
              O dia de hoje: humor opcional, água, o que vence e um próximo passo.
            </Text>
            <Text variant="bodyStrong">Tarefas</Text>
            <Text variant="caption" muted>
              Lista, pastas, rotina e prazos. Contas próximas do vencimento entram sozinhas.
            </Text>
            <Text variant="bodyStrong">Saúde</Text>
            <Text variant="caption" muted>
              Hidratação, alimentação, treino, medicamentos e diário. Aba Apoio: TDAH, TCC e CVV.
            </Text>
            <Text variant="bodyStrong">Finanças</Text>
            <Text variant="caption" muted>
              Saldo, extrato, cartões e relatórios. O botão central captura um gasto ou uma tarefa.
            </Text>
            {nav(true, next)}
          </Card>
        ) : null}

        {step === 2 ? (
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
            <ChoiceCard
              title="Clara"
              body="Mais luz. Útil se a tela escura aumenta o cansaço."
              active={scheme === 'light'}
              onPress={() => setScheme('light')}
            />
            <ChoiceCard
              title="Escura"
              body="Menos brilho. Melhor à noite e em OLED."
              active={scheme === 'dark'}
              onPress={() => setScheme('dark')}
            />
            {nav(true, next)}
          </Card>
        ) : null}

        {step === 3 ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="body" muted>
              Isto não é diagnóstico. Serve para ajustar quebra de tarefas, linha do dia e
              gamificação opcional. Depois você altera em Saúde → Apoio.
            </Text>
            <ChoiceCard
              title="Quero apoio para foco / TDAH"
              body="Sugestão de passos menores ao capturar tarefas e timeline mais visível."
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

        {step === 4 ? (
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

        {step === 5 ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="body" muted>
              Toque na ordem em que quer ver no Início: primeiro o mais importante para você.
              A ordem aparece nos atalhos e no resumo do dia.
            </Text>
            {SETUP_PRIORITY.map((p) =>
            {
              const pos = moduleOrder.indexOf(p.id)
              const active = pos >= 0
              return (
                <PressableScale
                  key={p.id}
                  onPress={() =>
                  {
                    setModuleOrder((prev) =>
                    {
                      if (prev.includes(p.id))
                      {
                        return prev.filter((x) => x !== p.id)
                      }
                      return [...prev, p.id]
                    })
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={{
                    minHeight: 56,
                    padding: space.md,
                    borderRadius: 16,
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
                    <Text variant="bodyStrong" color={colors.axel}>
                      {pos + 1}º
                    </Text>
                  ) : null}
                </PressableScale>
              )
            })}
            {nav(moduleOrder.length > 0, next)}
          </Card>
        ) : null}

        {step === 6 ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="body" muted>
              Uma meta por semana ou por mês — gastos, sono, saúde mental, tarefa ou o que você
              escolher. Semanal renova todo domingo; mensal, no próximo mês.
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
              <Chip
                label="Semana"
                active={goalCadence === 'week'}
                onPress={() => setGoalCadence('week')}
              />
              <Chip
                label="Mês"
                active={goalCadence === 'month'}
                onPress={() => setGoalCadence('month')}
              />
            </View>
            {nav(Boolean(goalTitle.trim()), next)}
          </Card>
        ) : null}

        {step === 7 ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="body" muted>
              O check-in de humor é um registro pessoal, de 1 a 5. Não é escala clínica e não
              classifica ansiedade nem depressão. Você pode pular qualquer dia.
            </Text>
            <ChoiceCard
              title="Mostrar humor no início"
              body="Um toque ao abrir o app. Dá para desligar depois no perfil."
              active={moodOnHome}
              onPress={() => setMoodOnHome(true)}
            />
            <ChoiceCard
              title="Não mostrar no início"
              body="O diário continua em Saúde. O início fica só com o dia prático."
              active={!moodOnHome}
              onPress={() => setMoodOnHome(false)}
            />
            <Text variant="caption" muted>
              Em Cuidados você registra água, refeições, treino e medicamentos. Nada disso é
              obrigatório no primeiro dia.
            </Text>
            {nav(true, next)}
          </Card>
        ) : null}

        {step === 8 ? (
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

        {step === 9 ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="body" muted>
              Gastos na conta (PIX, débito, dinheiro) saem do saldo na hora. Compras no crédito
              ficam na fatura e só deixam o saldo quando você paga o cartão.
            </Text>
            <Text variant="body" muted>
              Pastas agrupam gastos de um mesmo contexto (viagem, reforma). Relatórios separam
              receita, o que saiu da conta e o que ainda está no cartão. Você pode exportar PDF
              ou Excel quando quiser uma planilha própria.
            </Text>
            <Text variant="caption" muted>
              O aplicativo não julga gastos. Números existem para você decidir, não para cobrar.
            </Text>
            {nav(true, next)}
          </Card>
        ) : null}

        {step === 10 ? (
          <Card tone="elevated" style={{ gap: space.md }}>
            <Text variant="section">Resumo</Text>
            <Text variant="body" muted>
              Vamos te chamar de {name.trim() || 'você'}. Ritmo {CARE_PACE_OPTIONS.find((p) => p.id === pace)?.label.toLowerCase()}.
              Ordem no início:{' '}
              {moduleOrder.map((id) => SETUP_PRIORITY.find((p) => p.id === id)?.label.toLowerCase()).join(' → ') || 'padrão'}.
              Meta: {goalTitle.trim() || 'não definida'} ({goalCadence === 'week' ? 'semana' : 'mês'}).
              Apoio foco/TDAH: {adhdSupport ? 'sim' : 'não'}.
              {adhdSupport ? ` Modo ${GAMIFICATION_MODE_OPTIONS.find((g) => g.id === gamificationMode)?.label.toLowerCase()}.` : ''}
              Humor no início: {moodOnHome ? 'sim' : 'não'}. Alertas:{' '}
              {NOTIFY_CADENCE_OPTIONS.find((p) => p.id === notifyCadence)?.label.toLowerCase()}.
            </Text>
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
