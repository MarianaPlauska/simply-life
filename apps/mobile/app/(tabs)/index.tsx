import { useEffect, useMemo, useState } from 'react'
import { View, Modal, Pressable, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import {
  partitionTodayTimeline,
  formatBRL,
  monthExpenseTotal,
  findHabit,
  priorityTodayTasks,
  moodLabel,
  humorDoDia,
  AGUA_META_COPOS,
} from '@simply-life/shared'
import {
  Screen,
  Text,
  Card,
  PrimaryButton,
  ListRow,
} from '../../src/ui'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useAuthStore } from '../../src/store/authStore'
import { useDataStore } from '../../src/store/dataStore'
import { HomeFitnessHero } from '../../src/components/dashboard/HomeFitnessHero'
import { HomeMetricShortcuts } from '../../src/components/dashboard/HomeMetricShortcuts'
import { HomeKpiSquares } from '../../src/components/dashboard/HomeKpiSquares'
import { HomeActivityHeatmap } from '../../src/components/dashboard/HomeActivityHeatmap'
import { HomeCollapsible } from '../../src/components/dashboard/HomeCollapsible'
import { AxelDayBrief, HomeDriveAside } from '../../src/components/dashboard/HomeDriveAside'
import { HomePanorama } from '../../src/components/dashboard/HomePanorama'
import { DashboardQuickWidgets } from '../../src/components/dashboard/DashboardQuickWidgets'
import { HomeHealthStudio } from '../../src/components/dashboard/HomeHealthStudio'
import { HomeAgendaStudio } from '../../src/components/dashboard/HomeAgendaStudio'
import { HomeMentalStudio } from '../../src/components/dashboard/HomeMentalStudio'
import { HomeMedsStudio } from '../../src/components/dashboard/HomeMedsStudio'
import { HomeWaterProgressCard } from '../../src/components/dashboard/HomeWaterProgressCard'
import { HomeTodayDashboard } from '../../src/components/dashboard/HomeTodayDashboard'
import { HomeMorningRitual } from '../../src/components/dashboard/HomeMorningRitual'
import { HomeDayTimeline } from '../../src/components/dashboard/HomeDayTimeline'
import { MoodWeekReportGate } from '../../src/components/dashboard/MoodWeekReportCard'
import { HomeCompanionStrip } from '../../src/components/dashboard/HomeCompanionStrip'
import { HomeRpgStrip } from '../../src/components/dashboard/HomeRpgStrip'
import { PersonalSummaryGrid } from '../../src/components/dashboard/PersonalSummaryGrid'
import { LifeSummaryReport } from '../../src/components/metrics/LifeSummaryReport'
import { TabShell } from '../../src/components/dashboard/TabShell'
import { useWorkspace } from '../../src/layout/useWorkspace'
import { usePrefsStore } from '../../src/store/prefsStore'
import { normalizeHomeMetrics } from '../../src/lib/homeMetrics'
import { resolveAxelName } from '../../src/lib/axelName'
import type { DashboardPriority } from '../../src/lib/dashboardWidgets'

