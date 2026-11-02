import { useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  bodyChecked,
  burnoutActive,
  doneTodayLines,
  energyBudget,
  energyFromMinutes,
  energyPoints,
  findHabit,
  localTodayIso,
  parseTaskEnergy,
  suggestedEnergyStock,
  tasksForPlace,
} from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useCalendarStore } from '../../store/calendarStore'
import { useCareExtrasStore } from '../../store/careExtrasStore'

/**
 * Acréscimos do dia: energia, burnout, o que já foi feito e o lugar.
 * Nada daqui reordena tarefa nem muda o ritual da noite.
 */
export function CareHomeStrip()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const hydrate = useCareExtrasStore((s) => s.hydrate)
  const stock = useCareExtrasStore((s) => s.energyStock)
  const setStock = useCareExtrasStore((s) => s.setEnergyStock)
  const burnout = useCareExtrasStore((s) => s.burnoutActive)
  const startBurnout = useCareExtrasStore((s) => s.startBurnout)
  const stopBurnout = useCareExtrasStore((s) => s.stopBurnout)
  const hereSlug = useCareExtrasStore((s) => s.hereSlug)
  const places = useCareExtrasStore((s) => s.places)
  const bodyByDay = useCareExtrasStore((s) => s.bodyByDay)
  const tasks = useDataStore((s) => s.tasks) ?? []
  const finance = useDataStore((s) => s.finance) ?? []
  const humor = useDataStore((s) => s.humor) ?? []
  const habits = useDataStore((s) => s.habits) ?? []
  const events = useCalendarStore((s) => s.events)
  const [burnoutOpen, setBurnoutOpen] = useState(false)
  const [doneOpen, setDoneOpen] = useState(false)
  const today = localTodayIso()

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  const used = useMemo(() =>
  {
    let points = 0
    for (const task of tasks)
    {
      if (task.status === 'done') continue
      if (task.dataVencimento?.slice(0, 10) !== today) continue
      const level = parseTaskEnergy(task.anotacao) ?? energyFromMinutes(task.estimativaMinutos || 30)
      points += energyPoints(level)
    }
    for (const event of events)
    {
      if (event.date !== today || event.allDay || !event.busy || event.inicio == null || event.fim == null) continue
      points += energyPoints(energyFromMinutes(event.fim - event.inicio))
    }
    return points
  }, [tasks, events, today])

  const budget = energyBudget(used, stock)
  const humorToday = humor.filter((item) => (item.data ?? '').slice(0, 10) === today)
  const humorLow = humorToday.some((item) => item.humor <= 2)
  const suggestion = suggestedEnergyStock(stock, { humorLow, manyHigh: used > stock })
  const agua = findHabit(habits, 'agua')
  const lines = doneTodayLines({
    today,
    tasks,
    txs: finance,
    humorCount: humorToday.length,
    aguaCopos: agua?.progressoAtual ?? 0,
    bodyChecked: bodyChecked(bodyByDay[today]),
  })
  const here = places.find((place) => place.slug === hereSlug) ?? null
  const hereTasks = here ? tasksForPlace(tasks, here.slug) : []
  const active = burnoutActive(burnout, today)

  return (
    <View style={{ gap: space.sm, borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: space.sm }}>
      <Text variant="caption" muted>{budget.phrase}</Text>
      {suggestion != null ? (
        <Pressable accessibilityRole="button" onPress={() => setStock(suggestion)} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text variant="body">Baixar o medidor para {suggestion}. O plano do dia continua igual.</Text>
        </Pressable>
      ) : null}

      {active && burnout ? (
        <View style={{ gap: 4 }}>
          <Text variant="body">Modo burnout até {burnout.until.split('-').reverse().join('/')}. O Elo não quebra nesses dias.</Text>
          <Pressable accessibilityRole="button" onPress={stopBurnout} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text variant="body">Desligar</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 4 }}>
          <Pressable accessibilityRole="button" onPress={() => setBurnoutOpen((open) => !open)} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text variant="body">Dia pesado por vários dias</Text>
          </Pressable>
          {burnoutOpen ? (
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Pressable accessibilityRole="button" onPress={() => startBurnout(3)} style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text variant="body">3 dias</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => startBurnout(7)} style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text variant="body">7 dias</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )}

      {lines.length > 0 ? (
        <View style={{ gap: 4 }}>
          <Pressable accessibilityRole="button" onPress={() => setDoneOpen((open) => !open)} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text variant="body">Hoje você já fez {lines.length}</Text>
          </Pressable>
          {doneOpen ? lines.slice(0, 8).map((line) => (
            <Text key={line.id} variant="caption" muted>{line.text}</Text>
          )) : null}
        </View>
      ) : null}

      <Pressable accessibilityRole="button" onPress={() => router.push('/lugares' as never)} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text variant="body">
          {here ? `Você marcou: ${here.nome}. ${hereTasks.length} coisa${hereTasks.length === 1 ? '' : 's'} deste lugar.` : 'Cheguei em um lugar'}
        </Text>
      </Pressable>
    </View>
  )
}
