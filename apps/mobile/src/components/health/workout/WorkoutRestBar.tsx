import { Pressable, View } from 'react-native'
import { formatRestClock } from '@simply-life/shared'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import type { RestTimer } from '../../../store/workoutStore'

type Props = {
  rest: RestTimer
  now: number
  onAdjust: (deltaSec: number) => void
  onSkip: () => void
}

/** Barra fixa do descanso: contagem, ±15s e pular. */
export function WorkoutRestBar({ rest, now, onAdjust, onSkip }: Props)
{
  const { colors, radius, space } = useTheme()
  const left = Math.max(0, Math.ceil((rest.endsAt - now) / 1000))
  const pct = rest.totalSec > 0 ? Math.min(1, left / rest.totalSec) : 0

  const small = (label: string, onPress: () => void, a11y: string) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => ({
        minWidth: 52,
        height: 44,
        paddingHorizontal: 10,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.canvas,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text variant="label">{label}</Text>
    </Pressable>
  )

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        borderRadius: radius.card,
        backgroundColor: colors.elevated,
        borderWidth: 1,
        borderColor: colors.cardRim,
        padding: space.md,
        gap: space.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="micro" muted numberOfLines={1}>Descanso · {rest.exerciseName}</Text>
          <Text variant="title" color={colors.done} style={{ fontVariant: ['tabular-nums'] }}>
            {formatRestClock(left)}
          </Text>
        </View>
        {small('-15s', () => onAdjust(-15), 'Tirar 15 segundos')}
        {small('+15s', () => onAdjust(15), 'Somar 15 segundos')}
        {small('Pular', onSkip, 'Pular descanso')}
      </View>
      <View style={{ height: 4, borderRadius: radius.pill, backgroundColor: colors.canvas, overflow: 'hidden' }}>
        <View style={{ width: `${pct * 100}%`, height: 4, backgroundColor: colors.done }} />
      </View>
    </View>
  )
}