function greetingForHour(h: number): string
{
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function DashboardScreen()
{
  const { colors, space, mode, setMode } = useTheme()
  const { showRail, isDesktop, isTablet, width } = useWorkspace()
  const router = useRouter()
  const email = useAuthStore((s) => s.sessionEmail)
  const isGuest = useAuthStore((s) => s.isGuest)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const refreshAdminFlag = useAuthStore((s) => s.refreshAdminFlag)
  const signOut = useAuthStore((s) => s.signOut)
  const tasks = useDataStore((s) => s.tasks) ?? []
  const finance = useDataStore((s) => s.finance) ?? []
  const habits = useDataStore((s) => s.habits) ?? []
  const humor = useDataStore((s) => s.humor) ?? []
  const loading = useDataStore((s) => s.loading)
  const refreshAll = useDataStore((s) => s.refreshAll)
  const prefs = usePrefsStore((s) => s.prefs)
  const prefsLoaded = usePrefsStore((s) => s.loaded)
  const hydratePrefs = usePrefsStore((s) => s.hydrate)

  const today = useMemo(() => partitionTodayTimeline(tasks), [tasks])
  const todayIso = new Date().toISOString().slice(0, 10)
  const openTasks = useMemo(() => tasks.filter((t) => t.status !== 'done'), [tasks])
  const doneToday = useMemo(
    () =>
      tasks.filter(
        (t) => t.status === 'done' && t.dataVencimento?.slice(0, 10) === todayIso,
      ).length,
    [tasks, todayIso],
  )
  const gastosMes = monthExpenseTotal(finance) ?? 0
  const focusTask = useMemo(
    () => priorityTodayTasks(tasks, new Date(), 1)[0]?.task ?? null,
    [tasks],
  )
  const agua = findHabit(habits, 'agua')
  const sono = findHabit(habits, 'sono')
  const waterLabel = agua
    ? `${agua.progressoAtual}/${agua.metaDiaria ?? AGUA_META_COPOS}`
    : '-'
  const homeMetrics = normalizeHomeMetrics(prefs.home_metric_cards)
  const waterOnHome = homeMetrics.includes('water')
  const humorOnHome = homeMetrics.includes('humor')
  const sleepOnHome = homeMetrics.includes('sleep')
  const statsOnHome = homeMetrics.includes('stats')
  const isMorning = new Date().getHours() < 14
  const sleepDone = (sono?.progressoAtual ?? 0) > 0
  const showSleepForm = sleepOnHome && isMorning && !sleepDone
  const humorHoje = humorDoDia(humor)?.humor
  const moodDone = humorHoje != null
  const lowMood = humorHoje != null && humorHoje <= 2
  const showMoodForm = humorOnHome && !moodDone
  const showMorningRitual = showSleepForm || showMoodForm
  const [axelUntil, setAxelUntil] = useState(0)
  const rpgMode = prefs.gamification_mode === 'rpg'
  const [axelTick, setAxelTick] = useState(0)
  const showAxel = humorOnHome && moodDone && Date.now() < axelUntil
  const moduleOrder = prefs.home_module_order ?? ['tasks', 'health', 'finance']

  const kpiItems = useMemo(() =>
  {
    const byModule: Record<DashboardPriority, {
      id: string
      label: string
      value: string
      icon: 'checkbox-outline' | 'happy-outline' | 'wallet-outline'
      color: string
      onPress: () => void
    }> = {
      tasks: {
        id: 'tasks',
        label: 'Tarefas',
        value: openTasks.length === 1 ? '1 aberta' : `${openTasks.length} abertas`,
        icon: 'checkbox-outline',
        color: colors.tasks,
        onPress: () => router.push('/(tabs)/kanban'),
      },
      health: {
        id: 'mood',
        label: 'Humor',
        value: humorHoje != null ? moodLabel(humorHoje) : 'Sem check-in',
        icon: 'happy-outline',
        color: colors.health,
        onPress: () => router.push('/(tabs)/saude'),
      },
      finance: {
        id: 'finance',
        label: 'Gastos',
        value:
          gastosMes >= 1000
            ? `${(gastosMes / 1000).toFixed(1).replace('.', ',')} mil no mês`
            : `${formatBRL(gastosMes)} no mês`,
        icon: 'wallet-outline',
        color: colors.finance,
        onPress: () => router.push('/(tabs)/financeiro'),
      },
    }
    const tail = waterOnHome
      ? {
          id: 'goals',
          label: 'Feitas hoje',
          value: doneToday === 1 ? '1 tarefa' : `${doneToday} tarefas`,
          icon: 'flag-outline' as const,
          color: colors.axel,
          onPress: () => router.push('/(tabs)/kanban'),
        }
      : {
          id: 'water',
          label: 'Água',
          value: waterLabel === '-' ? 'Sem meta' : `${waterLabel} copos`,
          icon: 'water-outline' as const,
          color: colors.health,
          onPress: () => router.push('/(tabs)/saude'),
        }
    return [...moduleOrder.map((m) => byModule[m]), tail]
  }, [
    moduleOrder,
    openTasks.length,
    humorHoje,
    gastosMes,
    waterOnHome,
    doneToday,
    waterLabel,
    colors,
    router,
  ])

  useEffect(() =>
  {
    const left = axelUntil - Date.now()
    if (left <= 0) return
    const id = setTimeout(() => setAxelTick((n) => n + 1), left)
    return () => clearTimeout(id)
  }, [axelUntil, axelTick])

  const [menuOpen, setMenuOpen] = useState(false)
  const [inviteDismissed, setInviteDismissed] = useState(false)
  const name = resolveAxelName({
    isGuest,
    callsYou: prefs.axel_calls_you,
    displayName: prefs.display_name,
    email,
  })
  const greet = greetingForHour(new Date().getHours())
  const dateLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const needsPersonalize =
    prefsLoaded && !prefs.home_metrics_configured_at && !inviteDismissed

  useEffect(() =>
  {
    void hydratePrefs()
    void refreshAdminFlag()
  }, [hydratePrefs, refreshAdminFlag])

  return (
    <Screen
      scroll
      refreshing={loading}
      onRefresh={() => void refreshAll({ isGuest })}
    >
      <TabShell>
        <HomeFitnessHero
          greet={greet}
          name={name}
          dateLabel={dateLabel}
          isAdmin={isAdmin}
          onAccount={() => setMenuOpen(true)}
        />

        <HomeTodayDashboard
          tasks={tasks}
          finance={finance}
          pending={openTasks.length}
          doneToday={doneToday}
          ritualSlot={
            showMorningRitual ? (
              <HomeMorningRitual
                needSleep={showSleepForm}
                needMood={showMoodForm}
                onMoodRegistered={() => setAxelUntil(Date.now() + 60_000)}
              />
            ) : null
          }
        />

        <MoodWeekReportGate humor={humor} />

        {rpgMode ? <HomeRpgStrip /> : null}

        <HomeDayTimeline tasks={today} />

        {showAxel || waterOnHome ? (
          (isDesktop || isTablet) && waterOnHome ? (
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'stretch' }}>
              <View style={{ flex: 1, minWidth: 0, gap: 12 }}>
                {showAxel ? <AxelDayBrief /> : null}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <HomeWaterProgressCard compact={Boolean(isDesktop && width >= 1280)} />
              </View>
            </View>
          ) : (
            <>
              {showAxel ? <AxelDayBrief /> : null}
              {waterOnHome ? <HomeWaterProgressCard /> : null}
            </>
          )
        ) : null}

        {lowMood && moodDone ? <HomeCompanionStrip lowMood /> : null}

        {statsOnHome ? (
          <View style={{ gap: 8 }}>
            <Text variant="section">Desempenho</Text>
            <LifeSummaryReport variant="compact" />
          </View>
        ) : null}

        <View style={{ gap: 12 }}>
          <Text variant="section" style={{ fontSize: 22, letterSpacing: -0.4 }}>
            Seu dia
          </Text>
          <HomeKpiSquares items={kpiItems} />
        </View>

        <View style={{ gap: 12 }}>
          <Text variant="section" style={{ fontSize: 17 }}>
            Atalhos
          </Text>
          <HomeMetricShortcuts />
        </View>

        <PersonalSummaryGrid />

        {prefsLoaded && !prefs.home_metrics_configured_at ? (
          <Pressable
            onPress={() => router.push('/personalizar-inicio')}
            style={{ paddingVertical: 4 }}
          >
            <Text variant="caption" muted>
              Quando quiser, personalize seu Início
            </Text>
          </Pressable>
        ) : null}

        <View
          style={{
            flexDirection: showRail ? 'row' : 'column',
            alignItems: showRail ? 'stretch' : undefined,
            gap: showRail ? 24 : space.xl,
          }}
        >
          <View style={{ flex: showRail ? 8 : undefined, minWidth: 0, gap: space.xl }}>
            <HomeCollapsible
              title="Resumo do dia"
              subtitle={statsOnHome ? 'Agenda, saúde, remédios e panorama' : 'Desempenho, agenda e panorama'}
              pill="abrir"
              defaultOpen={false}
            >
              <View style={{ gap: space.sm, paddingTop: space.xs }}>
                {!statsOnHome ? <LifeSummaryReport variant="compact" /> : null}
                <View style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="section">Em seguida</Text>
                    <Pressable
                      onPress={() => router.push('/(tabs)/kanban')}
                      style={{ minHeight: 44, justifyContent: 'center' }}
                    >
                      <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
                        Ver tudo
                      </Text>
                    </Pressable>
                  </View>
                  {today.slice(0, 3).length === 0 ? (
                    <Text variant="caption" muted>
                      Nada urgente na fila. Capture uma tarefa quando quiser.
                    </Text>
                  ) : (
                    today.slice(0, 3).map((t) => (
                      <Pressable
                        key={t.id}
                        onPress={() => router.push(`/task/${t.id}`)}
                        style={{
                          borderRadius: 16,
                          backgroundColor: colors.elevated,
                          padding: 14,
                          minHeight: 52,
                          justifyContent: 'center',
                        }}
                      >
                        <Text variant="bodyStrong" numberOfLines={1}>
                          {t.titulo}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </View>
                <HomeAgendaStudio tasks={tasks} />
                <HomeActivityHeatmap tasks={tasks} />
                <HomeHealthStudio />
                <HomeMentalStudio />
                <HomeMedsStudio />
                <HomeCollapsible
                  title="Atalhos"
                  subtitle="Humor, água e tarefas críticas"
                  pill="extra"
                  defaultOpen={false}
                >
                  <DashboardQuickWidgets />
                </HomeCollapsible>
                <HomeCollapsible
                  title="Panorama"
                  subtitle="Gráficos e ranking do mês"
                  pill="finanças"
                  pillColor={colors.finance}
                  defaultOpen={false}
                >
                  <HomePanorama />
                </HomeCollapsible>
                <PrimaryButton
                  label="Abrir Saúde"
                  variant="secondary"
                  onPress={() => router.push('/(tabs)/saude')}
                />
              </View>
            </HomeCollapsible>
          </View>
          {showRail ? (
            <View style={{ flex: 4, minWidth: 260, maxWidth: 360 }}>
              <HomeDriveAside todayTasks={today} />
            </View>
          ) : null}
        </View>
      </TabShell>

      <Modal
        visible={needsPersonalize}
        transparent
        animationType="fade"
        onRequestClose={() => setInviteDismissed(true)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.overlay,
            justifyContent: 'center',
            padding: space.lg,
          }}
        >
          <Card tone="elevated" style={{ gap: space.md, borderRadius: 20, maxWidth: 420, alignSelf: 'center', width: '100%' }}>
            <Text variant="section">Personalize seu Início</Text>
            <Text variant="body" muted>
              Escolha Humor, Água, Tarefas e o que mais importa. Sem cobrança, no seu ritmo.
            </Text>
            <PrimaryButton
              label="Escolher atalhos"
              onPress={() =>
              {
                setInviteDismissed(true)
                router.push('/personalizar-inicio')
              }}
            />
            <PrimaryButton
              label="Agora não"
              variant="ghost"
              onPress={() =>
              {
                setInviteDismissed(true)
                void usePrefsStore.getState().patch({
                  home_metrics_configured_at: new Date().toISOString(),
                })
              }}
            />
          </Card>
        </View>
      </Modal>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <Pressable
            accessibilityLabel="Fechar menu"
            onPress={() => setMenuOpen(false)}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          />
          <ScrollView
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxWidth: 480,
              maxHeight: '80%',
              alignSelf: 'center',
              width: '100%',
            }}
            contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl, gap: space.md }}
          >
            <View style={{ gap: 4 }}>
              <Text variant="section">Mais</Text>
              <Text variant="caption" muted>
                Conta, personalização e atalhos
              </Text>
            </View>
            <Card tone="elevated" style={{ paddingVertical: space.xs, borderRadius: 20 }}>
              {(
                [
                  { label: 'Perfil', subtitle: 'Conta e foto', href: '/perfil' },
                  { label: 'Configurações', subtitle: 'App e integrações', href: '/configuracoes' },
                  { label: 'Histórico AXEL', subtitle: 'Briefings e decisões', href: '/axel/historico' },
                  { label: 'Personalizar Início', subtitle: 'Atalhos da Home', href: '/personalizar-inicio' },
                  { label: 'Preferências', subtitle: 'Notificações e hábitos', href: '/preferencias' },
                  { label: 'Relatórios', subtitle: 'Resumos semanais', href: '/relatorios' },
                  { label: 'Calendário', subtitle: 'Agenda visual', href: '/calendario' },
                  { label: 'Anotações', subtitle: 'Notas rápidas', href: '/anotacoes' },
                  { label: 'Ofensiva', subtitle: 'Dias no app e no plano', href: '/ofensiva' },
                  { label: 'Modo foco', subtitle: 'Timer e prioridade', href: '/foco' },
                ] as const
              ).map((item, i, arr) => (
                <ListRow
                  key={item.href}
                  title={item.label}
                  subtitle={item.subtitle}
                  right="›"
                  showSeparator={i < arr.length - 1}
                  onPress={() =>
                  {
                    setMenuOpen(false)
                    router.push(item.href)
                  }}
                />
              ))}
            </Card>
            <Card tone="elevated" style={{ paddingVertical: space.xs, borderRadius: 20 }}>
              <ListRow
                title={mode === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
                subtitle="Aparência do app"
                onPress={() =>
                {
                  const next = mode === 'dark' ? 'light' : 'dark'
                  setMode(next)
                }}
                showSeparator
              />
              <ListRow
                title="Sair"
                subtitle="Encerrar sessão neste aparelho"
                onPress={() =>
                {
                  setMenuOpen(false)
                  void signOut()
                  router.replace('/login')
                }}
              />
            </Card>
            <PrimaryButton label="Fechar" variant="dismiss" onPress={() => setMenuOpen(false)} />
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  )
}
