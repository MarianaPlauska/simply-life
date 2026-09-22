import { type ReactNode } from 'react'
import { View } from 'react-native'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  dashboard: ReactNode
  side: ReactNode
  dayLabel?: string
  dayBody: ReactNode
}

/** Início no desktop: colunas da mesma altura, KPIs em faixa cheia. */
export function HomeDesktopStage({
  dashboard,
  side,
  dayLabel = 'Seu dia',
  dayBody,
}: Props)
{
  const { space } = useTheme()

  return (
    <View style={{ gap: space.lg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'stretch',
          gap: 20,
        }}
      >
        <View style={{ flex: 7, minWidth: 0, gap: 16, alignSelf: 'stretch' }}>
          {dashboard}
        </View>
        <View style={{ flex: 5, minWidth: 0, alignSelf: 'stretch', minHeight: 0 }}>
          <View style={{ flex: 1, gap: 16, minHeight: 0 }}>
            {side}
          </View>
        </View>
      </View>
      <View style={{ gap: 12 }}>
        <Text variant="section" style={{ fontSize: 18, letterSpacing: -0.3 }}>
          {dayLabel}
        </Text>
        {dayBody}
      </View>
    </View>
  )
}
