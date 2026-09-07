import { useEffect } from 'react'
import { ScrollView, View } from 'react-native'
import type { FinanceCategory } from '@simply-life/shared'
import { Text, PressableScale, PrimaryButton } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useCategoryMetaStore } from '../../store/categoryMetaStore'
import { LucideFinanceIcon } from '../../lib/lucideFinanceIcons'
import { useFixaMetaStore } from '../../store/fixaMetaStore'
import { FIXA_URGENCIA_LABELS } from '../../lib/fixaMeta'

export { DEFAULT_CATEGORY_ICONS as EXPENSE_CATEGORY_ICONS } from '../../lib/categoryMeta'

type Props = {
  value: FinanceCategory
  onChange: (cat: FinanceCategory) => void
  onEditCategories?: () => void
}

/** Chips de categoria com ícone personalizável */
export function ExpenseCategoryChips({ value, onChange, onEditCategories }: Props)
{
  const { colors } = useTheme()
  const hydrate = useCategoryMetaStore((s) => s.hydrate)
  const resolve = useCategoryMetaStore((s) => s.resolve)
  const map = useCategoryMetaStore((s) => s.map)
  const listIds = useCategoryMetaStore((s) => s.ids)
  const ids = listIds()

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="caption" muted>
          Categoria
        </Text>
        {onEditCategories ? (
          <PrimaryButton
            label="Editar"
            variant="link"
            size="sm"
            onPress={onEditCategories}
          />
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
      >
        {ids.map((id) =>
        {
          const meta = resolve(id)
          const active = value === id
          const accent = meta.color
          void map
          return (
            <PressableScale
              key={id}
              onPress={() => onChange(id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={meta.label}
              style={{
                minHeight: 44,
                minWidth: 44,
                paddingHorizontal: 12,
                borderRadius: 999,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: active ? `${accent}38` : colors.elevated,
                borderWidth: 1,
                borderColor: active ? accent : colors.hairline,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: accent,
                }}
              />
              <LucideFinanceIcon name={String(meta.icon)} size={16} color={accent} />
              <Text
                variant="caption"
                style={{
                  fontWeight: '600',
                  color: active ? colors.ink : colors.inkMuted,
                }}
              >
                {meta.label}
              </Text>
            </PressableScale>
          )
        })}
      </ScrollView>
    </View>
  )
}

type Fixa = {
  id: string
  nome: string
  valor: number
  categoria: string
}

/** Atalhos a partir das contas fixas cadastradas */
export function ExpenseFixasChips({
  fixas,
  onPick,
  onEditFixas,
}: {
  fixas: Fixa[]
  onPick: (fixa: Fixa) => void
  onEditFixas?: () => void
})
{
  const { colors } = useTheme()
  const hydrate = useFixaMetaStore((s) => s.hydrate)
  const resolve = useFixaMetaStore((s) => s.resolve)
  const map = useFixaMetaStore((s) => s.map)

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="caption" muted>
          Contas fixas
        </Text>
        {onEditFixas ? (
          <PrimaryButton
            label="Editar"
            variant="link"
            size="sm"
            onPress={onEditFixas}
          />
        ) : null}
      </View>
      {fixas.length === 0 ? (
        <Text variant="caption" muted>
          Nenhuma fixa ainda — toque em Editar para criar.
        </Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
        >
          {fixas.slice(0, 12).map((f) =>
          {
            const meta = resolve(f.id, f.categoria)
            const accent = meta.urgencia === 1 ? colors.danger : meta.color
            void map
            return (
              <PressableScale
                key={f.id}
                onPress={() => onPick(f)}
                accessibilityLabel={`Usar ${f.nome}`}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 12,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: `${accent}22`,
                  borderWidth: 1,
                  borderColor: accent,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: accent,
                  }}
                />
                <LucideFinanceIcon name={meta.icon} size={16} color={accent} />
                <Text variant="caption" style={{ fontWeight: '600' }} numberOfLines={1}>
                  {f.nome}
                </Text>
                {meta.urgencia === 1 ? (
                  <Text variant="caption" color={colors.danger} style={{ fontWeight: '600' }}>
                    {FIXA_URGENCIA_LABELS[1]}
                  </Text>
                ) : null}
              </PressableScale>
            )
          })}
        </ScrollView>
      )}
    </View>
  )
}
