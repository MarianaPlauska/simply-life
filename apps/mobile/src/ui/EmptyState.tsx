import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text } from './Text'
import { useTheme } from '../theme/ThemeProvider'

export function EmptyState({
  title,
  body,
  icon = 'sparkles-outline',
}: {
  title: string
  body: string
  icon?: keyof typeof Ionicons.glyphMap
})
{
  const { colors, space } = useTheme()
  return (
    <View style={{ alignItems: 'center', paddingVertical: space.md, paddingHorizontal: space.sm, gap: space.sm }}>
      <Ionicons name={icon} size={36} color={colors.inkFaint} />
      <Text variant="section" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      <Text variant="body" muted style={{ textAlign: 'center' }}>
        {body}
      </Text>
    </View>
  )
}
