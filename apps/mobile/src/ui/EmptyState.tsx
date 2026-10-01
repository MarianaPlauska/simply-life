import { View } from 'react-native'
import { Icon } from './Icon'
import { Text } from './Text'
import { useTheme } from '../theme/ThemeProvider'

export function EmptyState({
  title,
  body,
  icon = 'sparkles-outline',
}: {
  title: string
  body: string
  icon?: keyof typeof Icon.glyphMap
})
{
  const { colors, space } = useTheme()
  return (
    <View style={{ alignItems: 'center', paddingVertical: space.xl, paddingHorizontal: space.md, gap: space.sm }}>
      <Icon name={icon} size={36} color={colors.inkFaint} />
      <Text variant="section" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      <Text variant="body" muted style={{ textAlign: 'center', maxWidth: 480 }}>
        {body}
      </Text>
    </View>
  )
}
