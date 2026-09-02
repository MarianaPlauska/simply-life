import { View } from 'react-native'
import type { DashboardGlance } from '@simply-life/shared'
import { PressableScale } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useWorkspace } from '../../layout/useWorkspace'
import { GlanceCard } from './GlanceCard'

type Props = {
  glances: DashboardGlance[]
  toneColor: (tone: string) => string
  onPressGlance?: (id: string) => void
}

/** Grade de glances — 2 colunas no mobile; 3–4 no desktop (SoftTech) */
export function GlanceGrid({ glances, toneColor, onPressGlance }: Props)
{
  const { space } = useTheme()
  const { showRail, width } = useWorkspace()
  const gap = showRail ? space.md : space.sm
  const cols = showRail ? (width >= 1280 ? 4 : 3) : 2
  const itemBasis = `${(100 / cols) - 1}%`

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap,
        justifyContent: showRail ? 'flex-start' : 'space-between',
      }}
    >
      {glances.map((g) =>
      {
        const tint = toneColor(g.tone)
        const card = <GlanceCard glance={g} tint={tint} />
        const wrapStyle = {
          flexGrow: 1,
          flexShrink: 0,
          flexBasis: itemBasis,
          width: itemBasis,
          minWidth: showRail ? 180 : undefined,
          maxWidth: showRail ? `${100 / cols}%` : itemBasis,
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
