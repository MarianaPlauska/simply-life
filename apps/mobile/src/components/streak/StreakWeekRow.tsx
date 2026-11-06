import { View } from 'react-native'
import { Icon } from '../../ui/Icon'
import type { StreakWeekCell } from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = { cells: StreakWeekCell[] }

function glyph(
  kind: StreakWeekCell['kind'],
  colors: { axel: string; attention: string; inkMuted: string },
): { name: keyof typeof Icon.glyphMap; color: string } | 'num'
{
  if (kind === 'action') return { name: 'leaf', color: colors.axel }
  // descanso automático: lua, em tom neutro (não é falta)
  if (kind === 'rest') return { name: 'moon', color: colors.inkMuted }
  // hoje em aberto e dia sem registro ficam só com o número, sem alerta
  return 'num'
}

/** Fogo, descanso ou em andamento na semana atual. */
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
            <Text variant="caption" muted style={{ fontSize: 12 }}>
              {cell.label}
            </Text>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: future || cell.kind === 'today' ? 1 : 0,
                borderStyle: future ? 'dashed' : 'solid',
                borderColor: cell.kind === 'today' ? colors.inkMuted : colors.hairline,
                backgroundColor: g === 'num' ? 'transparent' : colors.fill,
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
