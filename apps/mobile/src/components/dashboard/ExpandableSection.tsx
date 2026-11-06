import { type ReactNode } from 'react'
import { View, Pressable } from 'react-native'
import { Icon } from '../../ui/Icon'
import { Card, Text, StatusPill } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  title: string
  subtitle?: string
  pill?: string
  pillColor?: string
  accent: string
  expanded: boolean
  onToggle: () => void
  /** Resumo - só quando expandido (evita tela grudada) */
  summary: ReactNode
  children: ReactNode
}

/**
 * Bloco Home: fechado = só título; aberto = resumo + detalhe.
 */
export function ExpandableSection({
  title,
  subtitle,
  pill,
  pillColor,
  accent,
  expanded,
  onToggle,
  summary,
  children,
}: Props)
{
  const { colors, space } = useTheme()

  return (
    <Card
      tone="elevated"
      style={{
        gap: expanded ? space.sm : space.xs,
        borderRadius: 20,
        overflow: 'hidden',
        padding: 20,
      }}
    >
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? 'Recolher' : 'Expandir'} ${title}`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          minHeight: 40,
        }}
      >
        <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
          <Text variant="section" style={{ fontSize: 16 }}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" muted numberOfLines={1} style={{ fontSize: 12 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {pill ? <StatusPill label={pill} color={pillColor ?? accent} /> : null}
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.inkMuted}
        />
      </Pressable>

      {expanded ? (
        <View style={{ gap: space.md }}>
          {summary}
          {children}
        </View>
      ) : null}
    </Card>
  )
}
