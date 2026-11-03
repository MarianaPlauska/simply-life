import { useState, type ReactNode } from 'react'
import { View } from 'react-native'
import { type FinanceTx, type MobileTask } from '@simply-life/shared'
import { Text, ProgressRing } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useElo } from '../../hooks/useElo'
import { useWebBox } from './web/webBox'
import { useInPanel } from '../../ui/Panel'
import { LifeGoalMicroLine, LifeGoalSheet } from './LifeGoalSheet'
import { HomeSearchBar } from './HomeSearchBar'

type Props = {
  tasks: MobileTask[]
  finance: FinanceTx[]
  pending: number
  doneToday: number
  /** Ritual da manhã, depois do progresso. No celular a Home não usa este bloco. */
  ritualSlot?: ReactNode
}

/** Progresso do dia no desktop. No celular a busca e o "Agora" ficam soltos. */
export function HomeTodayDashboard({
  tasks,
  finance,
  pending,
  doneToday,
  ritualSlot,
}: Props)
{
  const { colors, elevation } = useTheme()
  const inPanel = useInPanel()
  const webBox = useWebBox()
  const box = inPanel ? { borderRadius: 0, padding: 0, backgroundColor: 'transparent' } : webBox
  const elo = useElo()
  const [goalOpen, setGoalOpen] = useState(false)
  const [searching, setSearching] = useState(false)

  const todayTotal = pending + doneToday
  const pct = todayTotal > 0 ? Math.round((doneToday / todayTotal) * 100) : 0

  return (
    <View style={{ gap: 16 }}>
      <LifeGoalSheet visible={goalOpen} onClose={() => setGoalOpen(false)} />
      <HomeSearchBar tasks={tasks} finance={finance} onSearching={setSearching} />

      {searching ? null : (
        <>
          <View
            style={{
              borderRadius: 16,
              padding: 16,
              gap: 16,
              backgroundColor: colors.elevated,
              ...(inPanel ? null : elevation.card),
              ...box,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <ProgressRing
                progress={pct}
                size={64}
                strokeWidth={7}
                color={colors.axelFill}
                trackColor={colors.fill}
                centerLabel={`${pct}%`}
                labelColor={colors.ink}
              />
              <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                <Text variant="caption" muted>Hoje</Text>
                <Text variant="bodyStrong" style={{ fontSize: 19, lineHeight: 24 }} numberOfLines={1}>
                  {todayTotal > 0
                    ? `${doneToday} de ${todayTotal} concluídas`
                    : pending > 0
                      ? `${pending} em aberto`
                      : 'Nenhuma tarefa para hoje'}
                </Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: 'row',
                borderTopWidth: 1,
                borderTopColor: colors.hairline,
                paddingTop: 12,
              }}
            >
              {[
                { value: pending, label: 'Abertas' },
                { value: doneToday, label: 'Feitas' },
                { value: elo.atual, label: elo.atual === 1 ? 'Dia de elo' : 'Dias de elo' },
              ].map((s, i) => (
                <View
                  key={s.label}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    gap: 2,
                    paddingLeft: i === 0 ? 0 : 12,
                    borderLeftWidth: i === 0 ? 0 : 1,
                    borderLeftColor: colors.hairline,
                  }}
                >
                  <Text variant="bodyStrong" style={{ fontSize: 19, lineHeight: 26 }}>
                    {s.value}
                  </Text>
                  <Text variant="micro" muted numberOfLines={1}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
            <LifeGoalMicroLine onPress={() => setGoalOpen(true)} />
          </View>
          {ritualSlot}
        </>
      )}
    </View>
  )
}
