import { StyleSheet, View } from 'react-native'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

/** Pote da liga em 4 faixas: enche de baixo para cima, sem número. */
export function LeaguePot({ faixa, size = 64 }: { faixa: number | null; size?: number })
{
  const { colors } = useTheme()
  const level = faixa == null ? 0 : Math.max(0, Math.min(4, faixa))
  const full = level >= 4
  return (
    <View
      accessibilityLabel={faixa == null ? 'Pote ainda sem grupo' : `Pote ${level} de 4 cheio`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        borderWidth: 2,
        borderColor: full ? colors.axel : colors.hairlineStrong,
        overflow: 'hidden',
        justifyContent: 'flex-end',
        backgroundColor: colors.surface,
      }}
    >
      <View
        style={{
          height: `${level * 25}%`,
          backgroundColor: full ? colors.axelFill : colors.brand,
          opacity: full ? 1 : 0.75,
        }}
      />
      {faixa == null ? (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text variant="micro" muted>
            1 pessoa
          </Text>
        </View>
      ) : null}
    </View>
  )
}
