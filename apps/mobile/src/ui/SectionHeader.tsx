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
        marginBottom: space.xs,
        gap: space.xs,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="section" style={{ fontSize: 15 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" muted style={{ marginTop: 1, fontSize: 11 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  )
}
