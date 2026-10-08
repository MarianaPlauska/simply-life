import { View } from 'react-native'
import { formatBRL, type CategorySpend } from '@simply-life/shared'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useCategoryMetaStore } from '../../../store/categoryMetaStore'
import { resolveCategoryMeta } from '../../../lib/categoryMeta'
import { FinanceIcon } from '../../../lib/financeIcons'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'

/** Gastos por categoria no computador: ícone, nome, valor e barra da fatia do mês. */
export function FinanceCategoryList({ rows, onPress }: { rows: CategorySpend[]; onPress?: () => void })
{
  const { colors } = useTheme()
  const catMap = useCategoryMetaStore((s) => s.map)

  if (rows.length === 0)
  {
    return (
      <Text variant="caption" muted>
        Quando houver gastos no mês, as categorias aparecem aqui.
      </Text>
    )
  }

  return (
    <View style={{ marginHorizontal: -8 }}>
      {rows.map((row) => (
        <WebHoverable
          key={row.categoria}
          onPress={onPress}
          accessibilityLabel={`${row.label}, ${formatBRL(row.total)}`}
          style={(hovered) => webStyle({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 10,
            paddingHorizontal: 8,
            borderRadius: 8,
            backgroundColor: hovered ? colors.surface : 'transparent',
            cursor: onPress ? 'pointer' : 'default',
          })}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              backgroundColor: `${row.color}22`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FinanceIcon name={String(resolveCategoryMeta(row.categoria, catMap).icon)} size={16} color={row.color} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Text variant="body" numberOfLines={1} style={{ flex: 1, fontSize: 15, lineHeight: 22 }}>
                {row.label}
              </Text>
              <Text variant="caption" muted style={{ fontVariant: ['tabular-nums'] }}>{row.pct}%</Text>
              <Text
                variant="body"
                style={{ fontSize: 15, lineHeight: 22, fontFamily: 'Lexend_500Medium', fontVariant: ['tabular-nums'], minWidth: 96, textAlign: 'right' }}
              >
                {formatBRL(row.total)}
              </Text>
            </View>
            <View style={{ height: 4, borderRadius: 999, backgroundColor: colors.hairline, overflow: 'hidden' }}>
              <View style={{ width: `${Math.max(2, Math.min(100, row.pct))}%`, height: '100%', backgroundColor: row.color }} />
            </View>
          </View>
        </WebHoverable>
      ))}
    </View>
  )
}
