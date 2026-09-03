import { View, StyleSheet, useWindowDimensions } from 'react-native'
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Circle } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BrandMark } from '../BrandMark'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  welcomeLabel?: string
  compact?: boolean
  width?: number
}

export function AuthHeader({ compact, width: widthProp }: Props)
{
  const { colors, space, mode } = useTheme()
  const insets = useSafeAreaInsets()
  const { width: vw } = useWindowDimensions()
  const width = widthProp ?? vw
  const brandH = (compact ? 140 : 152) + insets.top
  const isDark = mode === 'dark'

  return (
    <View style={{ height: brandH }}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.canvas }]} />
      <Svg
        width={width}
        height={brandH}
        viewBox={`0 0 ${width} ${brandH}`}
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          {isDark ? (
            <>
              <LinearGradient id="authBrand" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.elevated} />
                <Stop offset="0.55" stopColor={colors.surface} />
                <Stop offset="1" stopColor={colors.canvas} />
              </LinearGradient>
              <RadialGradient
                id="authAccentGlow"
                cx="50%"
                cy="42%"
                rx="48%"
                ry="55%"
              >
                <Stop offset="0" stopColor={colors.axel} stopOpacity={0.55} />
                <Stop offset="0.45" stopColor={colors.axel} stopOpacity={0.22} />
                <Stop offset="1" stopColor={colors.canvas} stopOpacity={0} />
              </RadialGradient>
            </>
          ) : (
            <LinearGradient id="authBrand" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.axel} />
              <Stop offset="1" stopColor={colors.axelHover} />
            </LinearGradient>
          )}
        </Defs>
        <Rect width={width} height={brandH} fill="url(#authBrand)" />
        {isDark ? (
          <Rect width={width} height={brandH} fill="url(#authAccentGlow)" />
        ) : (
          <>
            <Circle
              cx={width * 0.82}
              cy={brandH * 0.35}
              r={56}
              fill="rgba(255,255,255,0.14)"
            />
            <Circle
              cx={width * 0.12}
              cy={brandH * 0.7}
              r={40}
              fill="rgba(255,255,255,0.1)"
            />
          </>
        )}
      </Svg>

      <View
        style={{
          flex: 1,
          paddingTop: insets.top + space.md,
          paddingBottom: space.md,
          paddingHorizontal: space.lg,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <BrandMark size={40} onFill />
        <Text
          variant="bodyStrong"
          style={{
            color: '#F5F1EC',
            fontSize: 18,
            letterSpacing: -0.3,
          }}
        >
          Simply Life
        </Text>
      </View>
    </View>
  )
}
