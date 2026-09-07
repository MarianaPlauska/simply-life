import { View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

type Props = {
  color: string
  plus?: boolean
  size?: number
}

/** Ícone de pasta em vidro — aba + corpo translúcido. */
export function FolderGlyph({ color, plus, size = 72 }: Props)
{
  const tabH = Math.round(size * 0.14)
  const bodyH = size - tabH - 4
  const fill = plus ? 'rgba(128,128,128,0.16)' : color

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
          colors={plus ? ['rgba(255,255,255,0.08)', 'rgba(0,0,0,0.06)'] : [`${color}CC`, `${color}66`]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          {plus ? <Ionicons name="add" size={28} color={color} /> : null}
        </LinearGradient>
      </View>
    </View>
  )
}
