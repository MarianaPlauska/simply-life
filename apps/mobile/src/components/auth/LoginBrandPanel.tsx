import { View, StyleSheet } from 'react-native'
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop, Rect } from 'react-native-svg'
import { BrandMark } from '../BrandMark'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

/** Painel lateral desktop - claro: terracota; escuro: Dark Onyx + brilho accent */
export function LoginBrandPanel()
{
  const { space, colors, mode } = useTheme()
  const isDark = mode === 'dark'
  const base = isDark ? colors.canvas : '#0C1519'
  const mid = isDark ? colors.surface : '#C6A17E'
  const copper = isDark ? colors.elevated : colors.axel
  const copperSoft = isDark
    ? 'rgba(232, 115, 74, 0.2)'
    : 'rgba(198, 161, 126, 0.40)'

  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="brandBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={base} />
            <Stop offset="0.55" stopColor={mid} />
            <Stop offset="1" stopColor={copper} stopOpacity={isDark ? 1 : 0.75} />
          </LinearGradient>
          {isDark ? (
            <RadialGradient id="brandAccent" cx="50%" cy="40%" rx="45%" ry="40%">
              <Stop offset="0" stopColor={colors.axel} stopOpacity={0.5} />
              <Stop offset="0.5" stopColor={colors.axel} stopOpacity={0.18} />
              <Stop offset="1" stopColor={colors.canvas} stopOpacity={0} />
            </RadialGradient>
          ) : null}
        </Defs>
        <Rect width="100%" height="100%" fill="url(#brandBg)" />
        {isDark ? <Rect width="100%" height="100%" fill="url(#brandAccent)" /> : null}
        <Circle cx="18%" cy="22%" r="120" fill={copperSoft} />
        <Circle cx="82%" cy="68%" r="160" fill={copperSoft} opacity={0.55} />
        <Circle cx="55%" cy="38%" r="72" fill="rgba(255,255,255,0.05)" />
      </Svg>

      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: space.xl,
          paddingVertical: space.xxl,
          gap: space.lg,
        }}
      >
        <BrandMark size={72} onFill />
        <Text
          variant="title"
          style={{
            color: '#F5F1EC',
            letterSpacing: -0.6,
            textShadowColor: 'rgba(0, 0, 0, 0.45)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 10,
          }}
        >
          Simply Life
        </Text>
        <Text
          variant="voice"
          style={{
            color: 'rgba(255,255,255,0.88)',
            maxWidth: 420,
          }}
        >
          Humor, água, tarefas e finanças. Com o AXEL ao seu lado.
        </Text>
        <Text variant="body" style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 380 }}>
          O essencial, no seu ritmo.
        </Text>
      </View>
    </View>
  )
}
