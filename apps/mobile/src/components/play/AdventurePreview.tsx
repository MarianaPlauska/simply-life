import { View } from 'react-native'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { AxelSun } from '../AxelSun'

/** Prévia do HUD, só para quem está escolhendo a aventura. */
export function AdventurePreview()
{
  const { colors } = useTheme()

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 72, width: '100%' }}>
      <AxelSun size={48} mood="happy" />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ height: 6, borderRadius: 99, backgroundColor: colors.fill, overflow: 'hidden' }}>
          <View style={{ width: '72%', height: '100%', backgroundColor: colors.health }} />
        </View>
        <View style={{ height: 6, borderRadius: 99, backgroundColor: colors.fill, overflow: 'hidden' }}>
          <View style={{ width: '40%', height: '100%', backgroundColor: colors.axelFill }} />
        </View>
        <Text variant="caption" muted>Energia e nível. As moedas ficam ao lado.</Text>
      </View>
    </View>
  )
}
