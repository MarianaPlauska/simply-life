import { View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

type Props = {
  ratio: number
  colors: [string, string]
}

/** Barra vertical com marcador — métricas da referência de clima. */
export function RangeTick({ ratio, colors }: Props)
{
  const pct = Math.max(0.06, Math.min(0.94, ratio))
  return (
    <View style={{ width: 10, height: 28, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 5, height: 28, borderRadius: 999, overflow: 'hidden' }}>
        <LinearGradient colors={colors} start={{ x: 0.5, y: 1 }} end={{ x: 0.5, y: 0 }} style={{ flex: 1 }} />
      </View>
      <View
        style={{
          position: 'absolute',
          top: (1 - pct) * 24,
          width: 10,
          height: 3,
          borderRadius: 999,
          backgroundColor: '#2A2622',
        }}
      />
    </View>
  )
}
