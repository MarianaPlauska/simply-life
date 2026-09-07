import { useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { formatBRL } from '@simply-life/shared'
import {
  Card,
  Text,
  SectionHeader,
  EmptyState,
  PrimaryButton,
} from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import {
  fetchBudgetPlanning,
  upsertBudgetLimit,
  type MobileBudgetCategory,
} from '../../lib/sync/financeBudgets'
import { InvitePartnerCard } from './InvitePartnerCard'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

/** Hub Orçamentos no Expo - limites por categoria + alerta simples */
export function FinancePlanningPanel()
{
  const { colors, space, radius } = useTheme()
  const isGuest = useAuthStore((s) => s.isGuest)
  const [monthOffset, setMonthOffset] = useState(0)
  const [rows, setRows] = useState<MobileBudgetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const view = useMemo(() =>
  {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  }, [monthOffset])

  const monthLabel = `${MONTHS[view.getMonth()]} ${view.getFullYear()}`

  const reload = useCallback(async () =>
  {
    if (isGuest)
    {
      setRows([])
      setLoading(false)
      setError('Entre com sua conta para ver e editar orçamentos.')
      return
    }
    setLoading(true)
    setError(null)
    try
    {
      const data = await fetchBudgetPlanning(monthOffset)
      setRows(data)
    }
    catch (e)
    {
      setError(e instanceof Error ? e.message : 'Falha ao carregar orçamentos')
    }
    finally
    {
      setLoading(false)
    }
  }, [isGuest, monthOffset])

  useEffect(() =>
  {
    void reload()
  }, [reload])

  const tracked = rows.filter((r) => r.limite > 0)
  const totalLimit = tracked.reduce((s, r) => s + r.limite, 0)
  const totalSpent = tracked.reduce((s, r) => s + r.gasto, 0)
  const remaining = Math.max(0, totalLimit - totalSpent)
  const overallPct = totalLimit > 0 ? Math.min(100, (totalSpent / totalLimit) * 100) : 0
  const alertRows = rows.filter((r) => r.limite > 0 && r.gasto / r.limite >= 0.8)

  return (
    <View style={{ gap: space.lg }}>
      <Card tone="elevated" style={{ gap: space.md }}>
        <SectionHeader
          title="Planejamento mensal"
          subtitle="Limites por categoria"
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <PrimaryButton
            label="Ant"
            variant="ghost"
            size="sm"
            disabled={monthOffset <= -5}
            onPress={() => setMonthOffset((m) => m - 1)}
          />
          <Text variant="bodyStrong">{monthLabel}</Text>
          <PrimaryButton
            label="Prox"
            variant="ghost"
            size="sm"
            disabled={monthOffset >= 5}
            onPress={() => setMonthOffset((m) => m + 1)}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text variant="caption" muted>
            Orçamento geral
          </Text>
          <Text variant="hero" color={colors.finance} style={{ fontSize: 28 }}>
            {formatBRL(remaining)}
          </Text>
          <Text variant="caption" muted>
            {tracked.length > 0
              ? `${formatBRL(totalSpent)} de ${formatBRL(totalLimit)} · ${overallPct.toFixed(0)}%`
              : 'Defina limites nas categorias'}
          </Text>
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
                width: `${overallPct}%`,
                height: '100%',
                    backgroundColor:
                  overallPct >= 100
                    ? colors.danger
                    : overallPct >= 80
                      ? colors.attention
                      : colors.finance,
              }}
            />
          </View>
        </View>

        {monthOffset === 0 && alertRows.length > 0 && (
          <View
            style={{
              borderRadius: radius.card,
              borderWidth: 1,
              borderColor: colors.axel,
              backgroundColor: colors.axelMuted,
              padding: space.md,
              gap: 4,
            }}
          >
            <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
              Alerta Hoje
            </Text>
            {alertRows.slice(0, 3).map((r) =>
            {
              const pct = Math.round((r.gasto / r.limite) * 100)
              return (
                <Text key={r.id} variant="body" style={{ fontSize: 13 }}>
                  {pct >= 100
                    ? `${r.nome} estourou o orçamento (${pct}%)`
                    : `${r.nome} em ${pct}% do limite`}
                </Text>
              )
            })}
          </View>
        )}
      </Card>

      {loading ? (
        <Text variant="body" muted>
          Carregando orçamentos…
        </Text>
      ) : error ? (
        <EmptyState title="Orçamentos" body={error} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Sem limites ainda"
          body="No web, em Análise → Orçamentos, defina o teto por categoria. Depois aparece aqui."
        />
      ) : (
        <Card tone="elevated" style={{ gap: space.md }}>
          <SectionHeader title="Por categoria" subtitle="Gasto vs limite" />
          {rows.map((r) =>
          {
            const pct = r.limite > 0 ? Math.min(100, (r.gasto / r.limite) * 100) : 0
            return (
              <View key={r.id} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                    {r.nome}
                  </Text>
                  <Text variant="caption" muted>
                    {formatBRL(r.gasto)}
                    {r.limite > 0 ? ` / ${formatBRL(r.limite)}` : ''}
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
                      width: `${pct}%`,
                      height: '100%',
                      backgroundColor:
                        pct >= 100
                          ? colors.danger
                          : pct >= 80
                            ? colors.attention
                            : r.cor || colors.finance,
                    }}
                  />
                </View>
                {r.limite <= 0 && (
                  <PrimaryButton
                    label="Limite R$ 500"
                    variant="link"
                    size="sm"
                    onPress={() =>
                    {
                      void upsertBudgetLimit(r.id, 500).then(reload)
                    }}
                  />
                )}
              </View>
            )
          })}
        </Card>
      )}

      <InvitePartnerCard />
    </View>
  )
}
