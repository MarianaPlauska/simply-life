import { useMemo, useState } from 'react'
import { View, ScrollView, Pressable, useWindowDimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  rankCategoriesBySpend,
  formatBRL,
  monthExpenseTotal,
  monthIncomeTotal,
  currentMonthLabel,
  computeSaldoDisponivel,
} from '@simply-life/shared'
import {
  Card,
  Text,
  SectionHeader,
  PrimaryButton,
  EmptyState,
  FinanceDonut,
  ListRow,
} from '../../ui'
import { ChipGrid } from '../dashboard/ChipGrid'
import { useTheme } from '../../theme/ThemeProvider'
import { useWorkspace } from '../../layout/useWorkspace'
import { useCaptureStore } from '../../store/captureStore'
import { useDataStore } from '../../store/dataStore'
import { tabBarScreenPadding } from '../../ui/chrome'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CreditCardVisual } from './CreditCardVisual'
import { FinanceHealthMetrics } from './FinanceHealthMetrics'

type Props = {
  onGoMovimentos: () => void
  onGoCartoes?: () => void
}

const QUICK = [
  { id: 'expense', label: 'Gasto', icon: 'arrow-up-outline' as const },
  { id: 'mov', label: 'Extrato', icon: 'list-outline' as const },
  { id: 'cards', label: 'Cartões', icon: 'card-outline' as const },
  { id: 'more', label: 'Mais', icon: 'grid-outline' as const },
]

