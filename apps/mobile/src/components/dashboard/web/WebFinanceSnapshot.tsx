import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { formatBRL, monthExpenseTotal, type FinanceTx } from '@simply-life/shared'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { WebHoverable } from './WebHoverable'
import { webStyle } from './webStyle'

/** Painel de finanças no dashboard web: total do mês + últimos lançamentos. */
export function WebFinanceSnapshot({ finance }: { finance: FinanceTx[] })
{
  const { colors } = useTheme()
  const router = useRouter()
  const total = monthExpenseTotal(finance)
  const recent = [...finance].sort((a, b) => (b.data || '').localeCompare(a.data || '')).slice(0, 5)

  return (
    <View style={{ borderRadius: 14, backgroundColor: colors.elevated, padding: 18, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ gap: 2 }}>
          <Text variant="section" style={{ fontSize: 18 }}>
            Finanças
          </Text>
          <Text variant="caption" muted>
            {formatBRL(total)} em despesas no mês
          </Text>
        </View>
        <WebHoverable onPress={() => router.push('/(tabs)/financeiro')}>
          <Text variant="caption" style={{ color: colors.axel, fontWeight: '700' }}>
            Ver tudo
          </Text>
        </WebHoverable>
      </View>

      {recent.length === 0 ? (
        <Text variant="caption" muted>
          Sem lançamentos recentes.
        </Text>
      ) : (
        <View style={{ gap: 2 }}>
          {recent.map((tx) => (
            <WebHoverable
              key={tx.id}
              onPress={() => router.push('/(tabs)/financeiro')}
              style={(hovered) => webStyle({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                paddingVertical: 8,
                paddingHorizontal: 8,
                borderRadius: 10,
                backgroundColor: hovered ? colors.surface : 'transparent',
                cursor: 'pointer',
              })}
            >
              <Text variant="body" numberOfLines={1} style={{ flex: 1, fontSize: 13 }}>
                {tx.titulo}
              </Text>
              <Text
                variant="bodyStrong"
                style={{ fontSize: 13, color: tx.tipo === 'receita' ? colors.health : colors.ink }}
              >
                {tx.tipo === 'receita' ? '+' : '-'}
                {formatBRL(tx.valor)}
              </Text>
            </WebHoverable>
          ))}
        </View>
      )}
    </View>
  )
}
