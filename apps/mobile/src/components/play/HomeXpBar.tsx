import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useGamificationStore, gamificationLevel } from '../../store/gamificationStore'

/** Nível e barra ao lado do avatar. O +N só sobe quando o XP de fato entra. */
export function HomeXpBar()
{
  const { colors } = useTheme()
  const totalXp = useGamificationStore((s) => s.totalXp)
  const lastGrant = useGamificationStore((s) => s.lastGrant)
  const { level, xpInLevel, pct } = gamificationLevel(totalXp)
  const [float, setFloat] = useState<number | null>(null)

  useEffect(() =>
  {
    if (!lastGrant || lastGrant.xp <= 0) return
    setFloat(lastGrant.xp)
    const timer = setTimeout(() => setFloat(null), 1600)
    return () => clearTimeout(timer)
  }, [lastGrant])

  return (
    <View style={{ gap: 4, minWidth: 92 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text variant="caption" muted>
          Nível {level}
        </Text>
        {float ? (
          <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
            +{float}
          </Text>
        ) : null}
      </View>
      <View style={{ height: 6, borderRadius: 99, backgroundColor: colors.fill, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: colors.axelFill }} />
      </View>
      <Text variant="caption" muted>
        {xpInLevel}/500
      </Text>
    </View>
  )
}
