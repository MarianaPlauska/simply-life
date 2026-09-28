import { View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Icon } from '../../ui/Icon'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  color: string
  plus?: boolean
  size?: number
}

/** Ícone de pasta em vidro — aba + corpo translúcido. */
export function FolderGlyph({ color, plus, size = 72 }: Props)
{
  const { colors } = useTheme()
  const tabH = Math.round(size * 0.14)
  const bodyH = size - tabH - 4
  const fill = plus ? colors.hairline : color

  return (
    <View style={{ width: size, height: size, justifyContent: 'flex-end' }}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 8,
          width: size * 0.42,
          height: tabH + 8,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 10,
          backgroundColor: fill,
        }}
      />
      <View
        style={{
          height: bodyH,
          borderRadius: 14,
          overflow: 'hidden',
          backgroundColor: fill,
        }}
      >
        <LinearGradient
          colors={plus ? [`${colors.elevated}66`, `${colors.elevated}00`] : [`${color}CC`, `${color}66`]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          {plus ? <Icon name="add" size={28} color={color} /> : null}
        </LinearGradient>
      </View>
    </View>
  )
}
