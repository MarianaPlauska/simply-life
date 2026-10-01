import { useEffect } from 'react'
import { View } from 'react-native'
import {
  BUDGET_PRESETS,
  budgetRuleLabel,
  normalizeBudgetRule,
  seriesColor,
} from '@simply-life/shared'
import { Chip, PressableScale, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useCategoryMetaStore } from '../../store/categoryMetaStore'
import { usePrefsStore } from '../../store/prefsStore'
import { allCategoryIds } from '../../lib/categoryMeta'
import { FinanceIcon } from '../../lib/financeIcons'
import { OnbBlock } from './OnbStep'

/**
 * Boas-vindas: quais categorias de gasto usar (toque para tirar ou pôr) e qual regra
 * de orçamento seguir. Vale na hora; depois dá para mudar na Carteira.
 */
export function FinanceCategoryPicker()
{
  const { colors, space, radius, chart, mode } = useTheme()
  const hydrate = useCategoryMetaStore((s) => s.hydrate)
  const map = useCategoryMetaStore((s) => s.map)
  const resolve = useCategoryMetaStore((s) => s.resolve)
  const patch = useCategoryMetaStore((s) => s.patch)
  const rule = normalizeBudgetRule(usePrefsStore((s) => s.prefs.budget_rule))
  const patchPrefs = usePrefsStore((s) => s.patch)
  const ink = mode === 'dark' ? colors.brandInk : colors.brand

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  const ids = allCategoryIds(map)
  const onCount = ids.filter((id) => !map[id]?.hidden).length

  return (
    <>
      <OnbBlock title="Suas categorias de gasto" hint={`Toque para tirar as que não usa. ${onCount} ligadas.`}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {ids.map((id) =>
          {
            const meta = resolve(id)
            const on = !map[id]?.hidden
            const tint = seriesColor(meta.color, chart)
            return (
              <PressableScale
                key={id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={meta.label}
                onPress={() => void patch(id, { hidden: on })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  minHeight: 40,
                  paddingHorizontal: 12,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: on ? ink : colors.hairline,
                  backgroundColor: on ? colors.brandMuted : colors.elevated,
                  opacity: on ? 1 : 0.7,
                }}
              >
                <FinanceIcon name={String(meta.icon)} size={16} color={on ? tint : colors.inkFaint} />
                <Text variant="label" color={on ? colors.ink : colors.inkMuted}>{meta.label}</Text>
              </PressableScale>
            )
          })}
        </View>
        <Text variant="caption" muted>Depois dá para criar outras, com ícone e cor, em Carteira → Contas.</Text>
      </OnbBlock>

      <OnbBlock title="Regra do orçamento" hint="Como dividir a receita entre necessidades, desejos e reserva.">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {BUDGET_PRESETS.map((p) => (
            <Chip key={p.id} label={p.id} active={budgetRuleLabel(rule) === p.id} onPress={() => void patchPrefs({ budget_rule: p.rule })} />
          ))}
        </View>
        <Text variant="caption" muted>
          {BUDGET_PRESETS.find((p) => budgetRuleLabel(rule) === p.id)?.hint ?? 'Do seu jeito.'} Ajuste fino e a faixa de cada categoria ficam em Carteira → Análise.
        </Text>
      </OnbBlock>
    </>
  )
}
