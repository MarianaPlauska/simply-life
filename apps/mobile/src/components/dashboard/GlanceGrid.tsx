import { View } from 'react-native'
import type { DashboardGlance } from '@simply-life/shared'
import { PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { GlanceCard } from './GlanceCard'

type Props = {
  glances: DashboardGlance[]
  toneColor: (tone: string) => string
  onPressGlance?: (id: string) => void
}

/** Grade de glances — 2 colunas (app mobile-only; desktop web usa o Vite) */
export function GlanceGrid({ glances, toneColor, onPressGlance }: Props)
{
  const { space } = useTheme()
  const gap = space.sm
  const itemBasis = '47%'

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap,
        justifyContent: 'space-between',
      }}
    >
      {glances.map((g) =>
      {
        const tint = toneColor(g.tone)
        const card = <GlanceCard glance={g} tint={tint} />
        const wrapStyle = {
          flexGrow: 0,
          flexShrink: 0,
          flexBasis: itemBasis,
          width: itemBasis,
          maxWidth: itemBasis,
        } as const

        if (!onPressGlance)
        {
          return (
            <View key={g.id} style={wrapStyle}>
              {card}
            </View>
          )
        }

        return (
          <PressableScale
            key={g.id}
            onPress={() => onPressGlance(g.id)}
            style={wrapStyle}
          >
            {card}
          </PressableScale>
        )
      })}
    </View>
  )
}
