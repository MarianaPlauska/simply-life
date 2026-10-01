import { useEffect, useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  combineFoodAndSpend,
  foodFrequency,
  foodTimesLabel,
  formatBrlShort,
  localTodayIso,
  spendByItem,
} from '@simply-life/shared'
import { Card, Text } from '../../ui'
import { Icon } from '../../ui/Icon'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'
import { useFoodLogStore } from '../../store/foodLogStore'

/** Gasto com comida agrupado pelo item, a partir do extrato. */
export function useFoodMoneyRows(month = localTodayIso().slice(0, 7))
{
  const finance = useDataStore((s) => s.finance)
  const meals = useFoodLogStore((s) => s.meals)
  return useMemo(() =>
  {
    const freq = foodFrequency(meals, month)
    const spend = spendByItem(finance ?? [], month, { foodKeys: freq.map((f) => f.key) })
    return combineFoodAndSpend(freq, spend)
  }, [finance, meals, month])
}

/**
 * "Onde vai o dinheiro da comida": aparece na Carteira > Análise e abre a tela Comida.
 * `embedded` tira o título e o atalho (uso dentro da própria tela Comida).
 */
export function FoodSpendCard({ embedded = false, limit = 5 }: { embedded?: boolean; limit?: number })
{
  const { colors, space, radius } = useTheme()
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const hydrate = useFoodLogStore((s) => s.hydrate)
  const rows = useFoodMoneyRows()
  const total = rows.reduce((s, r) => s + r.total, 0)
  const max = rows[0]?.total ?? 0

  useEffect(() =>
  {
    void hydrate({ userId: userId ?? null, isGuest })
  }, [hydrate, userId, isGuest])

  const body = (
    <View style={{ gap: space.sm }}>
      {rows.length === 0 ? (
        <Text variant="body" muted>
          Quando você lançar gastos como "café 12,50" ou "almoço", eles aparecem aqui agrupados pelo item.
        </Text>
      ) : (
        <>
          <Text variant="caption" muted>
            {`${formatBrlShort(total)} neste mês, em ${rows.length} ${rows.length === 1 ? 'item' : 'itens'}`}
          </Text>
          {rows.slice(0, limit).map((r) => (
            <View key={r.key} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
                <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                  {r.nome}
                </Text>
                <Text variant="bodyStrong">{formatBrlShort(r.total)}</Text>
              </View>
              <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: colors.hairline, overflow: 'hidden' }}>
                <View
                  style={{
                    width: `${max ? Math.max(4, Math.round((r.total / max) * 100)) : 0}%`,
                    height: '100%',
                    borderRadius: radius.pill,
                    backgroundColor: colors.finance,
                  }}
                />
              </View>
              <Text variant="micro" muted>
                {`${foodTimesLabel(r.vezes)} no extrato${r.comeuVezes ? ` · ${foodTimesLabel(r.comeuVezes)} nas refeições` : ''}`}
              </Text>
            </View>
          ))}
        </>
      )}
    </View>
  )

  if (embedded) return body

  return (
    <Card tone="elevated" style={{ gap: space.sm }}>
      <Pressable
        onPress={() => router.push('/comida')}
        accessibilityRole="button"
        accessibilityLabel="Abrir Comida"
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}
      >
        <Icon name="restaurant-outline" size={18} color={colors.finance} />
        <Text variant="section" style={{ flex: 1 }}>Onde vai o dinheiro da comida</Text>
        <Icon name="chevron-forward" size={16} color={colors.inkMuted} />
      </Pressable>
      {body}
    </Card>
  )
}
