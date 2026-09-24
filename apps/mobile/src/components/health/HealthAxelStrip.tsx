import { View } from 'react-native'
import { Text, IconBadge } from '../../ui'
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
      <IconBadge name="sparkles" color={colors.axel} size={40} iconSize={20} />
      <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
        <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
          AXEL
        </Text>
        <Text variant="voice">{message}</Text>
      </View>
    </View>
  )
}
