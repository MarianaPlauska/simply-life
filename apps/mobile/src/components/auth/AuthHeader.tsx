import { View, StyleSheet, useWindowDimensions } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { BrandMark } from '../BrandMark'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  title: string
  subtitle?: string
  compact?: boolean
  /** Largura do shell (para curva responsiva) */
  width?: number
}

/** Cabeçalho auth — bloco cobre + curva (refs login) */
export function AuthHeader({ title, subtitle, compact, width: widthProp }: Props)
{
  const { colors, space, mode } = useTheme()
  const { width: vw } = useWindowDimensions()
  const width = widthProp ?? vw
  const h = compact ? 200 : 248
  // Marble: rose sólido no light; chrome quente no dark
  const headerBg = mode === 'dark' ? colors.chrome : colors.axel
  const ink = mode === 'dark' ? colors.ink : '#FFF8F0'
  const inkMuted = mode === 'dark' ? colors.inkMuted : 'rgba(255, 248, 240, 0.78)'

  const curve = `
    M 0,0
    H ${width}
    V ${h - 36}
    C ${width * 0.72},${h + 8} ${width * 0.28},${h - 52} 0,${h - 20}
    Z
  `

  return (
    <View style={{ height: h + 28, marginBottom: -space.lg }}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.canvas }]} />
      <Svg
        width={width}
        height={h + 28}
        viewBox={`0 0 ${width} ${h + 28}`}
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Path d={curve} fill={headerBg} />
      </Svg>
      <View
        style={{
          paddingTop: space.lg,
          paddingHorizontal: space.lg,
          alignItems: 'center',
          gap: space.sm,
        }}
      >
        <BrandMark size={compact ? 56 : 64} onFill />
        <Text
          variant="hero"
          style={{ color: ink, letterSpacing: -0.5, textAlign: 'center' }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            variant="body"
            style={{ color: inkMuted, textAlign: 'center', maxWidth: 300 }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  )
}
