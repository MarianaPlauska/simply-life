import { View } from 'react-native'
import { Icon } from '../../ui/Icon'
import type { StreakWeekCell } from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = { cells: StreakWeekCell[] }

function glyph(
  kind: StreakWeekCell['kind'],
  colors: { axel: string; danger: string; attention: string },
): { name: keyof typeof Icon.glyphMap; color: string } | 'num'
{
  if (kind === 'action') return { name: 'flame', color: colors.axel }
  if (kind === 'missed') return { name: 'close-circle', color: colors.danger }
  if (kind === 'open' || kind === 'today') return { name: 'alert-circle', color: colors.attention }
  return 'num'
}

/** Fogo / falta / em andamento da semana atual. */
export function StreakWeekRow({ cells }: Props)
{
  const { colors } = useTheme()

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
      {cells.map((cell) =>
      {
        const g = glyph(cell.kind, colors)
        const future = cell.kind === 'future'
        return (
          <View key={cell.iso} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
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
                <Icon name={g.name} size={20} color={g.color} />
              )}
            </View>
          </View>
        )
      })}
    </View>
  )
}
