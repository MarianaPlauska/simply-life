import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { DashboardGlance } from '@simply-life/shared'
import { Text, Card } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  glance: DashboardGlance
  tint: string
}

/** Card modular de área da vida — ícone, valor e barra de progresso */
export function GlanceCard({ glance, tint }: Props)
{
  const { colors, space } = useTheme()
  const pct = Math.max(0, Math.min(100, glance.progress ?? 0))
  const iconName = (glance.icon || 'ellipse-outline') as keyof typeof Ionicons.glyphMap

  return (
    <Card
      tone="elevated"
      style={{
        width: '100%',
        gap: 8,
        paddingTop: space.md,
        paddingBottom: space.md + 6,
        paddingHorizontal: space.md,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={iconName} size={16} color={tint} />
        </View>
        <Text variant="caption" muted numberOfLines={1} style={{ flex: 1 }}>
          {glance.label}
        </Text>
      </View>

      <Text variant="section" color={tint} numberOfLines={2}>
        {glance.value}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <View
          style={{
            flex: 1,
            height: 4,
            borderRadius: 999,
            backgroundColor: colors.hairline,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: 999,
              backgroundColor: tint,
            }}
          />
        </View>
        <Text variant="caption" color={tint} style={{ fontSize: 11, minWidth: 28, textAlign: 'right' }}>
          {pct}%
        </Text>
      </View>
    </Card>
  )
}
