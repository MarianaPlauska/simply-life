import { useEffect, useRef } from 'react'
import { Animated, Easing, View } from 'react-native'
import { boxPhaseHint, boxPhaseLabel, type BoxBreathPhase } from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { usePrefsStore } from '../../store/prefsStore'

type Props = {
  phase: BoxBreathPhase
  remainingSec: number
  cycle: number
  totalCycles: number
}

/** Círculo que cresce na inspiração e encolhe na expiração. */
export function CalmBreathVisual({ phase, remainingSec, cycle, totalCycles }: Props)
{
  const { colors, space } = useTheme()
  const reduceMotion = usePrefsStore((s) => s.prefs.a11y_reduce_motion)
  const scale = useRef(new Animated.Value(1)).current

  useEffect(() =>
  {
    if (reduceMotion) return
    const expanded = phase === 'inhale' || phase === 'holdIn'
    const to = expanded ? 1.28 : 1
    const duration = phase === 'inhale' || phase === 'exhale' ? 4000 : 180
    Animated.timing(scale, {
      toValue: to,
      duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start()
  }, [phase, reduceMotion, scale])

  return (
    <View style={{ alignItems: 'center', gap: space.md, paddingVertical: space.lg }}>
      <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={{
            width: 168,
            height: 168,
            borderRadius: 999,
            backgroundColor: `${colors.health}33`,
            borderWidth: 2,
            borderColor: colors.health,
            transform: [{ scale: reduceMotion ? 1 : scale }],
          }}
        />
        <View
          style={{
            position: 'absolute',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Text variant="hero" style={{ fontSize: 36, letterSpacing: -0.8 }}>
            {remainingSec}
          </Text>
          <Text variant="bodyStrong" color={colors.health}>
            {boxPhaseLabel(phase)}
          </Text>
        </View>
      </View>
      <Text variant="caption" muted style={{ textAlign: 'center' }}>
        {boxPhaseHint(phase)}
      </Text>
      <Text variant="micro" muted>
        Ciclo {cycle} de {totalCycles}
      </Text>
    </View>
  )
}
