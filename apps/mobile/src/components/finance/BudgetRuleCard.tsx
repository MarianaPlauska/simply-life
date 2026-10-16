import { useMemo, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { Modal } from '../../ui/Modal'
import {
  BUDGET_BUCKET_HINT,
  BUDGET_BUCKET_LABEL,
  BUDGET_PRESETS,
  budgetRuleLabel,
  budgetSplit,
  bucketOf,
  formatBRL,
  normalizeBudgetRule,
  type BudgetBucket,
} from '@simply-life/shared'
import { Card, Chip, CloseButton, PrimaryButton, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAccents } from '../../theme/useAccents'
import { useDataStore } from '../../store/dataStore'
import { usePrefsStore } from '../../store/prefsStore'
import { useCategoryMetaStore } from '../../store/categoryMetaStore'
import { useCaptureStore } from '../../store/captureStore'
import { useFinanceFocusStore } from '../../store/financeFocusStore'
import { resolveCategoryMeta, visibleCategoryIds } from '../../lib/categoryMeta'
import { OnbNumber } from '../onboarding/OnbNumber'
import { useDeskMicro } from './desk/deskLayout'

const BUCKETS: BudgetBucket[] = ['needs', 'wants', 'savings']

/**
 * Regra de orçamento por faixas sobre os gastos reais do mês.
 * Cada categoria cai numa faixa; a pessoa escolhe os percentuais e a faixa de cada categoria.
 */
export function BudgetRuleCard()
{
  const { colors, space, radius } = useTheme()
  const micro = useDeskMicro()
  const accents = useAccents()
  const txs = useDataStore((s) => s.finance)
  const prefs = usePrefsStore((s) => s.prefs)
  const patch = usePrefsStore((s) => s.patch)
  const catMap = useCategoryMetaStore((s) => s.map)
  const openCapture = useCaptureStore((s) => s.openCapture)
  const [open, setOpen] = useState(false)

  const rule = normalizeBudgetRule(prefs.budget_rule)
  const labels = useMemo(() =>
  {
    const out: Record<string, string> = {}
    for (const id of visibleCategoryIds(catMap)) out[id] = resolveCategoryMeta(id, catMap).label
    return out
  }, [catMap])
  const split = useMemo(
    () => budgetSplit({ txs, rule, overrides: prefs.budget_buckets, labels }),
    [txs, rule, prefs.budget_buckets, labels],
  )
  const barColor: Record<BudgetBucket, string> = { needs: accents.data2, wants: accents.data4, savings: accents.data }

  return (
    <Card tone="elevated" style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="section">Regra {budgetRuleLabel(rule)}</Text>
          <Text variant="caption" muted>
            {split.hasIncome
              ? `Sobre a receita do mês, ${formatBRL(split.income)}.`
              : 'Divide a receita do mês em necessidades, desejos e reserva.'}
          </Text>
        </View>
        <PrimaryButton label="Ajustar" variant="link" size="sm" onPress={() => setOpen(true)} />
      </View>

      {split.hasIncome ? (
        split.rows.map((row) =>
        {
          const pct = row.budget > 0 ? Math.min(100, (row.used / row.budget) * 100) : 0
          const over = row.bucket !== 'savings' && row.used > row.budget
          const short = row.bucket === 'savings' && row.used < row.budget
          return (
            <View key={row.bucket} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.sm }}>
                <Text variant="bodyStrong">{BUDGET_BUCKET_LABEL[row.bucket]} {row.pct}%</Text>
                <Text variant="caption" color={over ? colors.attention : colors.inkMuted}>
                  {formatBRL(row.used)} de {formatBRL(row.budget)}
                </Text>
              </View>
              <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: colors.hairline, overflow: 'hidden' }}>
                <View style={{ width: `${pct}%`, height: '100%', borderRadius: radius.pill, backgroundColor: over ? colors.attention : barColor[row.bucket] }} />
              </View>
              {over ? (
                <Text variant={micro} color={colors.attention}>Passou {formatBRL(row.used - row.budget)} do combinado.</Text>
              ) : short ? (
                <Text variant={micro} muted>Faltam {formatBRL(row.budget - row.used)} para a meta de reserva.</Text>
              ) : null}
            </View>
          )
        })
      ) : (
        // sem receita no mês: explica a regra e pede a primeira entrada, em vez de barras vazias
        <View style={{ gap: space.sm }}>
          {BUCKETS.map((b) => (
            <View key={b} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
              <View style={{ width: 10, height: 10, borderRadius: 3, marginTop: 5, backgroundColor: barColor[b] }} />
              <Text variant="caption" muted style={{ flex: 1 }}>
                <Text variant="caption" style={{ fontFamily: 'Lexend_600SemiBold' }}>{BUDGET_BUCKET_LABEL[b]} {rule[b]}%.</Text> {BUDGET_BUCKET_HINT[b]}
              </Text>
            </View>
          ))}
          <Text variant="caption" muted>
            Para as barras aparecerem, o app precisa saber quanto entrou no mês.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            <PrimaryButton
              label="Lançar uma entrada"
              size="sm"
              onPress={() => openCapture('expense', null, { studio: true, lancamento: 'receita' })}
            />
            <PrimaryButton
              label="Cadastrar salário"
              size="sm"
              variant="secondary"
              onPress={() => useFinanceFocusStore.getState().openContas('salario')}
            />
          </View>
        </View>
      )}

      {/* remonta ao abrir: a ficha sempre começa com o que está salvo */}
      <BudgetRuleSheet
        key={open ? 'aberta' : 'fechada'}
        visible={open}
        onClose={() => setOpen(false)}
        labels={labels}
        onSave={(next) => void patch(next)}
      />
    </Card>
  )
}

