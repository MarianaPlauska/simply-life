import { type ReactNode } from 'react'
import { View, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
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
        gap: expanded ? space.md : space.sm,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.hairline,
        borderLeftWidth: 3,
        borderLeftColor: accent,
        overflow: 'hidden',
        padding: space.lg,
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
          minHeight: 48,
        }}
      >
        <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
          <Text variant="section" style={{ fontSize: 17 }}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" muted numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {pill ? <StatusPill label={pill} color={pillColor ?? accent} /> : null}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.inkMuted}
          />
        </View>
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
