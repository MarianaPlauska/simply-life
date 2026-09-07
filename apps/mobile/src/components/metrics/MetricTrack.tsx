import { View } from 'react-native'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  pct: number
  currentLabel: string
  targetLabel: string
  fill?: string
}

/** Barra horizontal com marcador - estilo metas/pastas das referências. */
export function MetricTrack({ pct, currentLabel, targetLabel, fill }: Props)
{
  const { colors, mode } = useTheme()
  const clamped = Math.max(0, Math.min(100, pct))
  const color = fill ?? colors.axel
  const track = mode === 'dark' ? '#2A2A2C' : '#E8E0D4'

  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          height: 8,
          borderRadius: 999,
          backgroundColor: track,
          overflow: 'visible',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: `${clamped}%`,
            height: 8,
            borderRadius: 999,
            backgroundColor: color,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: `${clamped}%`,
            marginLeft: -6,
            width: 12,
            height: 12,
            borderRadius: 999,
            backgroundColor: color,
            borderWidth: 2,
            borderColor: colors.elevated,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="micro" muted>
          {currentLabel}
        </Text>
        <Text variant="micro" muted>
          {targetLabel}
        </Text>
      </View>
    </View>
  )
}
