import { View, StyleSheet } from 'react-native'
import Svg, { Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg'
import { BrandMark } from '../BrandMark'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

/** Painel lateral de marca — desktop login split-screen */
export function LoginBrandPanel()
{
  const { space, mode } = useTheme()
  const base = mode === 'dark' ? '#1A1816' : '#2A2622'
  const copper = mode === 'dark' ? '#E8734A' : '#B8502C'
  const copperSoft = mode === 'dark' ? 'rgba(232, 115, 74, 0.35)' : 'rgba(184, 80, 44, 0.28)'

  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="brandBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={base} />
            <Stop offset="0.55" stopColor={mode === 'dark' ? '#252220' : '#3A3530'} />
            <Stop offset="1" stopColor={copper} stopOpacity={0.85} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#brandBg)" />
        <Circle cx="18%" cy="22%" r="120" fill={copperSoft} />
        <Circle cx="82%" cy="68%" r="160" fill={copperSoft} opacity={0.65} />
        <Circle cx="55%" cy="38%" r="72" fill="rgba(255,255,255,0.06)" />
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
          variant="hero"
          style={{
            color: '#F2EDE6',
            letterSpacing: -0.6,
            fontSize: 36,
            textShadowColor: 'rgba(0, 0, 0, 0.55)',
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
            lineHeight: 30,
          }}
        >
          Humor, água, tarefas e finanças — com o AXEL ao seu lado.
        </Text>
        <Text variant="body" style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 380 }}>
          O essencial, no seu ritmo.
        </Text>
      </View>
    </View>
  )
}
