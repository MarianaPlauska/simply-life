import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { StreakWeekCell } from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = { cells: StreakWeekCell[] }

function glyph(kind: StreakWeekCell['kind']): { name: keyof typeof Ionicons.glyphMap; color: string } | 'num'
{
  if (kind === 'action') return { name: 'flame', color: '#E8734A' }
  if (kind === 'missed') return { name: 'close-circle', color: '#E07A6A' }
  if (kind === 'open' || kind === 'today') return { name: 'alert-circle', color: '#E8734A' }
  return 'num'
}

/** Fogo / falta / em andamento da semana atual. */
export function StreakWeekRow({ cells }: Props)
{
  const { colors } = useTheme()

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}>
      {cells.map((cell) =>
      {
        const g = glyph(cell.kind)
        const future = cell.kind === 'future'
        return (
          <View key={cell.iso} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <Text variant="caption" muted style={{ fontSize: 11 }}>
              {cell.label}
            </Text>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: future ? 1 : 0,
                borderStyle: future ? 'dashed' : 'solid',
                borderColor: colors.hairline,
                backgroundColor: future ? 'transparent' : colors.elevated,
              }}
            >
              {g === 'num' ? (
                <Text variant="caption" muted>
                  {cell.dayNum}
                </Text>
              ) : (
                <Ionicons name={g.name} size={20} color={g.color} />
              )}
            </View>
          </View>
        )
      })}
    </View>
  )
}
