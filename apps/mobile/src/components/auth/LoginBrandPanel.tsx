import { View, StyleSheet } from 'react-native'
import Svg, { Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg'
import { MARBLE } from '@simply-life/ui-tokens'
import { BrandMark } from '../BrandMark'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

/** Painel lateral de marca — desktop login split-screen (paleta Marble) */
export function LoginBrandPanel()
{
  const { space, mode } = useTheme()
  const base = mode === 'dark' ? '#1A1214' : MARBLE.rose
  const mid = mode === 'dark' ? '#3A1A24' : MARBLE.coral
  const end = mode === 'dark' ? MARBLE.coral : MARBLE.salmon
  const soft = mode === 'dark' ? 'rgba(255, 103, 102, 0.35)' : 'rgba(255, 227, 179, 0.35)'

  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="brandBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={base} />
            <Stop offset="0.55" stopColor={mid} />
            <Stop offset="1" stopColor={end} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#brandBg)" />
        <Circle cx="18%" cy="22%" r="120" fill={soft} />
        <Circle cx="82%" cy="68%" r="160" fill={soft} opacity={0.65} />
        <Circle cx="55%" cy="38%" r="72" fill="rgba(255,255,255,0.10)" />
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
            color: '#FFF8F0',
            letterSpacing: -0.6,
            fontSize: 36,
            textShadowColor: 'rgba(0, 0, 0, 0.35)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 10,
          }}
        >
          Simply Life
        </Text>
        <Text
          variant="voice"
          style={{
            color: 'rgba(255,248,240,0.92)',
            maxWidth: 420,
            lineHeight: 30,
          }}
        >
          Humor, água, tarefas e finanças — com o AXEL ao seu lado.
        </Text>
        <Text variant="body" style={{ color: 'rgba(255,248,240,0.72)', maxWidth: 380 }}>
          O essencial, no seu ritmo.
        </Text>
      </View>
    </View>
  )
}
