import { ScrollView } from 'react-native'
import { Chip } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type ChipItem = {
  id: string
  label: string
  dotColor?: string
}

/** Chips em faixa horizontal — compactos, sem empilhar em coluna. */
export function ChipGrid({
  items,
  value,
  onChange,
}: {
  items: ChipItem[]
  value: string
  onChange: (id: string) => void
})
{
  const { space } = useTheme()

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: space.sm,
        paddingVertical: 2,
        alignItems: 'center',
      }}
    >
      {items.map((item) => (
        <Chip
          key={item.id}
          label={item.label}
          active={value === item.id}
          dotColor={item.dotColor}
          onPress={() => onChange(item.id)}
        />
      ))}
    </ScrollView>
  )
}
