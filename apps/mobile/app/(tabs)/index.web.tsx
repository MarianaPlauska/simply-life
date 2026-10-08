import { useEffect, useMemo, useState } from 'react'
import { View, Pressable, ScrollView } from 'react-native'
import { Modal } from '../../src/ui/Modal'
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
import { AxelDayBrief } from '../../src/components/dashboard/HomeDriveAside'
import { MoodWeekReportGate } from '../../src/components/dashboard/MoodWeekReportCard'
import { DayPlanHomeCard } from '../../src/components/rhythm/DayPlanHomeCard'
import { VisualDayCard } from '../../src/components/rhythm/VisualDayCard'
import { SalaryConfirmCard } from '../../src/components/finance/FinanceForecastCards'
import { HomeMetricShortcuts } from '../../src/components/dashboard/HomeMetricShortcuts'
import { HomeKpiSquares } from '../../src/components/dashboard/HomeKpiSquares'
import { HomeDayTimeline } from '../../src/components/dashboard/HomeDayTimeline'
import { HomeTodayDashboard } from '../../src/components/dashboard/HomeTodayDashboard'
import { HomeCollapsible } from '../../src/components/dashboard/HomeCollapsible'
import { EloHeatmap } from '../../src/components/streak/EloHeatmap'
import { TabShell, DESKTOP_PAD_H } from '../../src/components/dashboard/TabShell'
import { Panel } from '../../src/ui/Panel'
import { type WebStatItem } from '../../src/components/dashboard/web/WebStatRow'
import { WebAgendaBlock, WebBillsBlock, WebCategoryBlock } from '../../src/components/dashboard/web/WebHomeBlocks'
import { SiteHero, SiteNumbers, SiteSection, SiteNotes, SiteCta, SiteFooter } from '../../src/components/dashboard/web/WebHomeSite'
import { WEB_DISPLAY_FONT } from '../../src/components/dashboard/web/webTypography'
import { useModules } from '../../src/hooks/useModules'
import { WebMoodCheckIn } from '../../src/components/dashboard/web/WebMoodCheckIn'
import { WebBodyMetrics } from '../../src/components/dashboard/web/WebBodyMetrics'
import { WebHydrationWidget } from '../../src/components/dashboard/web/WebHydrationWidget'
import { useWorkspace } from '../../src/layout/useWorkspace'
import { usePrefsStore } from '../../src/store/prefsStore'
import { normalizeHomeMetrics } from '../../src/lib/homeMetrics'
import { resolveAxelName } from '../../src/lib/axelName'
import { webStyle } from '../../src/components/dashboard/web/webStyle'
import { filterMetrics } from '../../src/lib/appModules'

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
  const { colors, space, mode, setMode } = useTheme()
  const { isDesktop, width } = useWorkspace()
  // 3 colunas a partir daqui (barra lateral + margens + 3 x ~340); antes, uma coluna
  const wideGrid = width >= 1280
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
  const financeOn = useModules().group('carteira')
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
  const homeMetrics = filterMetrics(prefs.enabled_modules, normalizeHomeMetrics(prefs.home_metric_cards))
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
      value: humorHoje != null ? moodLabel(humorHoje) : 'Pendente',
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

  // Menu da conta: precisa existir nas duas composições (estreita e desktop)
  const accountMenu = (
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
          <View style={{ gap: 6 }}>
            <Text variant="section">Mais</Text>
            <Text variant="caption" muted>
              Conta, personalização e atalhos
            </Text>
          </View>
          {/* Tema no topo: é o ajuste mais usado e aparece sem rolar */}
          <Card tone="elevated" style={{ paddingVertical: space.xs, borderRadius: 20 }}>
            <ListRow
              title={mode === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
              subtitle={mode === 'dark' ? 'Agora no tema escuro' : 'Agora no tema claro'}
              rightIcon={mode === 'dark' ? 'sunny' : 'moon'}
              onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            />
          </Card>
          <Card tone="elevated" style={{ paddingVertical: space.xs, borderRadius: 20 }}>
            {(
              [
                { label: 'Perfil', subtitle: 'Conta e foto', href: '/perfil' },
                { label: 'Configurações', subtitle: 'App e integrações', href: '/configuracoes' },
                { label: 'Histórico AXEL', subtitle: 'Briefings e decisões', href: '/axel/historico' },
                { label: 'Personalizar Início', subtitle: 'Atalhos da Home', href: '/personalizar-inicio' },
                { label: 'Preferências', subtitle: 'O que eu uso, metas e alertas', href: '/preferencias' },
                { label: 'Relatórios', subtitle: 'Resumos semanais', href: '/relatorios' },
                { label: 'Calendário', subtitle: 'Agenda visual', href: '/calendario' },
                { label: 'Anotações', subtitle: 'Notas rápidas', href: '/anotacoes' },
                { label: 'Elo', subtitle: 'Dias seguidos, álbum e prêmios', href: '/ofensiva' },
                { label: 'Relatório', subtitle: 'Tudo de um período, em PDF', href: '/relatorio' },
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
  )

  if (!isDesktop)
  {
    // Navegador estreito (celular): mantém a mesma composição visual do app mobile.
    return (
      <Screen wide scroll refreshing={loading} onRefresh={() => void refreshAll({ isGuest })}>
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
          {/* Axel sempre presente: o próximo passo, logo abaixo do progresso */}
          <AxelDayBrief />
          <SalaryConfirmCard />

          <DayPlanHomeCard />

          <VisualDayCard />

          <MoodWeekReportGate humor={humor} />
          {waterOnHome ? <HomeWaterProgressCard /> : null}
          {/* O que é consulta fica recolhido: a tela abre só com o que importa agora */}
          <HomeCollapsible title="Mais do seu dia" subtitle="Linha do dia, mapa de dias e atalhos" pill="abrir" defaultOpen={false}>
            <View style={{ gap: 24, paddingTop: 8 }}>
              <HomeDayTimeline tasks={today} />
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
              <EloHeatmap semanas={12} compact />
              <HomeMetricShortcuts />
            </View>
          </HomeCollapsible>
        </TabShell>
        {accountMenu}
      </Screen>
    )
  }

  // Computador: a Home é uma página de site, na ordem do wireframe; cada parte leva
  // para a página de verdade (a mesma do menu do topo).
  const cols = (n: number) => (wideGrid ? `repeat(${n}, minmax(0, 1fr))` : 'minmax(0, 1fr)')
  const span2 = webStyle({ gridColumn: wideGrid ? 'span 2' : undefined })

  return (
    <Screen wide scroll refreshing={loading} onRefresh={() => void refreshAll({ isGuest })}>
      <TabShell>
        <SiteHero
          greet={greet}
          name={name}
          dateLabel={dateLabel}
          pending={openTasks.length}
          overdue={overdueToday}
          todayTasks={today}
          allTasks={tasks}
          onMore={() => setMenuOpen(true)}
          padH={DESKTOP_PAD_H}
          padTop={24}
          wide={wideGrid}
        />

        <SiteNumbers items={statItems.filter((i) => i.id !== 'water' || waterOnHome)} />

        {/* avisos que só aparecem às vezes */}
        <SalaryConfirmCard />
        <DayPlanHomeCard />
        <MoodWeekReportGate humor={humor} />

        <SiteSection title="Suas áreas" subtitle="Um resumo de cada parte do seu dia. Clique para abrir a página completa.">
          <View style={webStyle({ display: 'grid', gridTemplateColumns: cols(3), gap: 16, alignItems: 'stretch' })}>
            <Panel style={span2}>
              <WebAgendaBlock tasks={today} overdueCount={overdueToday} />
            </Panel>
            <Panel>
              <WebBodyMetrics />
            </Panel>
            {financeOn ? (
              <Panel>
                <WebBillsBlock />
              </Panel>
            ) : null}
            {financeOn ? (
              <Panel style={span2}>
                <WebCategoryBlock />
              </Panel>
            ) : null}
          </View>
        </SiteSection>

        <SiteSection title="Seu ritmo" subtitle="Como o dia está indo, o que vem agora e os dias que você já cumpriu.">
          <View style={webStyle({ display: 'grid', gridTemplateColumns: wideGrid ? 'minmax(0, 2fr) minmax(0, 1fr)' : 'minmax(0, 1fr)', gap: 16, alignItems: 'start' })}>
            <View style={{ gap: 16, minWidth: 0 }}>
              <Panel>
                <HomeTodayDashboard
                  tasks={tasks}
                  finance={finance}
                  pending={openTasks.length}
                  doneToday={doneToday}
                  ritualSlot={null}
                />
              </Panel>
              <Panel>
                <VisualDayCard />
              </Panel>
            </View>
            <View style={{ gap: 16, minWidth: 0 }}>
              <Panel>
                {showMorningRitual ? <WebMoodCheckIn needSleep={showSleepForm} needMood={showMoodForm} /> : null}
                {waterOnHome ? <WebHydrationWidget /> : null}
              </Panel>
              <Panel>
                <EloHeatmap semanas={wideGrid ? 16 : 26} compact />
              </Panel>
            </View>
          </View>
        </SiteSection>

        <SiteSection title="O que você escreveu" subtitle="As últimas notas do seu diário de humor.">
          <SiteNotes wide={wideGrid} />
        </SiteSection>

        {/* como o "perguntas" do wireframe: título à esquerda, o Axel à direita */}
        <View style={webStyle({ display: 'grid', gridTemplateColumns: wideGrid ? 'minmax(0, 1fr) minmax(0, 1.4fr)' : 'minmax(0, 1fr)', gap: 32, paddingTop: 40, alignItems: 'start' })}>
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 30, lineHeight: 38, color: colors.ink }}>Axel olha o seu dia</Text>
            <View style={{ width: 40, height: 3, borderRadius: 2, backgroundColor: colors.axelFill }} />
            <Text variant="body" muted style={{ maxWidth: 420 }}>
              Ele junta tarefas, contas, humor e cuidados e sugere um próximo passo, sem pressa.
            </Text>
          </View>
          <Panel>
            <AxelDayBrief />
          </Panel>
        </View>

        <SiteCta />
        <SiteFooter />
      </TabShell>

      {accountMenu}
    </Screen>
  )
}
