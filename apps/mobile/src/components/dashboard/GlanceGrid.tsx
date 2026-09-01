import { View, useWindowDimensions } from 'react-native'
import { BREAKPOINT } from '@simply-life/ui-tokens'
import type { DashboardGlance } from '@simply-life/shared'
import { Text, Card, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  glances: DashboardGlance[]
  toneColor: (tone: string) => string
  onPressGlance?: (id: string) => void
}

/** Grid responsivo de glances — 2 colunas tablet+, 1 col mobile estreito opcional */
export function GlanceGrid({ glances, toneColor, onPressGlance }: Props)
{
  const { colors, space } = useTheme()
  const { width } = useWindowDimensions()
  const cols = width >= BREAKPOINT.desktop ? 3 : width >= 520 ? 2 : 1
  const gap = space.sm
  const shellW = Math.min(width, cols === 3 ? 1120 : 720)
  const itemBasis = cols === 3 ? '31.5%' : cols === 2 ? '48%' : '100%'
  const itemW = cols > 1 ? (shellW - 32 - gap * (cols - 1)) / cols : undefined

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap,
      }}
    >
      {glances.map((g) =>
      {
        const tint = toneColor(g.tone)
        const body = (
          <Card
            tone="elevated"
            style={{
              width: itemW,
              flexGrow: cols > 1 ? 0 : 1,
              flexBasis: itemBasis,
              minWidth: cols > 1 ? 120 : undefined,
              gap: 6,
              paddingTop: space.md,
              paddingBottom: space.md + 4,
              paddingHorizontal: space.md,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: tint,
              }}
            />
            <Text variant="caption" muted>
              {g.label}
            </Text>
            <Text variant="section" color={tint} numberOfLines={2}>
              {g.value}
            </Text>
          </Card>
        )

        if (!onPressGlance) return <View key={g.id}>{body}</View>

        return (
          <PressableScale
            key={g.id}
            onPress={() => onPressGlance(g.id)}
            style={{ width: itemW, flexGrow: cols > 1 ? 0 : 1, flexBasis: itemBasis }}
          >
            {body}
          </PressableScale>
        )
      })}
    </View>
  )
}
