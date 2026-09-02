import { useMemo, useState } from 'react'
import { View, Modal, Pressable, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import {
  buildDashboardGlances,
  partitionTodayTimeline,
  minutesToLabel,
  formatBRL,
  monthExpenseTotal,
  computeSaldoDisponivel,
} from '@simply-life/shared'
import {
  Screen,
  Text,
  Card,
  SectionHeader,
  PrimaryButton,
  EmptyState,
  CheckRow,
  PillTabs,
} from '../../src/ui'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useAuthStore } from '../../src/store/authStore'
import { useCaptureStore } from '../../src/store/captureStore'
import { useDataStore } from '../../src/store/dataStore'
import { HomeWelcomeHero } from '../../src/components/dashboard/HomeWelcomeHero'
import { HomeQuickActions } from '../../src/components/dashboard/HomeQuickActions'
import { GlanceGrid } from '../../src/components/dashboard/GlanceGrid'
import { DashboardQuickWidgets } from '../../src/components/dashboard/DashboardQuickWidgets'
import { HomeDriveAside } from '../../src/components/dashboard/HomeDriveAside'
import { TabShell } from '../../src/components/dashboard/TabShell'
import { useWorkspace } from '../../src/layout/useWorkspace'
import { usePrefsStore } from '../../src/store/prefsStore'

