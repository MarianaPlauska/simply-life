import { useEffect, useMemo, useState } from 'react'
import { View, Modal, Pressable, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import {
  partitionTodayTimeline,
  monthExpenseTotal,
  findHabit,
  moodLabel,
  humorDoDia,
  AGUA_META_COPOS,
  classifyDueBucket,
} from '@simply-life/shared'
import { Screen, Text, Card, PrimaryButton, ListRow } from '../../src/ui'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useAuthStore } from '../../src/store/authStore'
import { useDataStore } from '../../src/store/dataStore'
import { HomeFitnessHero } from '../../src/components/dashboard/HomeFitnessHero'
import { HomeWaterProgressCard } from '../../src/components/dashboard/HomeWaterProgressCard'
import { HomeMorningRitual } from '../../src/components/dashboard/HomeMorningRitual'
import { MoodWeekReportGate } from '../../src/components/dashboard/MoodWeekReportCard'
import { DayPlanHomeCard } from '../../src/components/rhythm/DayPlanHomeCard'
import { VisualDayCard } from '../../src/components/rhythm/VisualDayCard'
import { SalaryConfirmCard } from '../../src/components/finance/FinanceForecastCards'
import { HomeMetricShortcuts } from '../../src/components/dashboard/HomeMetricShortcuts'
import { HomeKpiSquares } from '../../src/components/dashboard/HomeKpiSquares'
import { HomeDayTimeline } from '../../src/components/dashboard/HomeDayTimeline'
import { HomeTodayDashboard } from '../../src/components/dashboard/HomeTodayDashboard'
import { LifeGoalMicroLine, LifeGoalSheet } from '../../src/components/dashboard/LifeGoalSheet'
import { TabShell, DESKTOP_CONTENT_MAX } from '../../src/components/dashboard/TabShell'
import { WebStatRow, type WebStatItem } from '../../src/components/dashboard/web/WebStatRow'
import { WebTodayAgenda } from '../../src/components/dashboard/web/WebTodayAgenda'
import { WebFinanceSnapshot } from '../../src/components/dashboard/web/WebFinanceSnapshot'
import { WebBodyMetrics } from '../../src/components/dashboard/web/WebBodyMetrics'
import { WebHydrationWidget } from '../../src/components/dashboard/web/WebHydrationWidget'
import { WebMoodCheckIn } from '../../src/components/dashboard/web/WebMoodCheckIn'
import { WebShortcutsBar } from '../../src/components/dashboard/web/WebShortcutsBar'
import { webStyle } from '../../src/components/dashboard/web/webStyle'
import { useWorkspace } from '../../src/layout/useWorkspace'
import { usePrefsStore } from '../../src/store/prefsStore'
import { normalizeHomeMetrics } from '../../src/lib/homeMetrics'
import { resolveAxelName } from '../../src/lib/axelName'

