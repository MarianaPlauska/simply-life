import { useMemo } from 'react'
import { View } from 'react-native'
import {
  brDateFromIso,
  formatBRL,
  isCreditExpense,
  isFaturaSettlement,
  seriesColor,
  type FinanceTx,
} from '@simply-life/shared'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useDataStore } from '../../../store/dataStore'
import { useCategoryMetaStore } from '../../../store/categoryMetaStore'
import { resolveCategoryMeta } from '../../../lib/categoryMeta'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'
import { cleanTxTitle } from './deskLayout'

type Props = {
  rows: FinanceTx[]
  onPress: (id: string) => void
  /** separa por dia, com o total de cada dia */
  groupByDay?: boolean
  /** colunas enxutas (bloco estreito): sem a coluna Conta */
  compact?: boolean
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function dayHeading(iso: string): string
{
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Ontem'
  const wd = d.toLocaleDateString('pt-BR', { weekday: 'long' })
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`
}

/**
 * Extrato em tabela de verdade para o computador: data, descrição, categoria,
 * conta e valor em colunas alinhadas. Linha inteira clicável (abre a edição).
 */
export function FinanceTxTable({ rows, onPress, groupByDay, compact }: Props)
{
  const { colors, chart } = useTheme()
  const cards = useDataStore((s) => s.financeCards)
  const catMap = useCategoryMetaStore((s) => s.map)
  const cols = compact
    ? '64px minmax(0, 1.5fr) minmax(0, 1fr) 120px'
    : '64px minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr) 120px'

  const sorted = useMemo(() => [...rows].sort((a, b) => (b.data || '').localeCompare(a.data || '')), [rows])
  const groups = useMemo(() =>
  {
    if (!groupByDay) return [{ day: '', items: sorted }]
    const out: { day: string; items: FinanceTx[] }[] = []
    for (const t of sorted)
    {
      const day = (t.data || '').slice(0, 10)
      const last = out[out.length - 1]
      if (last && last.day === day) last.items.push(t)
      else out.push({ day, items: [t] })
    }
    return out
  }, [sorted, groupByDay])

  const accountLabel = (t: FinanceTx): string =>
  {
    if (t.tipo === 'receita') return 'Conta corrente'
    if (isFaturaSettlement(t)) return 'Fatura paga'
    if (isCreditExpense(t)) return cards.find((c) => c.id === t.cardId)?.nome ?? 'Cartão'
    return t.pagoContaCasal ? 'Conta do casal' : 'Conta corrente'
  }

  const cell = { minWidth: 0 }
  const rowGrid = webStyle({
    display: 'grid',
    gridTemplateColumns: cols,
    columnGap: 16,
    alignItems: 'center',
    paddingHorizontal: 20,
  })

  return (
    // encosta nas bordas do painel: a faixa de hover vai de ponta a ponta
    <View style={{ marginHorizontal: -20 }}>
      <View style={[rowGrid, { paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.hairline }]}>
        <Text variant="label" muted style={cell}>Data</Text>
        <Text variant="label" muted style={cell}>Descrição</Text>
        <Text variant="label" muted style={cell}>Categoria</Text>
        {compact ? null : <Text variant="label" muted style={cell}>Conta</Text>}
        <Text variant="label" muted style={[cell, { textAlign: 'right' }]}>Valor</Text>
      </View>

      {groups.map((g) =>
      {
        const dayNet = g.items.reduce((s, t) => s + (t.tipo === 'receita' ? t.valor : -t.valor), 0)
        return (
          <View key={g.day || 'all'}>
            {groupByDay ? (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  paddingBottom: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.hairline,
                }}
              >
                <Text variant="caption">{dayHeading(g.day)}</Text>
                <Text variant="caption" muted style={{ fontVariant: ['tabular-nums'] }}>
                  {dayNet >= 0 ? '+' : '-'}{formatBRL(Math.abs(dayNet))}
                </Text>
              </View>
            ) : null}
            {g.items.map((t) => (
              <TxRow
                key={t.id}
                tx={t}
                rowGrid={rowGrid}
                compact={compact}
                account={accountLabel(t)}
                catLabel={t.tipo === 'receita' ? 'Entrada' : resolveCategoryMeta(String(t.categoria), catMap).label}
                catColor={t.tipo === 'receita' ? colors.health : seriesColor(resolveCategoryMeta(String(t.categoria), catMap).color, chart)}
                onPress={() => onPress(t.id)}
              />
            ))}
          </View>
        )
      })}
    </View>
  )
}

function TxRow({
  tx,
  rowGrid,
  compact,
  account,
  catLabel,
  catColor,
  onPress,
}: {
  tx: FinanceTx
  rowGrid: object
  compact?: boolean
  account: string
  catLabel: string
  catColor: string
  onPress: () => void
})
{
  const { colors } = useTheme()
  const income = tx.tipo === 'receita'
  const date = brDateFromIso((tx.data || '').slice(0, 10)).slice(0, 5) || tx.data
  const extra = tx.escopo === 'casal' ? 'Casal' : null

  return (
    <WebHoverable
      onPress={onPress}
      accessibilityLabel={`${tx.titulo}, ${income ? '+' : '-'}${formatBRL(tx.valor)}. Editar`}
      style={(hovered) => webStyle({
        ...(rowGrid as Record<string, unknown>),
        minHeight: 52,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.hairline,
        backgroundColor: hovered ? colors.surface : 'transparent',
        cursor: 'pointer',
      })}
    >
      <Text variant="caption" muted style={{ fontVariant: ['tabular-nums'] }}>{date}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <Text variant="body" numberOfLines={1} style={{ fontSize: 15, lineHeight: 22, flexShrink: 1 }}>
          {tx.cardId ? cleanTxTitle(tx.titulo) : tx.titulo}
        </Text>
        {extra ? <Text variant="label" muted>{extra}</Text> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: catColor }} />
        <Text variant="caption" muted numberOfLines={1} style={{ flexShrink: 1 }}>{catLabel}</Text>
      </View>
      {compact ? null : (
        <Text variant="caption" muted numberOfLines={1}>{account}</Text>
      )}
      <Text
        variant="body"
        style={{
          fontSize: 15,
          lineHeight: 22,
          textAlign: 'right',
          fontFamily: 'Lexend_500Medium',
          fontVariant: ['tabular-nums'],
          color: income ? colors.health : colors.ink,
        }}
      >
        {income ? '+' : '-'}{formatBRL(tx.valor)}
      </Text>
    </WebHoverable>
  )
}
