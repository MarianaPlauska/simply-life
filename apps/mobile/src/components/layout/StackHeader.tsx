import { View, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Icon } from '../../ui/Icon'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

/** Cabeçalho de telas fora das tabs - Voltar + título. */
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
    // respiro no topo: no navegador e em aparelhos sem notch a área segura é zero
    <View style={{ gap: space.xs, paddingTop: space.lg, marginBottom: space.xl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.elevated,
          }}
        >
          <Icon name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0, gap: space.xs }}>
          <Text variant="title" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" muted numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  )
}
