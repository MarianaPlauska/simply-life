import { useMemo, useState } from 'react'
import { View } from 'react-native'
import {
  rankCategoriesBySpend,
  formatBRL,
  monthExpenseTotal,
  monthIncomeTotal,
  currentMonthLabel,
} from '@simply-life/shared'
import {
  Card,
  Text,
  SectionHeader,
  PrimaryButton,
  EmptyState,
  FinanceDonut,
} from '../../ui'
import { ChipGrid } from '../dashboard/ChipGrid'
import { useTheme } from '../../theme/ThemeProvider'
import { useWorkspace } from '../../layout/useWorkspace'
import { useCaptureStore } from '../../store/captureStore'
import { useDataStore } from '../../store/dataStore'
import { tabBarScreenPadding } from '../../ui/chrome'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Props = {
  onGoMovimentos: () => void
}

export function FinanceHomeTab({ onGoMovimentos }: Props)
{
  const { colors, space, radius } = useTheme()
  const { isDesktop } = useWorkspace()
  const insets = useSafeAreaInsets()
  const [catFilter, setCatFilter] = useState<string | null>(null)
  const openCapture = useCaptureStore((s) => s.openCapture)
  const txs = useDataStore((s) => s.finance)
  const ranking = useMemo(() => rankCategoriesBySpend(txs), [txs])
  const despesas = monthExpenseTotal(txs)
  const receitas = monthIncomeTotal(txs)
  const saldo = receitas - despesas
  const max = ranking[0]?.total ?? 1
  const pctReceita = receitas > 0 ? Math.round((despesas / receitas) * 100) : 0
  const pillBtn = { borderRadius: 999 as const }
  const fabClearance = tabBarScreenPadding(insets.bottom) + space.md
  const catChips = [
    { id: '__all', label: 'Todas' },
    ...ranking.map((r) => ({
      id: r.categoria,
      label: r.label,
      dotColor: r.color,
    })),
  ]
  const donutSegments = ranking.map((r) => ({
    color: r.color,
    value: r.total,
    label: r.label,
  }))

  const donutCard = (
    <Card tone="hero" style={{ alignItems: 'center', gap: space.md }}>
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 6,
          borderRadius: radius.pill,
          backgroundColor: colors.surface,
        }}
      >
        <Text variant="caption" muted style={{ textTransform: 'capitalize' }}>
          {currentMonthLabel()}
        </Text>
      </View>
      {ranking.length === 0 ? (
        <EmptyState
          title="Sem gastos no mês"
          body="Capture um gasto (ex.: café 12,50) para ver o donut."
        />
      ) : (
        <>
          <FinanceDonut
            segments={donutSegments}
            centerLabel="Gasto total"
            centerValue={formatBRL(despesas)}
            size={isDesktop ? 220 : 200}
            strokeWidth={22}
          />
          <Text variant="body" muted style={{ textAlign: 'center' }}>
            {receitas > 0
              ? `${pctReceita}% da receita do mês em gastos`
              : 'Sem receitas registradas neste mês'}
          </Text>
          <PrimaryButton
            label="Ver movimentos"
            variant="secondary"
            size="sm"
            onPress={onGoMovimentos}
            style={pillBtn}
          />
        </>
      )}
      <View style={{ flexDirection: 'row', gap: space.sm, width: '100%' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="caption" muted>
            Receitas
          </Text>
          <Text variant="bodyStrong" color={colors.health}>
            {formatBRL(receitas)}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2, alignItems: 'flex-end' }}>
          <Text variant="caption" muted>
            Saldo
          </Text>
          <Text variant="bodyStrong" color={saldo >= 0 ? colors.health : colors.finance}>
            {formatBRL(saldo)}
          </Text>
        </View>
      </View>
    </Card>
  )

  const categoryPanel = ranking.length > 0 ? (
    <View style={{ gap: space.md, flex: isDesktop ? 1 : undefined }}>
      <ChipGrid
        items={catChips}
        value={catFilter ?? '__all'}
        onChange={(id) => setCatFilter(id === '__all' ? null : id)}
      />
      <View>
        <SectionHeader title="Por categoria" />
        <Card tone="elevated" style={{ gap: space.md }}>
          {ranking
            .filter((row) => !catFilter || row.categoria === catFilter)
            .map((row) => (
              <View key={row.categoria} style={{ gap: 6 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        backgroundColor: row.color,
                      }}
                    />
                    <Text variant="bodyStrong">{row.label}</Text>
                  </View>
                  <Text variant="caption" muted>
                    {formatBRL(row.total)} · {row.pct}%
                  </Text>
                </View>
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
                      width: `${Math.round((row.total / max) * 100)}%`,
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
    </View>
  ) : null

  return (
    <View style={{ gap: space.lg }}>
      {isDesktop && ranking.length > 0 ? (
        <View style={{ flexDirection: 'row', gap: space.lg, alignItems: 'flex-start' }}>
          <View style={{ flex: 1, minWidth: 0 }}>{donutCard}</View>
          <View style={{ flex: 1, minWidth: 0 }}>{categoryPanel}</View>
        </View>
      ) : (
        <>
          {donutCard}
          {categoryPanel}
        </>
      )}

      <PrimaryButton
        label="Registrar gasto"
        onPress={() => openCapture('expense')}
        style={[pillBtn, { marginBottom: fabClearance }]}
      />
    </View>
  )
}
