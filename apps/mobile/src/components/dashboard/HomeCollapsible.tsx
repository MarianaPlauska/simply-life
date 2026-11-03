import { type ReactNode, useState } from 'react'
import { View, Pressable } from 'react-native'
import { Icon } from '../../ui/Icon'
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
        borderRadius: 16,
        gap: open ? space.sm : 0,
        paddingHorizontal: 16,
        paddingVertical: 8,
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
        <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <Text variant="body" style={{ fontSize: 16 }}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" muted numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {pill ? <StatusPill label={pill} color={pillColor ?? colors.axel} /> : null}
        <Icon
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.inkFaint}
        />
      </Pressable>

      {open ? <View style={{ gap: space.sm }}>{children}</View> : null}
    </Card>
  )
}
