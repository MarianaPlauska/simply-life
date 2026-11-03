import { ScrollView, View } from 'react-native'
import { Icon } from '../../ui/Icon'
import { Text, PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

export type HomeShortcut = {
  id: string
  label: string
  value?: string
  icon: keyof typeof Icon.glyphMap
  /** Cor da área (água, humor, tarefas). Sem ela, o círculo fica no cobre. */
  tint?: string
  /** Ícone sobre o círculo. Padrão: tinta que contrasta com a cor da área. */
  iconColor?: string
  onPress: () => void
}

/** Fileira de atalhos no estilo das categorias de app de entrega: rola na horizontal. */
export function HomeQuickActions({ actions }: { actions: HomeShortcut[] })
{
  const { colors } = useTheme()
  if (actions.length === 0)
  {
    return null
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingRight: 4 }}
    >
      {actions.map((a) => (
        <PressableScale
          key={a.id}
          onPress={a.onPress}
          accessibilityRole="button"
          accessibilityLabel={a.value ? `${a.label} ${a.value}` : a.label}
          style={{ width: 72, alignItems: 'center', gap: 6 }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              backgroundColor: colors.fill,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                backgroundColor: a.tint ?? colors.axelMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={a.icon} size={20} color={a.iconColor ?? (a.tint ? colors.glyphInk : colors.ink)} />
            </View>
          </View>
          {a.value ? (
            <Text variant="bodyStrong" numberOfLines={1} style={{ fontSize: 13, maxWidth: '100%' }}>
              {a.value}
            </Text>
          ) : null}
          <Text
            variant="micro"
            muted
            numberOfLines={2}
            style={{ fontSize: 12, textAlign: 'center', fontWeight: '600', lineHeight: 14, maxWidth: '100%' }}
          >
            {a.label}
          </Text>
        </PressableScale>
      ))}
    </ScrollView>
  )
}
