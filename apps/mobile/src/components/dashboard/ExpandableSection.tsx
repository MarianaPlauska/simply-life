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
        gap: expanded ? space.sm : space.xs,
        borderRadius: 24,
        overflow: 'hidden',
        padding: 16,
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
          gap: 8,
          minHeight: 40,
        }}
      >
        <View
          style={{
            width: 3,
            alignSelf: 'stretch',
            borderRadius: 999,
            backgroundColor: accent,
            minHeight: 28,
          }}
        />
        <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <Text variant="section" style={{ fontSize: 15 }}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" muted numberOfLines={1} style={{ fontSize: 11 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {pill ? <StatusPill label={pill} color={pillColor ?? accent} /> : null}
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
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
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
