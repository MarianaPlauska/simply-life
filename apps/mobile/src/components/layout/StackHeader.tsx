import { View, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

/** Cabeçalho de telas fora das tabs — Voltar + título. */
export function StackHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
})
{
  const { colors, space } = useTheme()
  const router = useRouter()

  return (
    <View style={{ gap: 4, marginBottom: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.elevated,
          }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="title" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" muted numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  )
}
