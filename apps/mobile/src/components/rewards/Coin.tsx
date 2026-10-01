import { View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

const FACE = '#E8B04B'
const RIM = '#B9822A'
const SHINE = '#F6D58E'

/** Moeda do Simply Life: âmbar com borda e um brilho de quatro pontas no centro. */
export function CoinIcon({ size = 18 }: { size?: number })
{
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      <Circle cx={12} cy={12} r={11} fill={RIM} />
      <Circle cx={12} cy={12} r={9} fill={FACE} />
      <Circle cx={12} cy={12} r={7.2} fill="none" stroke={RIM} strokeWidth={0.9} opacity={0.55} />
      <Path d="M12 6.8 L13.3 10.7 L17.2 12 L13.3 13.3 L12 17.2 L10.7 13.3 L6.8 12 L10.7 10.7 Z" fill={SHINE} />
    </Svg>
  )
}

/** Saldo de moedas: moeda + número. `delta` mostra quanto entrou agora. */
export function CoinBalance({ value, delta, size = 'md' }: { value: number; delta?: number; size?: 'sm' | 'md' })
{
  const { colors } = useTheme()
  const icon = size === 'sm' ? 14 : 18
  return (
    <View
      accessibilityLabel={`${value} moedas`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: size === 'sm' ? 8 : 10,
        paddingVertical: size === 'sm' ? 2 : 4,
        borderRadius: 999,
        backgroundColor: colors.attentionMuted,
        alignSelf: 'flex-start',
      }}
    >
      <CoinIcon size={icon} />
      <Text variant={size === 'sm' ? 'caption' : 'bodyStrong'} style={{ color: colors.ink }}>
        {value}
      </Text>
      {delta ? (
        <Text variant="caption" style={{ color: colors.attention, fontWeight: '600' }}>
          +{delta}
        </Text>
      ) : null}
    </View>
  )
}