/** Início Finanças — cartão + métricas (refs fintech mobile) */
export function FinanceHomeTab({ onGoMovimentos, onGoCartoes }: Props)
{
  const { colors, space, radius } = useTheme()
  const { isDesktop, showRail } = useWorkspace()
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const [catFilter, setCatFilter] = useState<string | null>(null)
  const openCapture = useCaptureStore((s) => s.openCapture)
  const txs = useDataStore((s) => s.finance)
  const cash = useDataStore((s) => s.cashAccount)
  const cards = useDataStore((s) => s.financeCards)
  const fixas = useDataStore((s) => s.contasFixas)
  const ranking = useMemo(() => rankCategoriesBySpend(txs), [txs])
  const despesas = monthExpenseTotal(txs)
  const receitas = monthIncomeTotal(txs)
  const saldo = receitas - despesas
  const pos = computeSaldoDisponivel(cash, txs, fixas)
  const max = ranking[0]?.total ?? 1
  const pctReceita = receitas > 0 ? Math.round((despesas / receitas) * 100) : 0
  const pillBtn = { borderRadius: 999 as const }
  const fabClearance = showRail ? space.md : tabBarScreenPadding(insets.bottom) + space.md
  const cardW = Math.min(isDesktop ? 320 : width - 56, 340)
  const primaryCard = cards[0]
  const cardUsage =
    primaryCard && primaryCard.limite > 0
      ? ((primaryCard.faturaAberta ?? 0) / primaryCard.limite) * 100
      : 0

  const recent = useMemo(
    () =>
      [...txs]
        .sort((a, b) => b.data.localeCompare(a.data))
        .slice(0, 5),
    [txs],
  )

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

  const onQuick = (id: string) =>
  {
    if (id === 'expense') openCapture('expense')
    else if (id === 'mov') onGoMovimentos()
    else if (id === 'cards') onGoCartoes?.()
    else openCapture('dump')
  }

  const balanceHero = (
    <Card
      tone="elevated"
      style={{
        gap: space.md,
        backgroundColor: colors.axel,
        borderWidth: 0,
        paddingVertical: space.lg,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ gap: 4 }}>
          <Text variant="caption" style={{ color: 'rgba(255,248,240,0.78)' }}>
            Saldo disponível · {currentMonthLabel()}
          </Text>
          <Text variant="hero" style={{ color: '#FFF8F0', fontSize: 34, letterSpacing: -0.6 }}>
            {formatBRL(pos.disponivel)}
          </Text>
          <Text variant="caption" style={{ color: 'rgba(255,248,240,0.72)' }}>
            {saldo >= 0 ? '+' : ''}
            {formatBRL(saldo)} no mês
          </Text>
        </View>
        <Pressable
          onPress={() => openCapture('expense')}
          style={{
            backgroundColor: '#1A1214',
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 999,
            minHeight: 44,
            justifyContent: 'center',
          }}
        >
          <Text variant="label" style={{ color: '#FFF8F0' }}>
            + Gasto
          </Text>
        </Pressable>
      </View>
    </Card>
  )

  const quickRow = (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.sm }}>
      {QUICK.map((q) => (
        <Pressable
          key={q.id}
          onPress={() => onQuick(q.id)}
          accessibilityRole="button"
          style={{
            flex: 1,
            alignItems: 'center',
            gap: 8,
            minHeight: 72,
            paddingVertical: 10,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: colors.elevated,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.hairline,
            }}
          >
            <Ionicons name={q.icon} size={20} color={colors.axel} />
          </View>
          <Text variant="caption" muted>
            {q.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )

  const cardsBlock = (
    <View style={{ gap: space.sm }}>
      <SectionHeader
        title="Seus cartões"
        action={
          onGoCartoes ? (
            <PrimaryButton label="Ver tudo" variant="link" size="sm" onPress={onGoCartoes} />
          ) : undefined
        }
      />
      {cards.length === 0 ? (
        <Card tone="elevated">
          <EmptyState title="Nenhum cartão" body="Cadastre cartões para acompanhar faturas." />
        </Card>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: space.md, paddingVertical: 4 }}
        >
          {cards.map((card, i) => (
            <CreditCardVisual
              key={card.id}
              card={card}
              width={cardW}
              selected={i === 0}
            />
          ))}
        </ScrollView>
      )}
    </View>
  )

  const recentBlock = (
    <View style={{ gap: space.sm }}>
      <SectionHeader
        title="Movimentos recentes"
        action={
          <PrimaryButton label="Ver tudo" variant="link" size="sm" onPress={onGoMovimentos} />
        }
      />
      <Card tone="elevated" style={{ paddingVertical: space.sm }}>
        {recent.length === 0 ? (
          <EmptyState title="Sem movimentos" body="Capture um gasto para começar." />
        ) : (
          recent.map((t, i) => (
            <ListRow
              key={t.id}
              title={t.titulo}
              subtitle={t.data}
              right={`${t.tipo === 'despesa' ? '−' : '+'}${formatBRL(t.valor)}`}
              showSeparator={i < recent.length - 1}
            />
          ))
        )}
      </Card>
    </View>
  )

  const donutCard = (
    <Card tone="hero" style={{ alignItems: 'center', gap: space.md }}>
      <Text variant="caption" muted style={{ textTransform: 'capitalize' }}>
        Gastos por categoria
      </Text>
      {ranking.length === 0 ? (
        <EmptyState title="Sem gastos no mês" body="Capture um gasto para ver o donut." />
      ) : (
        <>
          <FinanceDonut
            segments={donutSegments}
            centerLabel="Gasto total"
            centerValue={formatBRL(despesas)}
            size={isDesktop ? 200 : 180}
            strokeWidth={20}
          />
          <Text variant="body" muted style={{ textAlign: 'center' }}>
            {receitas > 0
              ? `${pctReceita}% da receita do mês em gastos`
              : 'Sem receitas registradas neste mês'}
          </Text>
        </>
      )}
    </Card>
  )

  const categoryPanel = ranking.length > 0 ? (
    <View style={{ gap: space.md, flex: isDesktop ? 1 : undefined }}>
      <ChipGrid
        items={catChips}
        value={catFilter ?? '__all'}
        onChange={(id) => setCatFilter(id === '__all' ? null : id)}
      />
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
  ) : null

  return (
    <View style={{ gap: space.lg }}>
      {balanceHero}
      {quickRow}
      {cardsBlock}

      <FinanceHealthMetrics
        receitas={receitas}
        despesas={despesas}
        saldo={saldo}
        disponivel={pos.disponivel}
        fixasMes={pos.fixasMes}
        cardUsagePct={cardUsage}
      />

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

      {recentBlock}

      <PrimaryButton
        label="Registrar gasto"
        onPress={() => openCapture('expense')}
        style={[pillBtn, { marginBottom: fabClearance }]}
      />
    </View>
  )
}
