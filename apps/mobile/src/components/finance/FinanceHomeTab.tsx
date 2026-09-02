import { useMemo, useState } from 'react'
import { View, Pressable } from 'react-native'
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
import { CardCarousel } from './CardCarousel'
import { FinanceCardDetailSheet } from './FinanceCardDetailSheet'
import { FinanceHealthMetrics } from './FinanceHealthMetrics'

type Props = {
  onGoMovimentos: () => void
  onGoCartoes?: () => void
  cardsFocus: boolean
  onCardsFocusChange: (focus: boolean) => void
}

const QUICK = [
  { id: 'expense', label: 'Gasto', icon: 'arrow-up-outline' as const },
  { id: 'mov', label: 'Extrato', icon: 'list-outline' as const },
  { id: 'cards', label: 'Cartões', icon: 'card-outline' as const },
  { id: 'more', label: 'Mais', icon: 'grid-outline' as const },
]

/**
 * Finanças Início — hierarquia:
 * N1: Saldo disponível (1 hero, número 32px cobre)
 * N2: atalhos / cartões / saúde financeira / donut
 * N3: movimentos recentes (lista)
 * Acento cobre: número do saldo + botão + Gasto (máx. 2).
 */
export function FinanceHomeTab({
  onGoMovimentos,
  onGoCartoes,
  cardsFocus,
  onCardsFocusChange,
}: Props)
{
  const { colors, space, radius } = useTheme()
  const { isDesktop, showRail } = useWorkspace()
  const insets = useSafeAreaInsets()
  const [catFilter, setCatFilter] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [visibleCardId, setVisibleCardId] = useState<string | null>(null)
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
  const fabClearance = showRail ? space.md : tabBarScreenPadding(insets.bottom) + space.md
  const primaryCard = cards.find((c) => c.id === visibleCardId) ?? cards[0]
  const detailCard = cards.find((c) => c.id === detailId) ?? null
  const cardUsage =
    primaryCard && primaryCard.limite > 0
      ? ((primaryCard.faturaAberta ?? 0) / primaryCard.limite) * 100
      : 0

  const recent = useMemo(
    () => [...txs].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5),
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
    else if (id === 'cards') onCardsFocusChange(true)
    else openCapture('dump')
  }

  // ── Nível 1 (único hero) ─────────────────────────────────
  const balanceHero = (
    <Card
      tone="elevated"
      style={{
        gap: space.md,
        paddingVertical: space.lg,
        minHeight: 128,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ gap: 4, flex: 1 }}>
          <Text variant="caption" muted>
            Saldo disponível · {currentMonthLabel()}
          </Text>
          <Text
            variant="hero"
            color={colors.axel}
            style={{ fontSize: 32, letterSpacing: -0.6 }}
          >
            {formatBRL(pos.disponivel)}
          </Text>
          <Text variant="caption" muted>
            {saldo >= 0 ? '+' : ''}
            {formatBRL(saldo)} no mês
          </Text>
        </View>
        <PrimaryButton
          label="+ Gasto"
          size="sm"
          onPress={() => openCapture('expense')}
          style={{ borderRadius: 999, paddingHorizontal: 16 }}
        />
      </View>
    </Card>
  )

  // ── Nível 2 ──────────────────────────────────────────────
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
            <Ionicons name={q.icon} size={20} color={colors.inkMuted} />
          </View>
          <Text variant="caption" muted>
            {q.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )

  const cardsFocusView = (
    <View style={{ gap: space.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm }}>
        <PrimaryButton
          label="Voltar"
          variant="ghost"
          size="sm"
          onPress={() => onCardsFocusChange(false)}
        />
        {onGoCartoes ? (
          <PrimaryButton
            label="Gerenciar"
            variant="link"
            size="sm"
            onPress={() =>
            {
              onCardsFocusChange(false)
              onGoCartoes()
            }}
          />
        ) : null}
      </View>
      <SectionHeader
        title="Seus cartões"
        subtitle={cards.length > 1 ? 'Deslize para ver o próximo' : undefined}
      />
      {cards.length === 0 ? (
        <Card tone="elevated">
          <EmptyState title="Nenhum cartão" body="Cadastre cartões para acompanhar faturas." />
        </Card>
      ) : (
        <CardCarousel
          cards={cards}
          selectedId={detailId ?? visibleCardId}
          onSelect={(id) => setDetailId(id)}
          onVisibleChange={setVisibleCardId}
        />
      )}
    </View>
  )

  // ── Nível 3 ──────────────────────────────────────────────
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
    <Card tone="elevated" style={{ alignItems: 'center', gap: space.md, minHeight: 280 }}>
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
                  height: 6,
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

  // Nível 2 — KPIs de suporte (abaixo do hero, números 22px)
  const kpiRow = (
    <View style={{ flexDirection: 'row', gap: space.md }}>
      <Card tone="elevated" style={{ flex: 1, gap: 4, minHeight: 88, justifyContent: 'center' }}>
        <Text variant="caption" muted>
          Gastos do mês
        </Text>
        <Text
          variant="title"
          color={colors.finance}
          style={{ fontSize: 22, letterSpacing: -0.3 }}
        >
          {formatBRL(despesas)}
        </Text>
      </Card>
      <Card tone="elevated" style={{ flex: 1, gap: 4, minHeight: 88, justifyContent: 'center' }}>
        <Text variant="caption" muted>
          Saldo do mês
        </Text>
        <Text
          variant="title"
          color={saldo >= 0 ? colors.health : colors.finance}
          style={{ fontSize: 22, letterSpacing: -0.3 }}
        >
          {formatBRL(saldo)}
        </Text>
      </Card>
    </View>
  )

  if (cardsFocus)
  {
    return (
      <View style={{ gap: space.lg }}>
        {cardsFocusView}
        <FinanceCardDetailSheet
          card={detailCard}
          visible={detailId != null}
          onClose={() => setDetailId(null)}
        />
        <View style={{ marginBottom: fabClearance }} />
      </View>
    )
  }

  return (
    <View style={{ gap: space.lg }}>
      {balanceHero}
      {kpiRow}
      {quickRow}

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

      <FinanceCardDetailSheet
        card={detailCard}
        visible={detailId != null}
        onClose={() => setDetailId(null)}
      />

      <View style={{ marginBottom: fabClearance }} />
    </View>
  )
}
