import { useEffect, useRef } from 'react'
import { Animated, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useRewardPulseStore } from '../../store/rewardPulseStore'
import { gamificationLevel, useGamificationStore } from '../../store/gamificationStore'
import { useNeuroStore } from '../../store/neuroStore'
import { CoinIcon } from './Coin'

const SHOW_MS = 2600

/**
 * Recompensa na hora ao concluir: XP ganho e a barra do nível enchendo.
 * Sem contagem regressiva visível; some sozinha e um toque fecha.
 * "Menos animação" deixa a barra parada no valor final.
 */
export function TaskRewardToast()
{
  const { colors, space, radius, elevation } = useTheme()
  const insets = useSafeAreaInsets()
  const pulse = useRewardPulseStore((s) => s.pulse)
  const clear = useRewardPulseStore((s) => s.clear)
  const totalXp = useGamificationStore((s) => s.totalXp)
  const reduceMotion = useNeuroStore((s) => s.reduceMotion)
  const fill = useRef(new Animated.Value(0)).current

  const lvl = gamificationLevel(totalXp)
  const before = pulse ? gamificationLevel(Math.max(0, totalXp - pulse.xp)) : lvl
  const fromPct = before.level === lvl.level ? before.pct : 0

  useEffect(() =>
  {
    if (!pulse) return
    if (reduceMotion)
    {
      fill.setValue(lvl.pct)
    }
    else
    {
      fill.setValue(fromPct)
      Animated.timing(fill, { toValue: lvl.pct, duration: 700, useNativeDriver: false }).start()
    }
    const t = setTimeout(clear, SHOW_MS)
    return () => clearTimeout(t)
  }, [pulse?.id])

  if (!pulse) return null

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom, 16) + 88, alignItems: 'center' }}
    >
      <Pressable
        onPress={clear}
        accessibilityRole="alert"
        accessibilityLabel={`${pulse.title}${pulse.xp ? `, mais ${pulse.xp} XP` : ''}. Nível ${lvl.level}.`}
        style={{
          width: '92%',
          maxWidth: 420,
          gap: 8,
          padding: space.md,
          borderRadius: radius.control,
          backgroundColor: colors.elevated,
          borderWidth: 1,
          borderColor: colors.cardRim,
          ...elevation.card,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name="checkmark-circle" size={22} color={colors.axel} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {pulse.title}
            </Text>
            <Text variant="caption" muted numberOfLines={1}>
              {pulse.detail}
            </Text>
          </View>
          {pulse.xp > 0 ? (
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <Text variant="bodyStrong" style={{ color: colors.axel }}>
                +{pulse.xp} XP
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <CoinIcon size={12} />
                <Text variant="micro" muted>
                  +{Math.max(1, Math.round(pulse.xp / 4))}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
        <View style={{ height: 6, borderRadius: 999, backgroundColor: colors.hairline, overflow: 'hidden' }}>
          <Animated.View
            style={{
              height: '100%',
              borderRadius: 999,
              backgroundColor: colors.axelFill,
              width: fill.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp' }),
            }}
          />
        </View>
        <Text variant="micro" muted>
          Nível {lvl.level} · {lvl.xpInLevel} de {lvl.xpToNext} XP
          {pulse.xp === 0 ? ' · o XP de hoje já chegou no limite, a conclusão conta igual' : ''}
        </Text>
      </Pressable>
    </View>
  )
}
