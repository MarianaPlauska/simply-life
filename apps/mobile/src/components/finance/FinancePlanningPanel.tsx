import { useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { financeCategoryColor, formatBRL, parseBrlNumber } from '@simply-life/shared'
import {
  Card,
  Text,
  SectionHeader,
  EmptyState,
  PrimaryButton,
  Field,
} from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useCategoryMetaStore } from '../../store/categoryMetaStore'
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
  const { colors, space, radius, chart } = useTheme()
  const resolveCat = useCategoryMetaStore((s) => s.resolve)
  const catMap = useCategoryMetaStore((s) => s.map)
  const hydrateCats = useCategoryMetaStore((s) => s.hydrate)
  useEffect(() =>
  {
    void hydrateCats()
  }, [hydrateCats])
  const isGuest = useAuthStore((s) => s.isGuest)
  const [monthOffset, setMonthOffset] = useState(0)
  const [rows, setRows] = useState<MobileBudgetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [limitText, setLimitText] = useState('')
  const [savingLimit, setSavingLimit] = useState(false)

  const saveLimit = async (id: number) =>
  {
    const valor = parseBrlNumber(limitText) ?? (limitText.trim() === '0' ? 0 : null)
    if (valor == null) return
    setSavingLimit(true)
    try
    {
      await upsertBudgetLimit(id, valor)
      setEditingId(null)
      setLimitText('')
      await reload()
    }
    catch (e)
    {
      setError(e instanceof Error ? e.message : 'Não consegui salvar o limite')
    }
    finally
    {
      setSavingLimit(false)
    }
  }

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

        <View style={{ gap: 8 }}>
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
              gap: 6,
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
          title="Sem categorias ainda"
          body="As categorias aparecem aqui assim que a conta sincronizar. Toque numa delas para definir um limite."
        />
      ) : (
        <Card tone="elevated" style={{ gap: space.md }}>
          <SectionHeader title="Por categoria" subtitle="Gasto vs limite" />
          {rows.map((r, i) =>
          {
            void catMap
            // categoria do app: mesma cor do seletor; senão o valor do banco (chave ou hex antigo)
            const catColor = r.slug
              ? financeCategoryColor(resolveCat(r.slug).color, chart, r.slug)
              : financeCategoryColor(r.cor, chart, null, i)
            const pct = r.limite > 0 ? Math.min(100, (r.gasto / r.limite) * 100) : 0
            return (
              <View key={r.id} style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
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
                            : catColor,
                    }}
                  />
                </View>
                {editingId === r.id ? (
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
                    <View style={{ flex: 1 }}>
                      <Field
                        label={`Limite por mês em ${r.nome}`}
                        placeholder="Ex.: 600"
                        keyboardType="decimal-pad"
                        value={limitText}
                        onChangeText={setLimitText}
                      />
                    </View>
                    <PrimaryButton label="Salvar" size="sm" loading={savingLimit} onPress={() => void saveLimit(r.id)} />
                  </View>
                ) : (
                  <PrimaryButton
                    label={r.limite > 0 ? 'Mudar limite' : 'Definir limite'}
                    variant="link"
                    size="sm"
                    onPress={() =>
                    {
                      setEditingId(r.id)
                      setLimitText(r.limite > 0 ? String(r.limite).replace('.', ',') : '')
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
