import { View } from 'react-native'
import { formatBRL } from '@simply-life/shared'
import { Card, Text, SectionHeader } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  receitas: number
  despesas: number
  saldo: number
  disponivel: number
  fixasMes: number
  cardUsagePct: number
}

/**
 * Nível 2 — métricas de saúde financeira.
 * Barras em tom do módulo Finanças (ouro), não no acento cobre.
 */
export function FinanceHealthMetrics({
  receitas,
  despesas,
  saldo,
  disponivel,
  fixasMes,
  cardUsagePct,
}: Props)
{
  const { colors, space, radius } = useTheme()
  const burnPct = receitas > 0 ? Math.min(100, Math.round((despesas / receitas) * 100)) : 0
  const healthy = burnPct <= 70 && saldo >= 0
  const scoreLabel = healthy ? 'Saudável' : burnPct > 90 ? 'Atenção' : 'Moderado'
  const scoreColor = healthy ? colors.health : burnPct > 90 ? colors.danger : colors.attention

  const rows: { label: string; value: string; pct: number; color: string }[] = [
    {
      label: 'Gastos / receita',
      value: `${burnPct}%`,
      pct: burnPct,
      color: colors.finance,
    },
    {
      label: 'Uso do cartão',
      value: `${Math.round(cardUsagePct)}%`,
      pct: Math.min(100, cardUsagePct),
      color: colors.finance,
    },
    {
      label: 'Fixas do mês',
      value: formatBRL(fixasMes),
      pct: receitas > 0 ? Math.min(100, Math.round((fixasMes / receitas) * 100)) : 0,
      color: colors.inkMuted,
    },
  ]

  const kpiStyle = {
    flexGrow: 1,
    flexBasis: '30%' as const,
    minWidth: 140,
    minHeight: 108,
    gap: 4,
    justifyContent: 'center' as const,
  }

  return (
    <View style={{ gap: space.md }}>
      <SectionHeader title="Saúde financeira" subtitle="Desempenho do mês" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        <Card tone="elevated" style={kpiStyle}>
          <Text variant="caption" muted>
            Score
          </Text>
          <Text variant="title" color={scoreColor} style={{ fontSize: 22 }}>
            {scoreLabel}
          </Text>
          <Text variant="caption" muted>
            Saldo {formatBRL(saldo)}
          </Text>
        </Card>
        <Card tone="elevated" style={kpiStyle}>
          <Text variant="caption" muted>
            Disponível
          </Text>
          <Text variant="title" color={colors.ink} style={{ fontSize: 22 }}>
            {formatBRL(disponivel)}
          </Text>
          <Text variant="caption" muted>
            Após receitas − despesas
          </Text>
        </Card>
        <Card tone="elevated" style={kpiStyle}>
          <Text variant="caption" muted>
            Receitas
          </Text>
          <Text variant="title" color={colors.health} style={{ fontSize: 22 }}>
            {formatBRL(receitas)}
          </Text>
          <Text variant="caption" muted>
            Gastos {formatBRL(despesas)}
          </Text>
        </Card>
      </View>

      <Card tone="elevated" style={{ gap: space.md }}>
        {rows.map((row) => (
          <View key={row.label} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text variant="bodyStrong">{row.label}</Text>
              <Text variant="caption" color={row.color}>
                {row.value}
              </Text>
            </View>
            <View
              style={{
                height: 6,
                borderRadius: radius.pill,
                backgroundColor: colors.hairline,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${row.pct}%`,
                  height: '100%',
                  backgroundColor: row.color,
                  borderRadius: radius.pill,
                }}
              />
            </View>
          </View>
        ))}
      </Card>
    </View>
  )
}
