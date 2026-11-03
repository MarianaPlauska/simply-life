import { Pressable, View } from 'react-native'
import { UNLOCKS, isUnlocked } from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { ProfileAvatarBadge } from '../social/ProfileAvatarBadge'

type Props = {
  selected: string
  onSelect: (value: string) => void
  level: number
  owned: string[]
  /** Só os do nível 1, os que o cadastro deixa escolher antes de ganhar XP. */
  startersOnly?: boolean
}

/** Ícones do avatar: no começo só os livres; depois, os que o nível ou as moedas abriram. */
export function AvatarIconPicker({ selected, onSelect, level, owned, startersOnly }: Props)
{
  const { colors, space } = useTheme()
  const items = UNLOCKS
    .filter((item) => item.kind === 'avatar')
    .filter((item) => (startersOnly ? item.level <= 1 : isUnlocked(item, level, owned)))
    .sort((a, b) => a.level - b.level || a.label.localeCompare(b.label, 'pt-BR'))

  return (
    <View style={{ gap: space.sm }}>
      <Text variant="caption" muted>
        {startersOnly
          ? 'Escolha um ícone para começar. Os outros abrem conforme o nível sobe.'
          : 'Estes já estão liberados. Toque para usar.'}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {items.map((item) =>
        {
          const on = selected === item.value
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelect(item.value)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: on }}
              style={{
                width: 76,
                minHeight: 92,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                paddingVertical: 8,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: on ? colors.axel : colors.hairline,
                backgroundColor: on ? colors.axelMuted : colors.surface,
              }}
            >
              <ProfileAvatarBadge size={44} icon={item.value} />
              <Text variant="micro" numberOfLines={1} style={{ paddingHorizontal: 4 }}>
                {item.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
