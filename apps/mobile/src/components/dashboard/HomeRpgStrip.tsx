import { View } from 'react-native'
import { AdventureHud } from '../play/AdventureHud'
import { AdventureStage } from '../play/AdventureStage'

/** Faixa da aventura: HUD e palco, sem cartão em volta. */
export function HomeRpgStrip()
{
  return (
    <View style={{ width: '100%', alignSelf: 'stretch', gap: 8 }}>
      <AdventureHud />
      <AdventureStage />
    </View>
  )
}
