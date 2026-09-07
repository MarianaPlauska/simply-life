import { type ReactNode, useState } from 'react'
import { View, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card, Text, StatusPill } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  title: string
  subtitle?: string
  pill?: string
  pillColor?: string
  /** Começa fechado - progressive disclosure */
  defaultOpen?: boolean
  children: ReactNode
}

/**
 * Seção Home que colapsa de verdade (fecha o conteúdo denso).
 */
export function HomeCollapsible({
  title,
  subtitle,
  pill,
  pillColor,
  defaultOpen = false,
  children,
}: Props)
{
  const { colors, space } = useTheme()
  const [open, setOpen] = useState(defaultOpen)
  const leftAccent = pillColor ?? colors.axel

  return (
    <Card
      tone="elevated"
      style={{
        borderRadius: 24,
        gap: open ? space.sm : space.xs,
        padding: 16,
      }}
    >
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${open ? 'Recolher' : 'Expandir'} ${title}`}
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
            backgroundColor: leftAccent,
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
        {pill ? <StatusPill label={pill} color={pillColor ?? colors.axel} /> : null}
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
            name={open ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.inkMuted}
          />
        </View>
      </Pressable>

      {open ? <View style={{ gap: space.sm }}>{children}</View> : null}
    </Card>
  )
}
