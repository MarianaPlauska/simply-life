import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type Props = {
  name: keyof typeof Ionicons.glyphMap
  color: string
  size?: number
  iconSize?: number
}

function wash(color: string, alpha = 0.15): string
{
  if (!color.startsWith('#') || color.length < 7) return `rgba(232,115,74,${alpha})`
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Círculo com fundo 15% da cor do módulo + ícone na cor cheia */
export function IconBadge({ name, color, size = 40, iconSize = 20 }: Props)
{
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: wash(color, 0.15),
      }}
    >
      <Ionicons name={name} size={iconSize} color={color} />
    </View>
  )
}
