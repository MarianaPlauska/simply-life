import { useMemo } from 'react'
import { View } from 'react-native'
import {
  consecutiveActivity,
  streakPhrase,
  uniqueIsoDates,
  type MobileTask,
} from '@simply-life/shared'
import { Text, Card, StatusPill, ProgressRing } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'

type Props = {
  tasks: MobileTask[]
}

export function HomeActivityHeatmap({ tasks }: Props)
{
  const { colors, space } = useTheme()
  const humor = useDataStore((s) => s.humor) ?? []

  const { current, record, weekLogged } = useMemo(() =>
  {
    const taskDays = tasks
      .filter((t) => t.status === 'done')
      .map((t) => t.dataVencimento)
    const moodDays = humor.map((h) => h.data)
    return consecutiveActivity(uniqueIsoDates([...taskDays, ...moodDays]))
  }, [tasks, humor])

  const ringPct = Math.min(100, Math.round((current / 30) * 100))
  const phrase = streakPhrase(current, weekLogged)

  return (
    <Card
      tone="elevated"
      style={{
        gap: space.md,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: colors.hairline,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <ProgressRing
        progress={ringPct}
        size={84}
        strokeWidth={7}
        color={colors.axel}
        centerLabel={String(current)}
      />
      <View style={{ flex: 1, gap: 8, minWidth: 0 }}>
        <Text variant="bodyStrong" style={{ fontSize: 15 }}>
          Sequência
        </Text>
        <Text variant="body" muted style={{ fontSize: 14, lineHeight: 20 }}>
          {phrase}
        </Text>
        <StatusPill label={`Sequência recorde: ${record} dias`} color={colors.axel} />
      </View>
    </Card>
  )
}
