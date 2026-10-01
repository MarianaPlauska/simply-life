import { type ReactNode } from 'react'
import { View } from 'react-native'
import { Text } from './Text'
import { useTheme } from '../theme/ThemeProvider'

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
})
{
  const { space } = useTheme()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: space.md - 4,
        gap: space.sm,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, gap: space.xs }}>
        <Text variant="section">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" muted>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  )
}
