import { View } from 'react-native'
import { Text, Card } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useWorkspace } from '../../layout/useWorkspace'

export type MetricItem = {
  label: string
  value: string
  /** Cor do número - módulo (não cobre AXEL) */
  color?: string
  hint?: string
}

/** Nível 2 - par de métricas; no desktop ocupa a faixa como SoftTech */
export function MetricCards({ items }: { items: MetricItem[] })
{
  const { colors, space } = useTheme()
  const { showRail } = useWorkspace()
  const minH = showRail ? 88 : 76
  const valueSize = showRail ? 24 : 18

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: showRail ? space.md : space.sm }}>
      {items.map((item) => (
        <Card
          key={item.label}
          tone="elevated"
          style={{
            flexGrow: 1,
            flexBasis: showRail ? 200 : 0,
            flex: showRail ? undefined : 1,
            gap: 4,
            minHeight: minH,
            justifyContent: 'center',
            borderRadius: 14,
            padding: 10,
          }}
        >
          <Text variant="caption" muted>
            {item.label}
          </Text>
          <Text
            variant="title"
            color={item.color ?? colors.ink}
            style={{ letterSpacing: -0.3, fontSize: valueSize, lineHeight: valueSize + 4 }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {item.value}
          </Text>
          {item.hint ? (
            <Text variant="micro" muted>
              {item.hint}
            </Text>
          ) : null}
        </Card>
      ))}
    </View>
  )
}
