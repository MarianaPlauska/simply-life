import { useMemo } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  consecutiveLocalActivity,
  streakPhrase,
  uniqueIsoDates,
  type MobileTask,
} from '@simply-life/shared'
import { Text, ProgressRing, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { actionIsos, useActivityStore } from '../../store/activityStore'

type Props = {
  tasks: MobileTask[]
}

/** Card de insight — fundo suave, CTA, sem caixa dentro de caixa. */
export function HomeActivityHeatmap({ tasks }: Props)
{
  const { colors } = useTheme()
  const router = useRouter()
  const humor = useDataStore((s) => s.humor) ?? []
  const days = useActivityStore((s) => s.days)

  const { current, record, weekLogged } = useMemo(() =>
  {
    const taskDays = tasks
      .filter((t) => t.status === 'done')
      .map((t) => t.dataVencimento)
    const moodDays = humor.map((h) => h.data)
    return consecutiveLocalActivity(
      uniqueIsoDates([...taskDays, ...moodDays, ...actionIsos(days)]),
    )
  }, [tasks, humor, days])

  const ringPct = Math.min(100, Math.round((current / 30) * 100))
  const phrase = streakPhrase(current, weekLogged)

  return (
    <View
      style={{
        borderRadius: 24,
        padding: 20,
        gap: 16,
        backgroundColor: colors.axelMuted,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <ProgressRing
          progress={ringPct}
          size={64}
          strokeWidth={5}
          color={colors.axel}
          centerLabel={String(current)}
        />
        <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
          <Text variant="caption" muted>
            Sequência
          </Text>
          <Text variant="bodyStrong" style={{ fontSize: 17 }}>
            {current} dias de ritmo
          </Text>
          <Text variant="caption" muted style={{ lineHeight: 18 }}>
            {phrase} Recorde: {record} dias.
          </Text>
        </View>
      </View>
      <PressableScale
        accessibilityLabel="Ver ofensiva"
        onPress={() => router.push('/ofensiva')}
        style={{
          alignSelf: 'stretch',
          minHeight: 44,
          borderRadius: 999,
          backgroundColor: colors.axel,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text variant="label" style={{ color: colors.axelOnFill, fontWeight: '700' }}>
          Ver ofensiva
        </Text>
      </PressableScale>
    </View>
  )
}
