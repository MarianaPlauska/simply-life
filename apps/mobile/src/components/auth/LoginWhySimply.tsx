import { View } from 'react-native'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

const POINTS = [
  'Humor, água e hábitos no mesmo lugar — sem abrir cinco apps.',
  'Finanças categorizadas com um olhar limpo, não uma planilha.',
  'O AXEL sugere o próximo passo; você decide o ritmo.',
]

/** Bullets de apoio no painel direito do login desktop */
export function LoginWhySimply()
{
  const { colors, space } = useTheme()

  return (
    <View style={{ gap: space.md, paddingTop: space.sm }}>
      <Text variant="section">Por que Simply Life?</Text>
      {POINTS.map((point) => (
        <View key={point} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              backgroundColor: colors.axel,
              marginTop: 8,
            }}
          />
          <Text variant="body" muted style={{ flex: 1, lineHeight: 22 }}>
            {point}
          </Text>
        </View>
      ))}
    </View>
  )
}
