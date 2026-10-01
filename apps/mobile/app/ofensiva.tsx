import { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { Icon } from '../src/ui/Icon'
import {
  buildStreakMonth,
  buildStreakWeek,
  CHAMA_WEEK_GOAL_DAYS,
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
import { METAS_HREF } from '../src/lib/sharedGoalRoutes'
import { PersonalDivisionCard } from '../src/components/rewards/TrilhaCards'

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
          <Icon name="chevron-back" size={22} color={colors.ink} />
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
          <Icon name="help" size={18} color={colors.ink} />
        </Pressable>
      </View>
      <Text variant="hero" style={{ fontSize: 32, letterSpacing: -0.8, marginBottom: 12 }}>
        Pique
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

          <View style={{ alignItems: 'center', gap: 6 }}>
            <Icon name="flame" size={88} color={colors.axel} />
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

          <View style={{ alignSelf: 'stretch', gap: 12 }}>
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
                  backgroundColor: colors.axelFill,
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

          <View style={{ alignSelf: 'stretch', gap: 8 }}>
            <Text variant="bodyStrong">
              {todayOk ? 'Hoje já tem registro.' : 'Hoje ainda não tem registro.'}
            </Text>
            <Text variant="caption" muted>
              {todayOk
                ? 'Volte amanhã, ou continue anotando e concluindo agora.'
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
        <View style={{ gap: 16, paddingTop: 12 }}>
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
                  gap: 16,
                  minHeight: 52,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  backgroundColor: colors.elevated,
                }}
              >
                <Icon name="flame" size={18} color={colors.axel} />
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

      <View style={{ marginTop: space.lg }}>
        <PersonalDivisionCard />
      </View>

      <Pressable
        onPress={() => router.push('/colecao' as never)}
        accessibilityRole="button"
        accessibilityLabel="Álbum e prêmios"
        style={({ pressed }) => ({
          marginTop: space.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          padding: space.md,
          borderRadius: 20,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.cardRim,
          opacity: pressed ? 0.88 : 1,
        })}
      >
        <Icon name="gift-outline" size={22} color={colors.ink} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">Álbum e prêmios</Text>
          <Text variant="caption" muted>
            Cada semana com {CHAMA_WEEK_GOAL_DAYS} dias de registro vira uma peça e conta para o prêmio que você escolheu.
          </Text>
        </View>
        <Icon name="chevron-forward" size={18} color={colors.inkMuted} />
      </Pressable>

      <Pressable
        onPress={() => router.push(METAS_HREF)}
        accessibilityRole="button"
        accessibilityLabel="Metas juntos"
        style={({ pressed }) => ({
          marginTop: space.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          padding: space.md,
          borderRadius: 20,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.cardRim,
          opacity: pressed ? 0.88 : 1,
        })}
      >
        <Icon name="people-outline" size={22} color={colors.ink} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">Metas juntos</Text>
          <Text variant="caption" muted>
            Semana vale mais que dia. Com amigos, sem ver o número de ninguém.
          </Text>
        </View>
        <Icon name="chevron-forward" size={18} color={colors.inkMuted} />
      </Pressable>

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
              borderRadius: 20,
              padding: space.lg,
              gap: 12,
            }}
          >
            <Text variant="section">Como conta</Text>
            <Text variant="body" muted>
              Abrir o app marca o dia como em andamento. Concluir tarefa, anotar, registrar humor, lançar gasto, beber água ou fechar um timer fecha o dia com fogo.
            </Text>
            <Text variant="body" muted>
              Um dia sem registro recomeça a contagem de dias seguidos. O recorde fica guardado e nada mais se perde.
            </Text>
            <Text variant="body" muted>
              Semana fechada: 4 dias com registro entre segunda e domingo. Cada semana fechada adiciona uma peça à sua coleção e conta para os seus prêmios.
            </Text>
            <Text variant="body" muted>
              O calendário mostra verde-cobre nos dias com registro, âmbar se só abriu o app, e vermelho nos dias sem nada.
            </Text>
            <PrimaryButton label="Entendi" onPress={() => setHelp(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  )
}
