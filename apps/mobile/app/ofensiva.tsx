import { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import {
  buildStreakMonth,
  buildStreakWeek,
  consecutiveLocalActivity,
  localTodayIso,
  nextStreakMilestone,
} from '@simply-life/shared'
import { Screen, Text, PillTabs, PrimaryButton } from '../src/ui'
import { StreakWeekRow } from '../src/components/streak/StreakWeekRow'
import { StreakMonthCard } from '../src/components/streak/StreakMonthCard'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { useDataStore } from '../src/store/dataStore'
import { useNotesStore } from '../src/store/notesStore'
import { useWaterLogStore } from '../src/store/waterLogStore'
import {
  actionIsos,
  openIsos,
  useActivityStore,
  type LifeActionKind,
} from '../src/store/activityStore'

type Tab = 'sequencia' | 'ativos'

const ACTION_LABEL: Record<LifeActionKind, string> = {
  task: 'tarefas',
  note: 'anotações',
  mood: 'humor',
  finance: 'gastos',
  water: 'água',
  focus: 'foco',
}

export default function OfensivaScreen()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const tasks = useDataStore((s) => s.tasks) ?? []
  const humor = useDataStore((s) => s.humor) ?? []
  const finance = useDataStore((s) => s.finance) ?? []
  const notes = useNotesStore((s) => s.items)
  const waterDays = useWaterLogStore((s) => s.days)
  const days = useActivityStore((s) => s.days)
  const hydrate = useActivityStore((s) => s.hydrate)
  const seedDates = useActivityStore((s) => s.seedDates)
  const markOpen = useActivityStore((s) => s.markOpen)

  const [tab, setTab] = useState<Tab>('sequencia')
  const [help, setHelp] = useState(false)
  const [cursor, setCursor] = useState(() => new Date())
  const today = localTodayIso()

  useEffect(() =>
  {
    hydrate()
    markOpen()
  }, [hydrate, markOpen])

  useEffect(() =>
  {
    seedDates(
      tasks.filter((t) => t.status === 'done').map((t) => t.dataVencimento ?? ''),
      'task',
    )
    seedDates(humor.map((h) => h.data), 'mood')
    seedDates(finance.map((t) => t.data), 'finance')
    seedDates(Object.keys(waterDays).filter((iso) => (waterDays[iso] ?? 0) > 0), 'water')
    void notes
  }, [tasks, humor, finance, waterDays, notes, seedDates])

  const actions = useMemo(() => actionIsos(days), [days])
  const opens = useMemo(() => openIsos(days), [days])
  const stats = useMemo(() => consecutiveLocalActivity(actions), [actions])
  const week = useMemo(() => buildStreakWeek(actions, opens), [actions, opens])
  const monthCells = useMemo(
    () => buildStreakMonth(cursor.getFullYear(), cursor.getMonth(), actions, opens),
    [cursor, actions, opens],
  )
  const monthLabel = cursor.toLocaleDateString('pt-BR', { month: 'long' })
  const next = nextStreakMilestone(stats.current)
  const barPct = next ? Math.min(100, Math.round((stats.current / next) * 100)) : 100
  const todayLog = days[today]
  const todayOk = (todayLog?.actions.length ?? 0) > 0

  const recent = useMemo(() =>
  {
    return [...actions]
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 14)
      .map((iso) => ({ iso, kinds: days[iso]?.actions ?? [] }))
  }, [actions, days])

  if (!userId) return <Redirect href="/login" />

  return (
    <Screen scroll tabBarInset={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Voltar"
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.elevated,
          }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => setHelp(true)}
          accessibilityLabel="Como funciona"
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.elevated,
          }}
        >
          <Ionicons name="help" size={18} color={colors.ink} />
        </Pressable>
      </View>
      <Text variant="hero" style={{ fontSize: 32, letterSpacing: -0.8, marginBottom: 12 }}>
        Ofensiva
      </Text>

      <PillTabs
        tabs={[
          { id: 'sequencia', label: 'Sequência' },
          { id: 'ativos', label: 'Dias ativos' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'sequencia' ? (
        <View style={{ gap: 28, paddingTop: 8, alignItems: 'center' }}>
          <StreakWeekRow cells={week} />

          <View style={{ alignItems: 'center', gap: 4 }}>
            <Ionicons name="flame" size={88} color={colors.axel} />
            <Text
              variant="hero"
              style={{
                marginTop: -36,
                fontSize: 56,
                letterSpacing: -2,
                lineHeight: 60,
              }}
            >
              {stats.current}
            </Text>
            <Text variant="caption" muted>
              dias seguindo o plano
            </Text>
            <Text variant="bodyStrong" style={{ marginTop: 8 }}>
              Recorde pessoal: {stats.record}
            </Text>
          </View>

          <View style={{ alignSelf: 'stretch', gap: 8 }}>
            <View
              style={{
                height: 10,
                borderRadius: 999,
                backgroundColor: colors.hairline,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${barPct}%`,
                  height: '100%',
                  backgroundColor: colors.axel,
                  borderRadius: 999,
                }}
              />
            </View>
            <Text variant="caption" muted>
              {next
                ? `Próximo marco: ${next} dias`
                : 'Você passou de todos os marcos desta trilha.'}
            </Text>
          </View>

          <View style={{ alignSelf: 'stretch', gap: 6 }}>
            <Text variant="bodyStrong">
              {todayOk ? 'Bom trabalho hoje.' : 'Ainda dá tempo de fechar o dia.'}
            </Text>
            <Text variant="caption" muted>
              {todayOk
                ? 'Volte amanhã — ou continue anotando e concluindo agora.'
                : 'Abra o app, anote, conclua uma tarefa ou registre o humor.'}
            </Text>
          </View>

          <View style={{ alignSelf: 'stretch' }}>
            <StreakMonthCard
              label={monthLabel}
              cells={monthCells}
              todayIso={today}
              onPrev={() =>
                setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
              }
              onNext={() =>
                setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
              }
            />
          </View>

          <PrimaryButton
            label="Executar uma tarefa"
            onPress={() => router.push('/(tabs)/kanban')}
            style={{ alignSelf: 'stretch' }}
          />
        </View>
      ) : (
        <View style={{ gap: 12, paddingTop: 12 }}>
          <Text variant="caption" muted>
            Dias em que você fez algo: tarefa, nota, humor, gasto, água ou foco.
          </Text>
          {recent.length === 0 ? (
            <Text variant="body">Nenhum dia ativo ainda. Um registro já acende o fogo.</Text>
          ) : (
            recent.map((row) => (
              <View
                key={row.iso}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 52,
                  paddingHorizontal: 14,
                  borderRadius: 16,
                  backgroundColor: colors.elevated,
                }}
              >
                <Ionicons name="flame" size={18} color={colors.axel} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">
                    {new Date(`${row.iso}T12:00:00`).toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                  <Text variant="caption" muted numberOfLines={1}>
                    {row.kinds.map((k) => ACTION_LABEL[k]).join(' · ')}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      <Modal visible={help} transparent animationType="fade" onRequestClose={() => setHelp(false)}>
        <Pressable
          onPress={() => setHelp(false)}
          style={{
            flex: 1,
            backgroundColor: colors.overlay,
            justifyContent: 'center',
            padding: space.lg,
          }}
        >
          <Pressable
            onPress={() => undefined}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              padding: space.lg,
              gap: 10,
            }}
          >
            <Text variant="section">Como conta</Text>
            <Text variant="body" muted>
              Abrir o app marca o dia como em andamento. Concluir tarefa, anotar, registrar humor, lançar gasto, beber água ou fechar um timer fecha o dia com fogo.
            </Text>
            <Text variant="body" muted>
              Um dia sem nada quebra a sequência. O calendário mostra verde-cobre nos dias feitos, âmbar se só abriu, e vermelho se passou em branco.
            </Text>
            <PrimaryButton label="Entendi" onPress={() => setHelp(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  )
}
