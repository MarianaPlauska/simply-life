import { useEffect, useMemo, useState } from 'react'
import { View, Pressable, ScrollView } from 'react-native'
import { Modal } from '../../src/ui/Modal'
import { useRouter } from 'expo-router'
import {
  partitionTodayTimeline,
  findHabit,
  humorDoDia,
  priorityTodayTasks,
} from '@simply-life/shared'
import { Screen, Text, Card, ListRow, SectionHeader, GroupedList, GroupedRow, RowGlyph } from '../../src/ui'
import { MoreMenuExit } from '../../src/components/dashboard/MoreMenuExit'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useAuthStore } from '../../src/store/authStore'
import { useDataStore } from '../../src/store/dataStore'
import { AxelSun } from '../../src/components/AxelSun'
import { HomeFitnessHero } from '../../src/components/dashboard/HomeFitnessHero'
import { HomePlay } from '../../src/components/play/HomePlay'
import { AdventureHud } from '../../src/components/play/AdventureHud'
import { AdventureStage } from '../../src/components/play/AdventureStage'
import { HomeMorningRitual } from '../../src/components/dashboard/HomeMorningRitual'
import { MoodWeekReportGate, isMoodWeekReportVisible } from '../../src/components/dashboard/MoodWeekReportCard'
import { DayPlanHomeCard } from '../../src/components/rhythm/DayPlanHomeCard'
import { CareHomeStrip } from '../../src/components/care/CareHomeStrip'
import { SalaryConfirmCard } from '../../src/components/finance/FinanceForecastCards'
import { HomeMetricShortcuts } from '../../src/components/dashboard/HomeMetricShortcuts'
import { HomeNowCard } from '../../src/components/dashboard/HomeNowCard'
import { HomeDayList } from '../../src/components/dashboard/HomeDayList'
import { TabShell, DESKTOP_PAD_H } from '../../src/components/dashboard/TabShell'
import { Panel } from '../../src/ui/Panel'
import { useActionableTasks } from '../../src/hooks/useActionableTasks'
import { WebAgendaBlock, WebBillsBlock, WebCategoryBlock } from '../../src/components/dashboard/web/WebHomeBlocks'
import { DashGreeting, DashHero, DashProgress, DashWellness, DashQuickActions, DashUpcoming, DashForYou, DashFooter } from '../../src/components/dashboard/web/WebHomeDash'
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
  const rpgMode = prefs.gamification_mode === 'rpg'
  const financeOn = useModules().group('carteira')
  const hydratePrefs = usePrefsStore((s) => s.hydrate)

  const today = useMemo(() => partitionTodayTimeline(tasks), [tasks])
  const todayIso = new Date().toISOString().slice(0, 10)
  const doneToday = useMemo(
    () => tasks.filter((t) => t.status === 'done' && t.dataVencimento?.slice(0, 10) === todayIso).length,
    [tasks, todayIso],
  )
  const actionable = useActionableTasks(tasks)
  const focusTask = useMemo(
    () => priorityTodayTasks(actionable, new Date(), 1)[0]?.task ?? null,
    [actionable],
  )
  const sono = findHabit(habits, 'sono')
  const homeMetrics = filterMetrics(prefs.enabled_modules, normalizeHomeMetrics(prefs.home_metric_cards))
  const humorOnHome = homeMetrics.includes('humor')
  const sleepOnHome = homeMetrics.includes('sleep')
  const isMorning = new Date().getHours() < 14
  const sleepDone = (sono?.progressoAtual ?? 0) > 0
  const showSleepForm = sleepOnHome && isMorning && !sleepDone
  const humorHoje = humorDoDia(humor)?.humor
  const moodDone = humorHoje != null
  const showMoodForm = humorOnHome && !moodDone
  const showMorningRitual = showSleepForm || showMoodForm
  const showMoodWeek = isMoodWeekReportVisible(humor, prefs.mood_report_dismissed_week)
  const showCareSection = showMorningRitual || showMoodWeek

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
                { label: 'Apoio do dia', subtitle: 'Energia, burnout, lugares e espera de gasto', href: '/apoio' },
                { label: 'Perfil', subtitle: 'Conta e foto', href: '/perfil' },
                { label: 'Configurações', subtitle: 'App, integrações e versão', href: '/configuracoes' },
                { label: 'Seu AXEL', subtitle: 'Formas, roupas e o jogo', href: '/seu-axel' },
                { label: 'Mais do dia', subtitle: 'Plano, mapas e resumos', href: '/mais-do-dia' },
                { label: 'Histórico AXEL', subtitle: 'Briefings e decisões', href: '/axel/historico' },
                { label: 'Personalizar Início', subtitle: 'Atalhos da Home', href: '/personalizar-inicio' },
                { label: 'Preferências', subtitle: 'O que eu uso, metas e alertas', href: '/preferencias' },
                { label: 'Relatórios', subtitle: 'Resumos semanais', href: '/relatorios' },
                { label: 'Calendário', subtitle: 'Agenda visual', href: '/calendario' },
                { label: 'Anotações', subtitle: 'Notas rápidas', href: '/anotacoes' },
                { label: 'Elo', subtitle: 'Dias seguidos. O placar de pontos fica no Perfil.', href: '/ofensiva' },
                { label: 'Relatório', subtitle: 'Tudo de um período, em PDF', href: '/relatorio' },
                { label: 'Modo foco', subtitle: 'Timer e prioridade', href: '/foco' },
              ] as const
            ).map((item) => (
              <ListRow
                key={item.href}
                title={item.label}
                subtitle={item.subtitle}
                right="›"
                showSeparator
                onPress={() =>
                {
                  setMenuOpen(false)
                  router.push(item.href)
                }}
              />
            ))}
            <ListRow
              title="Hábitos"
              subtitle="Marque o dia. A semana fica na fileira."
              right="›"
              showSeparator
              onPress={() =>
              {
                setMenuOpen(false)
                router.push('/habitos' as never)
              }}
            />
            <ListRow
              title="Metas importantes"
              subtitle="Um ano sem beber, se for o seu caso."
              right="›"
              onPress={() =>
              {
                setMenuOpen(false)
                router.push('/metas-vida' as never)
              }}
            />
          </Card>
          <MoreMenuExit
            onClose={() => setMenuOpen(false)}
            onSignOut={() =>
            {
              setMenuOpen(false)
              void signOut()
              router.replace('/login')
            }}
          />
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
          {rpgMode ? <AdventureHud /> : null}
          {rpgMode ? <AdventureStage /> : null}
          <HomeMetricShortcuts />
          <HomeNowCard task={focusTask} />
          <SalaryConfirmCard />
          <HomeDayList />

          {showCareSection ? (
            <View style={{ gap: 12 }}>
              <Text variant="section">Cuidar de você</Text>
              {showMorningRitual ? (
                <HomeMorningRitual needSleep={showSleepForm} needMood={showMoodForm} />
              ) : null}
              {showMoodWeek ? <MoodWeekReportGate humor={humor} /> : null}
            </View>
          ) : null}

          <View style={{ gap: 8 }}>
            <Text variant="caption" muted style={{ marginLeft: 4 }}>
              Quando quiser entender
            </Text>
            <GroupedList>
              <GroupedRow
                leading={<RowGlyph color="transparent"><AxelSun size={30} mood="calm" /></RowGlyph>}
                title="Seu AXEL"
                subtitle="Como o app funciona, o jogo e os ícones"
                onPress={() => router.push('/seu-axel')}
              />
              <GroupedRow
                leading={<RowGlyph name="layers" color={colors.brandDeep} />}
                title="Mais do dia"
                subtitle="Plano, mapas e os resumos"
                onPress={() => router.push('/mais-do-dia')}
              />
            </GroupedList>
          </View>
        </TabShell>
        {accountMenu}
      </Screen>
    )
  }

  // Computador: painel de bem-estar (não a pilha do app). Duas colunas:
  // esquerda = destaque do Axel, bem-estar, contas e gastos; direita = progresso, ações e próximos.
  // Embaixo, recomendações e o rodapé com todos os caminhos.
  const leftCol = (
    <View style={{ gap: 20, minWidth: 0 }}>
      <DashHero />
      <DashWellness doneToday={doneToday} totalToday={doneToday + today.length} onCustomize={() => router.push('/personalizar-inicio')} />
      {financeOn ? (
        <View style={webStyle({ display: 'grid', gridTemplateColumns: wideGrid ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)', gap: 16, alignItems: 'stretch' })}>
          <Panel>
            <WebBillsBlock />
          </Panel>
          <Panel>
            <WebCategoryBlock />
          </Panel>
        </View>
      ) : null}
    </View>
  )
  const rightCol = (
    <View style={{ gap: 20, minWidth: 0 }}>
      <DashProgress done={doneToday} total={doneToday + today.length} />
      <DashQuickActions />
      <DashUpcoming tasks={today} />
    </View>
  )

  return (
    <Screen wide scroll refreshing={loading} onRefresh={() => void refreshAll({ isGuest })}>
      <TabShell>
        <DashGreeting greet={greet} name={name} dateLabel={dateLabel} onMore={() => setMenuOpen(true)} />
        {rpgMode ? <AdventureHud /> : null}
        <HomePlay />
        {rpgMode ? <AdventureStage /> : null}
        <HomeMetricShortcuts />

        {/* avisos que só aparecem às vezes */}
        <SalaryConfirmCard />
        <DayPlanHomeCard />
        <CareHomeStrip />
        <MoodWeekReportGate humor={humor} />

        <View
          style={webStyle({
            display: 'grid',
            gridTemplateColumns: wideGrid ? 'minmax(0, 2.2fr) minmax(300px, 1fr)' : 'minmax(0, 1fr)',
            gap: 20,
            alignItems: 'start',
            paddingTop: 8,
          })}
        >
          {leftCol}
          {rightCol}
        </View>

        <View style={{ paddingTop: 16 }}>
          <DashForYou />
        </View>

        <DashFooter />
      </TabShell>

      {accountMenu}
    </Screen>
  )
}
