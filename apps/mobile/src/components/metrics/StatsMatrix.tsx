import { View } from 'react-native'
import type { BinaryStat } from '@simply-life/shared'
import { Card, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  rows: BinaryStat[]
}

/** Tabela compacta Realizado / Não realizado. */
export function StatsMatrix({ rows }: Props)
{
  const { colors, space } = useTheme()
  const visible = rows.filter((r) => r.done + r.missed > 0 || r.id === 'tasks')

  return (
    <Card tone="elevated" style={{ gap: space.sm, padding: 16 }}>
      <Text variant="section" style={{ fontSize: 16 }}>
        Estatísticas
      </Text>
      <View style={{ flexDirection: 'row', paddingBottom: 6 }}>
        <View style={{ flex: 1.2 }} />
        <Text variant="micro" muted style={{ flex: 1, textAlign: 'right' }}>
          Realizado
        </Text>
        <Text variant="micro" muted style={{ flex: 1, textAlign: 'right' }}>
          Não realizado
        </Text>
      </View>
      {visible.map((row) => (
        <View
          key={row.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: 36,
            borderTopWidth: 1,
            borderTopColor: colors.hairline,
            paddingTop: 8,
          }}
        >
          <Text variant="bodyStrong" style={{ flex: 1.2, fontSize: 14 }}>
            {row.label}
          </Text>
          <Text
            variant="bodyStrong"
            color={colors.done}
            style={{ flex: 1, textAlign: 'right', fontSize: 16 }}
          >
            {row.done}
          </Text>
          <Text
            variant="bodyStrong"
            color={row.missed > 0 ? colors.danger : colors.inkMuted}
            style={{ flex: 1, textAlign: 'right', fontSize: 16 }}
          >
            {row.missed}
          </Text>
        </View>
      ))}
    </Card>
  )
}
