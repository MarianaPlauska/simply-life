import { View, StyleSheet } from 'react-native'
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Circle } from 'react-native-svg'
import { BrandMark } from '../BrandMark'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { LoginProductPreview } from './LoginProductPreview'

/** Landing desktop: preto OLED, cobre AXEL, mock do produto. */
export function LoginBrandPanel()
{
  const { space, colors } = useTheme()

  return (
    <View style={{ flex: 1, overflow: 'hidden', backgroundColor: '#050403' }}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="brandBg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0B0908" />
            <Stop offset="1" stopColor="#050403" />
          </LinearGradient>
          <RadialGradient id="brandAccent" cx="52%" cy="58%" rx="42%" ry="36%">
            <Stop offset="0" stopColor={colors.axel} stopOpacity={0.55} />
            <Stop offset="0.45" stopColor={colors.axel} stopOpacity={0.18} />
            <Stop offset="1" stopColor="#050403" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#brandBg)" />
        <Rect width="100%" height="100%" fill="url(#brandAccent)" />
        <Circle cx="14%" cy="18%" r="90" fill="rgba(232,115,74,0.12)" />
        <Circle cx="88%" cy="82%" r="140" fill="rgba(232,115,74,0.08)" />
      </Svg>

      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: space.xl,
          paddingVertical: space.xl,
          gap: space.md,
        }}
      >
        <BrandMark size={48} onFill />
        <View
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: 12,
            minHeight: 32,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: 'rgba(232,115,74,0.45)',
            backgroundColor: 'rgba(232,115,74,0.12)',
            justifyContent: 'center',
          }}
        >
          <Text variant="caption" style={{ color: '#F5F1EC', fontWeight: '700' }}>
            OS pessoal
          </Text>
        </View>
        <Text
          variant="hero"
          style={{
            color: '#F7F3EE',
            fontSize: 48,
            lineHeight: 52,
            letterSpacing: -1.6,
          }}
        >
          {'Organize.\nPlaneje.\n'}
          <Text
            variant="hero"
            style={{ color: colors.axel, fontSize: 48, lineHeight: 52, letterSpacing: -1.6 }}
          >
            Simply.
          </Text>
        </Text>
        <Text
          variant="body"
          style={{ color: 'rgba(245,241,236,0.78)', maxWidth: 440, fontSize: 16, lineHeight: 24 }}
        >
          {'O essencial do seu dia, numa tela só.\nHumor, treino, tarefas e contas.'}
        </Text>
        <LoginProductPreview />
      </View>
    </View>
  )
}
