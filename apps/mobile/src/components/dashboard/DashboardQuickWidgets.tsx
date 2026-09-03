import { View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  findHabit,
  habitPct,
  formatBRL,
  monthExpenseTotal,
  medsTakenCount,
} from '@simply-life/shared'
import { Card, Text, PrimaryButton, CheckRow } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'
import { useCaptureStore } from '../../store/captureStore'
import { usePrefsStore } from '../../store/prefsStore'
import { useWorkspace } from '../../layout/useWorkspace'
import { MoodFaceRow } from '../MoodFace'
import { resolveDashboardWidgets, type DashboardWidgetId } from '../../lib/dashboardWidgets'

function WellbeingWidget()
{
  const { space } = useTheme()
  const humor = useDataStore((s) => s.humor)
  const addHumor = useDataStore((s) => s.addHumor)
  const isGuest = useAuthStore((s) => s.isGuest)
  const today = humor[0]?.humor ?? null

  return (
    <Card tone="elevated" style={{ gap: space.sm }}>
      <Text variant="caption" muted>
        Humor
      </Text>
      <MoodFaceRow
        value={today}
        onChange={(m) => void addHumor(m, undefined, isGuest)}
      />
    </Card>
  )
}

function WaterWidget()
{
  const { colors, space } = useTheme()
  const habits = useDataStore((s) => s.habits)
  const addWaterCup = useDataStore((s) => s.addWaterCup)
  const isGuest = useAuthStore((s) => s.isGuest)
  const agua = findHabit(habits, 'agua')
  const pct = habitPct(agua)

  return (
    <Card tone="elevated" style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ gap: 2 }}>
          <Text variant="caption" muted>
            Água
          </Text>
          <Text variant="title" color={colors.health}>
            {agua ? `${agua.progressoAtual}/${agua.metaDiaria}` : '-'}
          </Text>
        </View>
        <PrimaryButton label="+ Copo" size="sm" onPress={() => void addWaterCup(isGuest)} />
      </View>
      <View
        style={{
          height: 6,
          borderRadius: 999,
          backgroundColor: colors.hairline,
          overflow: 'hidden',
        }}
      >
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: colors.health }} />
      </View>
    </Card>
  )
}

function MedsWidget()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const medicamentos = useDataStore((s) => s.medicamentos)
  const toggleMedicamento = useDataStore((s) => s.toggleMedicamento)
  const isGuest = useAuthStore((s) => s.isGuest)
  const done = medsTakenCount(medicamentos)

  return (
    <Card tone="elevated" style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="caption" muted>
          Medicamentos
        </Text>
        <Text variant="caption" color={colors.health}>
          {done}/{medicamentos.length}
        </Text>
      </View>
      {medicamentos.slice(0, 3).map((m, i) => (
        <CheckRow
          key={m.id}
          title={m.nome}
          subtitle={m.horario}
          done={m.tomado}
          onToggle={() => void toggleMedicamento(m.id, isGuest)}
          showSeparator={i < Math.min(medicamentos.length, 3) - 1}
        />
      ))}
      <PrimaryButton
        label="Ver cuidados"
        variant="link"
        size="sm"
        onPress={() => router.push('/(tabs)/saude')}
      />
    </Card>
  )
}

function TasksWidget()
{
  const { space } = useTheme()
  const router = useRouter()
  const tasks = useDataStore((s) => s.tasks)
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const isGuest = useAuthStore((s) => s.isGuest)
  const open = tasks.filter((t) => t.status !== 'done').slice(0, 3)

  return (
    <Card tone="elevated" style={{ gap: space.sm }}>
      <Text variant="caption" muted>
        Tarefas críticas
      </Text>
      {open.length === 0 ? (
        <Text variant="body" muted>
          Nada urgente agora.
        </Text>
      ) : (
        open.map((t, i) => (
          <CheckRow
            key={t.id}
            title={t.titulo}
            done={false}
            onPress={() => router.push(`/task/${t.id}`)}
            onToggle={() => void toggleTaskDone(t.id, isGuest)}
            showSeparator={i < open.length - 1}
          />
        ))
      )}
      <PrimaryButton
        label="Abrir tarefas"
        variant="link"
        size="sm"
        onPress={() => router.push('/(tabs)/kanban')}
      />
    </Card>
  )
}

function FinanceWidget()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const openCapture = useCaptureStore((s) => s.openCapture)
  const finance = useDataStore((s) => s.finance)
  const gastos = monthExpenseTotal(finance)

  return (
    <Card tone="elevated" style={{ gap: space.sm }}>
      <Text variant="caption" muted>
        Finanças
      </Text>
      <Text variant="title" color={colors.finance}>
        {formatBRL(gastos)}
      </Text>
      <Text variant="caption" muted>
        Gastos do mês
      </Text>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton label="+ Gasto" size="sm" onPress={() => openCapture('expense')} />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label="Abrir"
            variant="secondary"
            size="sm"
            onPress={() => router.push('/(tabs)/financeiro')}
          />
        </View>
      </View>
    </Card>
  )
}

function WidgetById({ id }: { id: DashboardWidgetId })
{
  switch (id)
  {
    case 'wellbeing':
      return <WellbeingWidget />
    case 'water':
      return <WaterWidget />
    case 'medicamentos':
      return <MedsWidget />
    case 'critical_tasks':
      return <TasksWidget />
    case 'finance_brief':
    case 'quick_spend':
      return <FinanceWidget />
    default:
      return null
  }
}

/** Atalhos escolhidos no setup / Preferências - não são glances genéricos. */
export function DashboardQuickWidgets()
{
  const { space } = useTheme()
  const { showRail } = useWorkspace()
  const prefs = usePrefsStore((s) => s.prefs)
  const ids = resolveDashboardWidgets(prefs.dashboard_quick_widgets, prefs.dashboard_priority)

  if (ids.length === 0) return null

  return (
    <View style={{ gap: space.md }}>
      <Text variant="section">Seus atalhos</Text>
      <View
        style={{
          flexDirection: showRail ? 'row' : 'column',
          flexWrap: 'wrap',
          gap: space.md,
        }}
      >
        {ids.map((id) => (
          <View
            key={id}
            style={
              showRail
                ? { flexGrow: 1, flexBasis: 280, minWidth: 260, maxWidth: '100%' }
                : { width: '100%' }
            }
          >
            <WidgetById id={id} />
          </View>
        ))}
      </View>
    </View>
  )
}
