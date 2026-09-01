import { useMemo, useState } from 'react'
import { View, Modal, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import {
  buildDashboardGlances,
  partitionTodayTimeline,
  minutesToLabel,
  formatBRL,
  monthExpenseTotal,
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
import { GlanceGrid } from '../../src/components/dashboard/GlanceGrid'
import { TabShell } from '../../src/components/dashboard/TabShell'

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
  const router = useRouter()
  const email = useAuthStore((s) => s.sessionEmail)
  const isGuest = useAuthStore((s) => s.isGuest)
  const signOut = useAuthStore((s) => s.signOut)
  const openCapture = useCaptureStore((s) => s.openCapture)
  const tasks = useDataStore((s) => s.tasks)
  const humor = useDataStore((s) => s.humor)
  const finance = useDataStore((s) => s.finance)
  const habits = useDataStore((s) => s.habits)
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
          openTasks={openTasks.length}
          doneToday={doneToday}
          onMenu={() => setMenuOpen(true)}
        />

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

        {(filter === 'tudo' || filter === 'financas') && (
          <Card tone="elevated" style={{ gap: space.sm }}>
            <Text variant="caption" color={colors.finance}>
              Gastos do mês
            </Text>
            <Text variant="hero" color={colors.finance} style={{ letterSpacing: -0.5, fontSize: 34 }}>
              {formatBRL(gastosMes)}
            </Text>
            <Text variant="caption" muted>
              Finanças em um olhar
            </Text>
          </Card>
        )}

        {(filter === 'tudo' || filter === 'tarefas') && (
          hero ? (
            <Card tone="hero" style={{ gap: space.md }}>
              <Text variant="caption" color={colors.tasks}>
                Prioridade de hoje
              </Text>
              <Text variant="title">{hero.titulo}</Text>
              <Text variant="caption" muted>
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
            <Card tone="hero">
              <EmptyState title="Nada na fila" body="Capture uma tarefa para começar." />
              <PrimaryButton
                label="Capturar"
                onPress={() => openCapture('dump')}
                style={{ borderRadius: 999 }}
              />
            </Card>
          )
        )}

        <View>
          <SectionHeader
            title="Agora"
            subtitle="Áreas da vida"
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

        {(filter === 'tudo' || filter === 'tarefas') && (
          <View>
            <SectionHeader
              title="Planos de hoje"
              action={
                <PrimaryButton
                  label="Ver tudo"
                  variant="link"
                  size="sm"
                  onPress={() => router.push('/(tabs)/kanban')}
                />
              }
            />
            <Card tone="elevated" style={{ paddingVertical: space.sm, gap: 0 }}>
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
      </TabShell>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <Pressable
            accessibilityLabel="Fechar menu"
            onPress={() => setMenuOpen(false)}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          />
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: space.lg,
              gap: space.sm,
              maxWidth: 480,
              alignSelf: 'center',
              width: '100%',
            }}
          >
            <Text variant="section">Preferências</Text>
            <PrimaryButton
              label={mode === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
              variant="secondary"
              onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
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
          </View>
        </View>
      </Modal>
    </Screen>
  )
}
