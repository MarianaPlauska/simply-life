import { useEffect, useMemo, useState } from 'react'
import { View, Modal, Pressable, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import {
  partitionTodayTimeline,
  formatBRL,
  monthExpenseTotal,
  findHabit,
  habitPct,
  priorityTodayTasks,
  AGUA_META_COPOS,
} from '@simply-life/shared'
import {
  Screen,
  Text,
  Card,
  PrimaryButton,
} from '../../src/ui'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useAuthStore } from '../../src/store/authStore'
import { useDataStore } from '../../src/store/dataStore'
import { HomeFitnessHero } from '../../src/components/dashboard/HomeFitnessHero'
import { HomeWeatherChip } from '../../src/components/dashboard/HomeWeatherChip'
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
import { TabShell } from '../../src/components/dashboard/TabShell'
import { useWorkspace } from '../../src/layout/useWorkspace'
import { usePrefsStore } from '../../src/store/prefsStore'

function greetingForHour(h: number): string
{
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function DashboardScreen()
{
  const { colors, space, mode, setMode } = useTheme()
  const { showRail } = useWorkspace()
  const router = useRouter()
  const email = useAuthStore((s) => s.sessionEmail)
  const isGuest = useAuthStore((s) => s.isGuest)
  const signOut = useAuthStore((s) => s.signOut)
  const tasks = useDataStore((s) => s.tasks) ?? []
  const finance = useDataStore((s) => s.finance) ?? []
  const habits = useDataStore((s) => s.habits) ?? []
  const loading = useDataStore((s) => s.loading)
  const refreshAll = useDataStore((s) => s.refreshAll)
  const prefs = usePrefsStore((s) => s.prefs)
  const prefsLoaded = usePrefsStore((s) => s.loaded)
  const hydratePrefs = usePrefsStore((s) => s.hydrate)
  const patchPrefs = usePrefsStore((s) => s.patch)

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
  const waterPct = habitPct(agua)
  const waterLabel = agua
    ? `${agua.progressoAtual}/${agua.metaDiaria ?? AGUA_META_COPOS}`
    : '-'

  const [menuOpen, setMenuOpen] = useState(false)
  const [inviteDismissed, setInviteDismissed] = useState(false)
  const name = email?.split('@')[0] ?? 'Você'
  const greet = greetingForHour(new Date().getHours())
  const needsPersonalize =
    prefsLoaded && !prefs.home_metrics_configured_at && !inviteDismissed

  useEffect(() =>
  {
    void hydratePrefs()
  }, [hydratePrefs])

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
          focusTitle={focusTask?.titulo ?? null}
          onMenu={() => setMenuOpen(true)}
        />

        {!showRail ? <HomeWeatherChip /> : null}

        <HomeMetricShortcuts />

        <HomeKpiSquares
          items={[
            {
              id: 'tasks',
              label: 'tarefas',
              value: String(openTasks.length),
              hint: doneToday > 0 ? `+${doneToday}` : undefined,
              icon: 'checkbox-outline',
              color: colors.tasks,
              onPress: () => router.push('/(tabs)/kanban'),
            },
            {
              id: 'water',
              label: 'água',
              value: waterLabel,
              hint: waterPct > 0 ? `${waterPct}%` : undefined,
              icon: 'water-outline',
              color: colors.health,
              onPress: () => router.push('/(tabs)/saude'),
            },
            {
              id: 'finance',
              label: 'gastos/mês',
              value:
                gastosMes >= 1000
                  ? `${(gastosMes / 1000).toFixed(1).replace('.', ',')}k`
                  : formatBRL(gastosMes),
              icon: 'wallet-outline',
              color: colors.finance,
              onPress: () => router.push('/(tabs)/financeiro'),
            },
          ]}
        />

        <HomeActivityHeatmap tasks={tasks} />

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

        {!showRail ? <AxelDayBrief /> : null}

        <View
          style={{
            flexDirection: showRail ? 'row' : 'column',
            alignItems: showRail ? 'stretch' : undefined,
            gap: showRail ? 24 : space.xl,
          }}
        >
          <View style={{ flex: showRail ? 8 : undefined, minWidth: 0, gap: space.xl }}>
            <HomeAgendaStudio tasks={tasks} />
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
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxWidth: 480,
              maxHeight: '80%',
              alignSelf: 'center',
              width: '100%',
            }}
            contentContainerStyle={{ padding: space.lg, gap: space.sm }}
          >
            <Text variant="section">Mais</Text>
            {(
              [
                { label: 'Perfil', href: '/perfil' },
                { label: 'Configurações', href: '/configuracoes' },
                { label: 'Histórico AXEL', href: '/axel/historico' },
                { label: 'Personalizar Início', href: '/personalizar-inicio' },
                { label: 'Preferências', href: '/preferencias' },
                { label: 'Relatórios', href: '/relatorios' },
                { label: 'Calendário', href: '/calendario' },
                { label: 'Anotações', href: '/anotacoes' },
                { label: 'Modo foco', href: '/foco' },
              ] as const
            ).map((item) => (
              <PrimaryButton
                key={item.href}
                label={item.label}
                variant="ghost"
                onPress={() =>
                {
                  setMenuOpen(false)
                  router.push(item.href)
                }}
              />
            ))}
            <PrimaryButton
              label={mode === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
              variant="secondary"
              onPress={() =>
              {
                const next = mode === 'dark' ? 'light' : 'dark'
                setMode(next)
                void patchPrefs({ color_scheme: next })
              }}
            />
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
            <PrimaryButton label="Fechar" onPress={() => setMenuOpen(false)} />
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  )
}
