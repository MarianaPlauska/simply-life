import { View } from 'react-native'
import {
  buildFinanceCoachTips,
  projectionMessage,
  computeSaldoDisponivel,
  formatBRL,
  monthExpenseTotal,
  monthIncomeTotal,
  rule503020,
} from '@simply-life/shared'
import { Card, Text, SectionHeader, StatusPill } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useMonthProjection } from './FinanceForecastCards'

export function FinanceCoachCards()
{
  const { space, colors, radius } = useTheme()
  const txs = useDataStore((s) => s.finance)
  const cash = useDataStore((s) => s.cashAccount)
  const fixas = useDataStore((s) => s.contasFixas)
  const bills = useDataStore((s) => s.contasAPagar)
  const pos = computeSaldoDisponivel(cash, txs, fixas)
  const income = monthIncomeTotal(txs)
  const spent = monthExpenseTotal(txs)
  const rule = rule503020(txs)
  // mesma conta da Carteira: fixas a vencer, faturas, salário previsto e gasto do dia a dia
  const projection = useMonthProjection()
  const tips = buildFinanceCoachTips({
    disponivel: pos.disponivel,
    spent,
    income,
    openBills: bills.filter((b) => b.status === 'aberta').length,
  })
  const toneColor =
    projection.tom === 'apertado'
      ? colors.attention
      : projection.tom === 'atencao'
        ? colors.finance
        : colors.health

  return (
    <View style={{ gap: space.md }}>
      <Card tone="elevated" style={{ gap: space.sm }}>
        <SectionHeader title="Coach" subtitle="Leitura do mês" />
        {tips.length === 0 ? (
          <Text variant="body" muted>
            Caixa estável. Mantenha o ritmo.
          </Text>
        ) : (
          tips.map((t) => (
            <View key={t.id} style={{ gap: 4 }}>
              <Text variant="bodyStrong">{t.title}</Text>
              <Text variant="caption" muted>
                {t.body}
              </Text>
            </View>
          ))
        )}
      </Card>

      <Card tone="elevated" style={{ gap: space.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="section">Fim do mês</Text>
          <StatusPill
            label={projection.tom === 'tranquilo' ? 'Tranquilo' : projection.tom === 'atencao' ? 'Pede atenção' : 'Apertado'}
            color={toneColor}
          />
        </View>
        <Text variant="hero">
          {projection.sobra >= 0 ? formatBRL(projection.sobra) : `−${formatBRL(Math.abs(projection.sobra))}`}
        </Text>
        <Text variant="caption" muted>{projectionMessage(projection, formatBRL)}</Text>
        <Text variant="caption" muted>
          Gasto médio do dia a dia {formatBRL(projection.mediaDiaria)} · faltam {projection.diasRestantes} dias
        </Text>
      </Card>

      <Card tone="elevated" style={{ gap: space.sm }}>
        <Text variant="section">50 / 30 / 20</Text>
        <Text variant="caption" muted>
          Necessidades {formatBRL(rule.needsBudget)} · desejos {formatBRL(rule.wantsBudget)} ·
          reserva {formatBRL(rule.savingsBudget)}
        </Text>
        {[
          { label: 'Necessidades 50%', used: rule.needs, cap: rule.needsBudget },
          { label: 'Desejos 30%', used: rule.wants, cap: rule.wantsBudget },
          { label: 'Reserva 20%', used: rule.savings, cap: rule.savingsBudget },
        ].map((row) =>
        {
          const pct = row.cap > 0 ? Math.min(100, Math.round((row.used / row.cap) * 100)) : 0
          return (
            <View key={row.label} style={{ gap: 4 }}>
              <Text variant="caption">{row.label}</Text>
              <View
                style={{
                  height: 8,
                  borderRadius: radius.pill,
                  backgroundColor: colors.hairline,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    backgroundColor: colors.finance,
                  }}
                />
              </View>
            </View>
          )
        })}
      </Card>
    </View>
  )
}
