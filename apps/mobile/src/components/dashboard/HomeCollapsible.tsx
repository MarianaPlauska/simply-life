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

  return (
    <Card
      tone="elevated"
      style={{
        borderRadius: 24,
        gap: open ? space.md : space.sm,
        borderWidth: 1,
        borderColor: colors.hairline,
        padding: space.lg,
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
          gap: 12,
          minHeight: 48,
        }}
      >
        <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
          <Text variant="section" style={{ fontSize: 17 }}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" muted numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {pill ? <StatusPill label={pill} color={pillColor ?? colors.axel} /> : null}
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
            name={open ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.inkMuted}
          />
        </View>
      </Pressable>

      {open ? <View style={{ gap: space.md }}>{children}</View> : null}
    </Card>
  )
}
