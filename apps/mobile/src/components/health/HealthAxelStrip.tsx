import { View } from 'react-native'
import { Text } from '../../ui'
import { AxelSun } from '../AxelSun'
import { useTheme } from '../../theme/ThemeProvider'

/** Mensagem AXEL integrada na tela — faixa lateral, sem Card. */
export function HealthAxelStrip({ message }: { message: string })
{
  const { colors, space } = useTheme()

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: space.md,
        paddingVertical: space.sm,
        paddingLeft: 12,
        borderLeftWidth: 3,
        borderLeftColor: colors.axel,
      }}
    >
      <AxelSun size={44} />
      <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
        <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
          AXEL
        </Text>
        <Text variant="voice">{message}</Text>
      </View>
    </View>
  )
}
