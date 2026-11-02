import { useEffect } from 'react'
import { View } from 'react-native'
import { localTodayIso } from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { usePlayStore } from '../../store/playStore'
import { useGamificationStore, gamificationLevel } from '../../store/gamificationStore'
import { useActivityStore } from '../../store/activityStore'
import { AxelFaceSun } from './AxelFaceSun'

function Bar({ pct, color, track }: { pct: number; color: string; track: string })
{
  return (
    <View style={{ height: 6, borderRadius: 99, backgroundColor: track, overflow: 'hidden', width: '100%' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', backgroundColor: color }} />
    </View>
  )
}

/** Faixa do topo: personagem e barras, sem cartão em volta. */
export function AdventureHud()
{
  const { colors } = useTheme()
  const energy = usePlayStore((s) => s.energy)
  const settle = usePlayStore((s) => s.settleEnergy)
  const days = useActivityStore((s) => s.days)
  const gold = useGamificationStore((s) => s.gold)
  const totalXp = useGamificationStore((s) => s.totalXp)
  const { level, pct } = gamificationLevel(totalXp)
  const today = localTodayIso()
  const acted = (days[today]?.actions?.length ?? 0) > 0

  useEffect(() =>
  {
    settle(today, new Date().getHours(), acted)
  }, [today, acted, settle])

  return (
    <View
      style={{
        width: '100%',
        alignSelf: 'stretch',
        minHeight: 72,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.hairline,
      }}
    >
      <AxelFaceSun size={48} />
      <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
        <Bar pct={energy} color={colors.health} track={colors.fill} />
        <Bar pct={pct} color={colors.axelFill} track={colors.fill} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <Text variant="caption" muted>Nível {level}</Text>
          <Text variant="caption" muted>{gold} moedas</Text>
        </View>
      </View>
    </View>
  )
}
