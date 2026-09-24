import { useState } from 'react'
import { View, Pressable } from 'react-native'
import { moodGoalPeriodStats, type HumorRegistro, type LifeGoal } from '@simply-life/shared'
import { Card, Text, PressableScale } from '../../ui'
import { MiniBarChart } from '../../ui/MiniBarChart'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  humor: HumorRegistro[]
  goal: LifeGoal | null | undefined
  /** Sem cartão — faixa na tela (ex.: Diário integrado). */
  inline?: boolean
}

/** Alerta de humor no período da meta (só em Saúde, expandido ao toque). */
export function MoodGoalAlertCard({ humor, goal, inline = false }: Props)
{
  const { colors, space } = useTheme()
  const stats = moodGoalPeriodStats(humor, goal)
  const [expanded, setExpanded] = useState(false)

  if (!stats || stats.alertLevel === 'none') return null

  const tone = stats.alertLevel === 'concern' ? colors.danger : colors.axel
  const line = `${stats.terribleCount} de ${stats.total} como Péssimo (${stats.terriblePct}%)`

  const body = (
    <>
      <Text variant="caption" style={{ color: tone, fontWeight: '700' }}>
        Humor no período da meta
      </Text>
      <Text variant="bodyStrong">{line}</Text>
      {!expanded ? (
        <PressableScale
          onPress={() => setExpanded(true)}
          accessibilityRole="button"
          style={{ minHeight: 40, justifyContent: 'center' }}
        >
          <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
            Ver detalhes
          </Text>
        </PressableScale>
      ) : (
        <>
          <Text variant="caption" muted>
            No período da sua meta. Isso não é diagnóstico. Serve para perceber padrões e buscar
            apoio se precisar.
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <MiniBarChart
              values={stats.byDay.length ? stats.byDay : [0]}
              color={tone}
              width={88}
              height={44}
            />
            <Text variant="micro" muted style={{ flex: 1 }}>
              Barras = dias com humor péssimo no período
            </Text>
          </View>
          <Pressable
            onPress={() => setExpanded(false)}
            accessibilityRole="button"
            style={{ minHeight: 40, justifyContent: 'center' }}
          >
            <Text variant="caption" muted>Recolher</Text>
          </Pressable>
        </>
      )}
    </>
  )

  if (inline)
  {
    return (
      <View
        style={{
          gap: space.sm,
          paddingVertical: space.sm,
          paddingLeft: 12,
          borderLeftWidth: 3,
          borderLeftColor: tone,
        }}
      >
        {body}
      </View>
    )
  }

  return (
    <Card
      tone="elevated"
      style={{
        gap: space.sm,
        borderTopWidth: 1,
        borderTopColor: tone,
      }}
    >
      {body}
    </Card>
  )
}