function greetingForHour(h: number): string
{
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

/**
 * Início — build web. Arquivo à parte (Metro resolve `.web.tsx` só no browser,
 * nunca no app nativo) porque a versão desktop precisa de uma grade real,
 * não dos mesmos cards do mobile espremidos em colunas.
 */
export default function DashboardScreenWeb()
{
  const { colors, space } = useTheme()
  const { isDesktop } = useWorkspace()
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
    () => tasks.filter((t) => t.status === 'done' && t.dataVencimento?.slice(0, 10) === todayIso).length,
    [tasks, todayIso],
  )
  const overdueToday = useMemo(
    () => openTasks.filter((t) => classifyDueBucket(t.dataVencimento, t.status) === 'vencido').length,
    [openTasks],
  )
  const gastosMes = monthExpenseTotal(finance) ?? 0
  const agua = findHabit(habits, 'agua')
  const sono = findHabit(habits, 'sono')
  const waterLabel = agua ? `${agua.progressoAtual}/${agua.metaDiaria ?? AGUA_META_COPOS}` : '-'
  const homeMetrics = normalizeHomeMetrics(prefs.home_metric_cards)
  const waterOnHome = homeMetrics.includes('water')
  const humorOnHome = homeMetrics.includes('humor')
  const sleepOnHome = homeMetrics.includes('sleep')
  const isMorning = new Date().getHours() < 14
  const sleepDone = (sono?.progressoAtual ?? 0) > 0
  const showSleepForm = sleepOnHome && isMorning && !sleepDone
  const humorHoje = humorDoDia(humor)?.humor
  const moodDone = humorHoje != null
  const showMoodForm = humorOnHome && !moodDone
  const showMorningRitual = showSleepForm || showMoodForm

  const [goalOpen, setGoalOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
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

  useEffect(() =>
  {
    void hydratePrefs()
    void refreshAdminFlag()
  }, [hydratePrefs, refreshAdminFlag])

  const statItems: WebStatItem[] = [
    {
      id: 'tasks',
      label: 'Tarefas abertas',
      value: String(openTasks.length),
      hint: overdueToday > 0 ? `${overdueToday} atrasada${overdueToday === 1 ? '' : 's'}` : undefined,
      icon: 'checkbox-outline',
      color: colors.tasks,
      onPress: () => router.push('/(tabs)/kanban'),
    },
    {
      id: 'done',
      label: 'Feitas hoje',
      value: String(doneToday),
      icon: 'checkmark-circle-outline',
      color: colors.axel,
      onPress: () => router.push('/(tabs)/kanban'),
    },
    {
      id: 'mood',
      label: 'Humor de hoje',
      value: humorHoje != null ? moodLabel(humorHoje) : 'Sem check-in',
      icon: 'happy-outline',
      color: colors.health,
      onPress: () => router.push('/(tabs)/saude'),
    },
    {
      id: 'finance',
      label: 'Gastos no mês',
      value:
        gastosMes >= 1000
          ? `${(gastosMes / 1000).toFixed(1).replace('.', ',')} mil`
          : gastosMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      icon: 'wallet-outline',
      color: colors.finance,
      onPress: () => router.push('/(tabs)/financeiro'),
    },
    {
      id: 'water',
      label: 'Hidratação',
      value: waterLabel === '-' ? 'Sem meta' : `${waterLabel} copos`,
      icon: 'water-outline',
      color: colors.health,
      onPress: () => router.push('/(tabs)/saude'),
    },
  ]

  if (!isDesktop)
  {
    // Navegador estreito (celular): mantém a mesma composição visual do app mobile.
    return (
      <Screen scroll refreshing={loading} onRefresh={() => void refreshAll({ isGuest })}>
        <TabShell>
          <HomeFitnessHero greet={greet} name={name} dateLabel={dateLabel} isAdmin={isAdmin} onAccount={() => setMenuOpen(true)} />
          <HomeTodayDashboard
            tasks={tasks}
            finance={finance}
            pending={openTasks.length}
            doneToday={doneToday}
            ritualSlot={
              showMorningRitual ? (
                <HomeMorningRitual needSleep={showSleepForm} needMood={showMoodForm} />
              ) : null
            }
          />
          <SalaryConfirmCard />

          <DayPlanHomeCard />

          <VisualDayCard />

          <MoodWeekReportGate humor={humor} />
          <HomeDayTimeline tasks={today} />
          {waterOnHome ? <HomeWaterProgressCard /> : null}
          <View style={{ gap: 12 }}>
            <Text variant="section" style={{ fontSize: 22, letterSpacing: -0.4 }}>
              Seu dia
            </Text>
            <HomeKpiSquares
              items={statItems.slice(0, 4).map((s) => ({
                id: s.id,
                label: s.label,
                value: s.value,
                icon: s.icon,
                color: s.color,
                onPress: s.onPress,
              }))}
            />
          </View>
          <View style={{ gap: 12 }}>
            <Text variant="section" style={{ fontSize: 17 }}>
              Atalhos
            </Text>
            <HomeMetricShortcuts />
          </View>
        </TabShell>
      </Screen>
    )
  }

  return (
    <Screen scroll refreshing={loading} onRefresh={() => void refreshAll({ isGuest })}>
      <LifeGoalSheet visible={goalOpen} onClose={() => setGoalOpen(false)} />
      <TabShell>
        <View style={{ maxWidth: DESKTOP_CONTENT_MAX, width: '100%', alignSelf: 'center', gap: 28 }}>
          <View style={{ gap: 8 }}>
            <HomeFitnessHero
              greet={greet}
              name={name}
              dateLabel={dateLabel}
              isAdmin={isAdmin}
              onAccount={() => setMenuOpen(true)}
            />
            <LifeGoalMicroLine onPress={() => setGoalOpen(true)} />
          </View>

          <View style={{ gap: 20 }}>
            <WebStatRow items={statItems} />

            {showMorningRitual ? (
              <WebMoodCheckIn needSleep={showSleepForm} needMood={showMoodForm} />
            ) : null}
          </View>

          <View
            style={webStyle({
              display: 'grid',
              gridTemplateColumns: '1fr 340px',
              gap: 20,
              alignItems: 'start',
            })}
          >
            <View style={{ gap: 16, minWidth: 0 }}>
              <WebTodayAgenda tasks={today} overdueCount={overdueToday} />
              <WebFinanceSnapshot finance={finance} />
              <WebBodyMetrics />
            </View>

            <View style={{ gap: 16, minWidth: 0 }}>
              <SalaryConfirmCard />

              <DayPlanHomeCard />

              <VisualDayCard />

              <MoodWeekReportGate humor={humor} />
              {waterOnHome ? <WebHydrationWidget /> : null}
              <WebShortcutsBar />
            </View>
          </View>

          {prefsLoaded && !prefs.home_metrics_configured_at ? (
            <Pressable onPress={() => router.push('/personalizar-inicio')} style={{ paddingVertical: 4 }}>
              <Text variant="caption" muted>
                Quando quiser, personalize seu Início
              </Text>
            </Pressable>
          ) : null}
        </View>
      </TabShell>

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
            <PrimaryButton
              label="Sair"
              variant="ghost"
              onPress={() =>
              {
                setMenuOpen(false)
                void signOut()
                router.replace('/login')
              }}
            />
            <PrimaryButton label="Fechar" variant="dismiss" onPress={() => setMenuOpen(false)} />
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  )
}