function BudgetRuleSheet({
  visible,
  onClose,
  labels,
  onSave,
}: {
  visible: boolean
  onClose: () => void
  labels: Record<string, string>
  onSave: (next: { budget_rule: { needs: number; wants: number; savings: number }; budget_buckets: Record<string, BudgetBucket> }) => void
})
{
  const { colors, space, radius } = useTheme()
  const prefs = usePrefsStore((s) => s.prefs)
  const [rule, setRule] = useState(() => normalizeBudgetRule(prefs.budget_rule))
  const [buckets, setBuckets] = useState<Record<string, BudgetBucket>>(() => ({ ...(prefs.budget_buckets ?? {}) }))
  const setPart = (key: 'needs' | 'wants', v: number) => setRule(normalizeBudgetRule({ ...rule, [key]: v }))

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={onClose} accessibilityLabel="Fechar" />
      <View
        style={{
          maxHeight: '88%',
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          padding: space.lg,
          gap: space.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="section">Sua regra de orçamento</Text>
            <Text variant="caption" muted>Percentuais da receita e a faixa de cada categoria.</Text>
          </View>
          <CloseButton onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={{ gap: space.lg, paddingBottom: space.md }}>
          <View style={{ gap: space.sm }}>
            <Text variant="bodyStrong">Modelos prontos</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {BUDGET_PRESETS.map((p) => (
                <Chip
                  key={p.id}
                  label={p.id}
                  active={budgetRuleLabel(rule) === p.id}
                  onPress={() => setRule(p.rule)}
                />
              ))}
            </View>
            <Text variant="caption" muted>
              {BUDGET_PRESETS.find((p) => budgetRuleLabel(rule) === p.id)?.hint ?? 'Do seu jeito.'}
            </Text>
            <OnbNumber label="Necessidades" value={rule.needs} onChange={(v) => setPart('needs', v)} step={5} min={0} max={100} format={(v) => `${v}%`} />
            <OnbNumber label="Desejos" value={rule.wants} onChange={(v) => setPart('wants', v)} step={5} min={0} max={100 - rule.needs} format={(v) => `${v}%`} />
            <Text variant="caption" muted>Reserva fica com o resto: {rule.savings}%.</Text>
          </View>

          <View style={{ gap: space.sm }}>
            <Text variant="bodyStrong">Faixa de cada categoria</Text>
            {Object.entries(labels).map(([id, label]) =>
            {
              const current = bucketOf(id, buckets, label)
              return (
                <View key={id} style={{ gap: 6 }}>
                  <Text variant="body">{label}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                    {BUCKETS.map((b) => (
                      <Chip key={b} label={BUDGET_BUCKET_LABEL[b]} active={current === b} onPress={() => setBuckets({ ...buckets, [id]: b })} />
                    ))}
                  </View>
                </View>
              )
            })}
          </View>
        </ScrollView>
        <PrimaryButton
          label="Salvar"
          onPress={() =>
          {
            onSave({ budget_rule: rule, budget_buckets: buckets })
            onClose()
          }}
        />
      </View>
    </Modal>
  )
}
