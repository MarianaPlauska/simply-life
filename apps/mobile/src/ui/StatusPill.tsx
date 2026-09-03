import { View } from 'react-native'
import { Text } from './Text'

type Props = {
  label: string
  color: string
}

function wash(color: string, alpha = 0.15): string
{
  if (!color.startsWith('#') || color.length < 7) return `rgba(232,115,74,${alpha})`
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Chip de estado - fundo 15% + texto na cor cheia */
export function StatusPill({ label, color }: Props)
{
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: wash(color, 0.15),
      }}
    >
      <Text
        variant="micro"
        style={{ color, fontSize: 12, fontWeight: '600', lineHeight: 16 }}
      >
        {label}
      </Text>
    </View>
  )
}
