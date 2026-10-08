import { View } from 'react-native'
import { moodColor, moodLabel } from '@simply-life/shared'
import { Text } from '../../../ui'
import { Icon } from '../../../ui/Icon'
import { useTheme } from '../../../theme/ThemeProvider'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'

const MOOD_ICONS: Record<number, keyof typeof Icon.glyphMap> = {
  1: 'sad',
  2: 'sad-outline',
  3: 'remove-outline',
  4: 'happy-outline',
  5: 'happy',
}

/**
 * Humor em botões do tamanho do texto, numa linha só (padrão do check-in do Início).
 * No computador substitui os círculos grandes de toque do celular.
 */
export function MoodChipRow({ value, onChange }: { value?: number | null; onChange: (m: number) => void })
{
  const { colors } = useTheme()
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {[1, 2, 3, 4, 5].map((m) =>
      {
        const selected = value === m
        const tint = moodColor(m)
        return (
          <WebHoverable
            key={m}
            onPress={() => onChange(m)}
            accessibilityLabel={moodLabel(m)}
            style={(hovered) => webStyle({
              height: 40,
              paddingHorizontal: 16,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: selected ? `${tint}22` : hovered ? colors.surface : 'transparent',
              borderWidth: 1,
              borderColor: selected ? tint : colors.hairline,
              cursor: 'pointer',
            })}
          >
            <Icon name={MOOD_ICONS[m]} size={18} color={selected ? tint : colors.inkMuted} />
            <Text variant="caption" style={{ color: selected ? tint : colors.ink }}>
              {moodLabel(m)}
            </Text>
          </WebHoverable>
        )
      })}
    </View>
  )
}