type ModuleFilter = 'tudo' | 'tarefas' | 'saude' | 'financas'

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
  const openCapture = useCaptureStore((s) => s.openCapture)
  const tasks = useDataStore((s) => s.tasks)
  const humor = useDataStore((s) => s.humor)
  const finance = useDataStore((s) => s.finance)
  const habits = useDataStore((s) => s.habits)
  const cash = useDataStore((s) => s.cashAccount)
  const fixas = useDataStore((s) => s.contasFixas)
  const loading = useDataStore((s) => s.loading)
  const refreshAll = useDataStore((s) => s.refreshAll)
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const glances = useMemo(
    () => buildDashboardGlances({ humor, tasks, finance, habits }),
    [humor, tasks, finance, habits],
  )
  const today = useMemo(() => partitionTodayTimeline(tasks), [tasks])
  const openTasks = useMemo(() => tasks.filter((t) => t.status !== 'done'), [tasks])
  const doneToday = useMemo(
    () => today.filter((t) => t.status === 'done').length,
    [today],
  )
  const hero = today.find((t) => t.status !== 'done') ?? openTasks[0]
  const gastosMes = monthExpenseTotal(finance)
  const saldoDisp = useMemo(
    () => computeSaldoDisponivel(cash, finance, fixas).disponivel,
    [cash, finance, fixas],
  )
  const [filter, setFilter] = useState<ModuleFilter>('tudo')
  const [menuOpen, setMenuOpen] = useState(false)
  const name = email?.split('@')[0] ?? 'Você'
  const greet = greetingForHour(new Date().getHours())

  const toneColor = (tone: string) =>
  {
    if (tone === 'health') return colors.health
    if (tone === 'finance') return colors.finance
    if (tone === 'tasks') return colors.tasks
    return colors.axel
  }

  const filteredGlances = useMemo(() =>
  {
    if (filter === 'tudo') return glances
    if (filter === 'tarefas') return glances.filter((g) => g.tone === 'tasks')
    if (filter === 'saude') return glances.filter((g) => g.tone === 'health' || g.tone === 'axel')
    return glances.filter((g) => g.tone === 'finance')
  }, [filter, glances])

  const onGlancePress = (id: string) =>
  {
    if (id.startsWith('g-humor') || id.startsWith('g-agua') || id.startsWith('g-proteina'))
    {
      router.push('/(tabs)/saude')
      return
    }
    if (id === 'g-tasks') router.push('/(tabs)/kanban')
    if (id === 'g-finance') router.push('/(tabs)/financeiro')
  }

  return (
    <Screen
      scroll
      refreshing={loading}
      onRefresh={() => void refreshAll({ isGuest })}
    >
      <TabShell>
        <HomeWelcomeHero
          greet={greet}
          name={name}
          saldoLabel={formatBRL(saldoDisp)}
          openTasks={openTasks.length}
          doneToday={doneToday}
          onMenu={() => setMenuOpen(true)}
        />

        {/* Drive desktop: coluna principal + aside; mobile empilha tudo */}
        <View
          style={{
            flexDirection: showRail ? 'row' : 'column',
            alignItems: showRail ? 'flex-start' : undefined,
            gap: showRail ? space.xl : space.md + 4,
          }}
        >
          <View style={{ flex: 1, minWidth: 0, gap: showRail ? space.xl : space.md + 4 }}>
            {!showRail ? (
              <HomeQuickActions
                actions={[
                  {
                    id: 'expense',
                    label: 'Gasto',
                    icon: 'arrow-up-outline',
                    onPress: () => openCapture('expense'),
                  },
                  {
                    id: 'task',
                    label: 'Tarefa',
                    icon: 'checkbox-outline',
                    onPress: () => openCapture('dump'),
                  },
                  {
                    id: 'water',
                    label: 'Água',
                    icon: 'water-outline',
                    onPress: () => router.push('/(tabs)/saude'),
                  },
                  {
                    id: 'finance',
                    label: 'Contas',
                    icon: 'wallet-outline',
                    onPress: () => router.push('/(tabs)/financeiro'),
                  },
                ]}
              />
            ) : null}

            {filter === 'tudo' && !showRail ? <DashboardQuickWidgets /> : null}

            <PillTabs
              tabs={[
                { id: 'tudo', label: 'Tudo', count: glances.length },
                { id: 'tarefas', label: 'Tarefas', count: openTasks.length },
                { id: 'saude', label: 'Saúde' },
                { id: 'financas', label: 'Finanças' },
              ]}
              value={filter}
              onChange={setFilter}
            />

            {(filter === 'tudo' || filter === 'financas' || filter === 'tarefas') && (
              <View
                style={{
                  flexDirection: showRail ? 'row' : 'column',
                  flexWrap: 'wrap',
                  gap: space.md,
                }}
              >
                {(filter === 'tudo' || filter === 'financas') && (
                  <Card
                    tone="elevated"
                    style={{
                      gap: space.sm,
                      minHeight: showRail ? 120 : 88,
                      justifyContent: 'center',
                      flexGrow: 1,
                      flexBasis: showRail ? 200 : undefined,
                      borderRadius: 18,
                    }}
                  >
                    <Text variant="caption" color={colors.finance}>
                      Gastos do mês
                    </Text>
                    <Text
                      variant="title"
                      color={colors.finance}
                      style={{ letterSpacing: -0.3, fontSize: showRail ? 26 : 22 }}
                    >
                      {formatBRL(gastosMes)}
                    </Text>
                  </Card>
                )}

                {(filter === 'tudo' || filter === 'tarefas') && (
                  hero ? (
                    <Card
                      tone="elevated"
                      style={{
                        gap: space.sm,
                        minHeight: showRail ? 120 : 100,
                        backgroundColor: colors.widget,
                        flexGrow: 2,
                        flexBasis: showRail ? 280 : undefined,
                        borderRadius: 18,
                      }}
                    >
                      <Text variant="caption" style={{ color: colors.widgetMuted }}>
                        Prioridade de hoje
                      </Text>
                      <Text
                        variant="title"
                        style={{ fontSize: showRail ? 20 : 20, color: colors.widgetInk }}
                      >
                        {hero.titulo}
                      </Text>
                      <Text variant="caption" style={{ color: colors.widgetMuted }}>
                        {hero.horaMinutos != null
                          ? `Às ${minutesToLabel(hero.horaMinutos)} · ${hero.estimativaMinutos} min`
                          : `${hero.estimativaMinutos} min`}
                      </Text>
                      <PrimaryButton
                        label="Abrir tarefa"
                        onPress={() => router.push(`/task/${hero.id}`)}
                        style={{ borderRadius: 999, alignSelf: 'flex-start', paddingHorizontal: 24 }}
                      />
                    </Card>
                  ) : (
                    <Card
                      tone="elevated"
                      style={{
                        flexGrow: 2,
                        flexBasis: showRail ? 280 : undefined,
                        borderRadius: 18,
                      }}
                    >
                      <EmptyState title="Nada na fila" body="Capture uma tarefa para começar." />
                      <PrimaryButton
                        label="Capturar"
                        onPress={() => openCapture('dump')}
                        style={{ borderRadius: 999 }}
                      />
                    </Card>
                  )
                )}
              </View>
            )}

            <View>
              <SectionHeader
                title={showRail ? 'Áreas' : 'Áreas da vida'}
                subtitle={showRail ? 'Atalhos do dia' : 'Atalhos do dia'}
                action={
                  filter !== 'tudo' ? (
                    <PrimaryButton
                      label="Ver tudo"
                      variant="link"
                      size="sm"
                      onPress={() => setFilter('tudo')}
                    />
                  ) : null
                }
              />
              <GlanceGrid
                glances={filteredGlances}
                toneColor={toneColor}
                onPressGlance={onGlancePress}
              />
            </View>

            {filter === 'tudo' && showRail ? <DashboardQuickWidgets /> : null}

            {(filter === 'tudo' || filter === 'tarefas') && (
              <View>
                <SectionHeader
                  title={showRail ? 'Recentes' : 'Planos de hoje'}
                  action={
                    <PrimaryButton
                      label="Ver tudo"
                      variant="link"
                      size="sm"
                      onPress={() => router.push('/(tabs)/kanban')}
                    />
                  }
                />
                <Card tone="elevated" style={{ paddingVertical: space.sm, gap: 0, borderRadius: 18 }}>
                  {today.slice(0, 5).length === 0 ? (
                    <EmptyState title="Sem prazos hoje" body="Itens aparecem na lista de tarefas." />
                  ) : (
                    today.slice(0, 5).map((t, i, arr) => (
                      <CheckRow
                        key={t.id}
                        title={t.titulo}
                        subtitle={
                          t.horaMinutos != null ? minutesToLabel(t.horaMinutos) : 'Sem horário'
                        }
                        done={t.status === 'done'}
                        onPress={() => router.push(`/task/${t.id}`)}
                        onToggle={() => void toggleTaskDone(t.id, isGuest)}
                        showSeparator={i < arr.length - 1}
                      />
                    ))
                  )}
                </Card>
              </View>
            )}
          </View>

          {showRail ? <HomeDriveAside todayTasks={today} /> : null}
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
                { label: 'Preferências', href: '/preferencias' },
                { label: 'Inteligência', href: '/inteligencia' },
                { label: 'Relatórios', href: '/relatorios' },
                { label: 'Calendário', href: '/calendario' },
                { label: 'Anotações', href: '/anotacoes' },
                { label: 'Modo foco', href: '/foco' },
              ] as const
            ).map((item) => (
              <PrimaryButton
                key={item.href}
                label={item.label}
                variant="secondary"
                onPress={() =>
                {
                  setMenuOpen(false)
                  router.push(item.href as never)
                }}
              />
            ))}
            <PrimaryButton
              label={mode === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
              variant="ghost"
              onPress={() =>
              {
                const next = mode === 'dark' ? 'light' : 'dark'
                setMode(next)
                void usePrefsStore.getState().patch({ color_scheme: next })
              }}
            />
            <PrimaryButton
              label="Sair"
              variant="ghost"
              onPress={() =>
              {
                setMenuOpen(false)
                void signOut()
              }}
            />
            <PrimaryButton label="Fechar" variant="link" onPress={() => setMenuOpen(false)} />
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  )
}
