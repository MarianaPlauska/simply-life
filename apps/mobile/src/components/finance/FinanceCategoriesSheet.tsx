import { useEffect, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { Modal } from '../../ui/Modal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  BUDGET_BUCKET_LABEL,
  bucketOf,
  seriesColor,
  type BudgetBucket,
} from '@simply-life/shared'
import { Text, Field, PrimaryButton, PressableScale, Chip, CloseButton, Icon } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { allCategoryIds, defaultCategoryMeta, nextFreeCategorySeries } from '../../lib/categoryMeta'
import { FinanceIcon } from '../../lib/financeIcons'
import { confirmDestructive } from '../../lib/confirmDestructive'
import { useCategoryMetaStore } from '../../store/categoryMetaStore'
import { usePrefsStore } from '../../store/prefsStore'
import { FinanceColorSwatches } from './FinanceColorSwatches'
import { FinanceIconPicker } from './FinanceIconPicker'

type Props = {
  visible: boolean
  onClose: () => void
}

const BUCKETS: BudgetBucket[] = ['needs', 'wants', 'savings']

/** Criar, editar e excluir categorias de gasto: nome, ícone, cor e faixa no orçamento. */
export function FinanceCategoriesSheet({ visible, onClose }: Props)
{
  const { colors, space, radius, chart } = useTheme()
  const insets = useSafeAreaInsets()
  const hydrate = useCategoryMetaStore((s) => s.hydrate)
  const resolve = useCategoryMetaStore((s) => s.resolve)
  const patch = useCategoryMetaStore((s) => s.patch)
  const create = useCategoryMetaStore((s) => s.create)
  const remove = useCategoryMetaStore((s) => s.remove)
  const map = useCategoryMetaStore((s) => s.map)
  const listIds = useCategoryMetaStore((s) => s.ids)
  const buckets = usePrefsStore((s) => s.prefs.budget_buckets)
  const patchPrefs = usePrefsStore((s) => s.patch)

  const [editId, setEditId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [label, setLabel] = useState('')
  const [icon, setIcon] = useState('circle')
  const [color, setColor] = useState<string>('slate')
  const [bucket, setBucket] = useState<BudgetBucket>('wants')

  const ids = listIds()
  const hiddenIds = allCategoryIds(map).filter((id) => map[id]?.hidden)

  useEffect(() =>
  {
    if (visible) void hydrate()
  }, [visible, hydrate])

  useEffect(() =>
  {
    if (!editId) return
    const meta = resolve(editId)
    setLabel(meta.label)
    setIcon(String(meta.icon))
    setColor(meta.color)
    setBucket(bucketOf(editId, buckets, meta.label))
  }, [editId, resolve, map, buckets])

  const closeForm = () =>
  {
    setEditId(null)
    setCreating(false)
    setLabel('')
    setIcon('circle')
  }

  const saveBucket = (id: string) => patchPrefs({ budget_buckets: { ...(buckets ?? {}), [id]: bucket } })

  const formOpen = Boolean(editId) || creating

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Fechar" />
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            padding: space.lg,
            paddingBottom: Math.max(insets.bottom, space.lg),
            maxHeight: '90%',
            gap: space.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="section">
                {creating ? 'Nova categoria' : editId ? 'Editar categoria' : 'Categorias de gasto'}
              </Text>
              <Text variant="caption" muted>
                Nome, ícone, cor e a faixa no orçamento. Aparecem no seletor de gastos.
              </Text>
            </View>
            <CloseButton onPress={formOpen ? closeForm : onClose} label={formOpen ? 'Voltar' : 'Fechar'} />
          </View>

          {formOpen ? (
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: space.md, paddingBottom: space.sm }}>
              <Field label="Nome" value={label} onChangeText={setLabel} placeholder="Ex: Farmácia" />
              <FinanceIconPicker value={icon} onChange={setIcon} />
              <FinanceColorSwatches value={color} onChange={setColor} />
              <View style={{ gap: 6 }}>
                <Text variant="label" muted>Faixa no orçamento</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                  {BUCKETS.map((b) => (
                    <Chip key={b} label={BUDGET_BUCKET_LABEL[b]} active={bucket === b} onPress={() => setBucket(b)} />
                  ))}
                </View>
              </View>
              <PrimaryButton
                label={creating ? 'Criar categoria' : 'Salvar categoria'}
                disabled={!label.trim()}
                onPress={() =>
                {
                  if (creating)
                  {
                    void create(label, icon, color).then((id) =>
                    {
                      if (id) void saveBucket(id)
                      closeForm()
                    })
                    return
                  }
                  if (!editId) return
                  void saveBucket(editId)
                  void patch(editId, {
                    label: label.trim() || defaultCategoryMeta(editId).label,
                    icon,
                    color,
                  }).then(() => closeForm())
                }}
              />
              {editId ? (
                <PrimaryButton
                  label="Excluir categoria"
                  variant="danger"
                  onPress={() =>
                    confirmDestructive(
                      `Excluir ${resolve(editId).label}?`,
                      'Some do seletor de gastos. Gastos antigos continuam com ela, e dá para voltar a usar depois.',
                      () => void remove(editId).then(() => closeForm()),
                      'Excluir',
                    )}
                />
              ) : null}
            </ScrollView>
          ) : (
            <>
              <ScrollView style={{ maxHeight: 440 }} contentContainerStyle={{ gap: 4 }}>
                {ids.map((id, i) =>
                {
                  const meta = resolve(id)
                  const tint = seriesColor(meta.color, chart)
                  return (
                    <PressableScale
                      key={id}
                      accessibilityRole="button"
                      accessibilityLabel={`Editar ${meta.label}`}
                      onPress={() => setEditId(id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingVertical: 10,
                        borderBottomWidth: i < ids.length - 1 ? 1 : 0,
                        borderBottomColor: colors.hairline,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: `${tint}22`,
                        }}
                      >
                        <FinanceIcon name={String(meta.icon)} size={18} color={tint} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text variant="bodyStrong" numberOfLines={1}>{meta.label}</Text>
                        <Text variant="caption" muted>{BUDGET_BUCKET_LABEL[bucketOf(id, buckets, meta.label)]}</Text>
                      </View>
                      <Icon name="chevron-forward" size={16} color={colors.inkFaint} />
                    </PressableScale>
                  )
                })}

                {hiddenIds.length ? (
                  <View style={{ gap: 6, paddingTop: space.md }}>
                    <Text variant="label" muted>Excluídas</Text>
                    {hiddenIds.map((id) => (
                      <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}>
                        <FinanceIcon name={String(resolve(id).icon)} size={16} color={colors.inkFaint} />
                        <Text variant="body" muted style={{ flex: 1 }}>{resolve(id).label}</Text>
                        <PrimaryButton label="Voltar a usar" variant="link" size="sm" onPress={() => void patch(id, { hidden: false })} />
                      </View>
                    ))}
                  </View>
                ) : null}
              </ScrollView>
              <PrimaryButton
                label="Nova categoria"
                variant="secondary"
                icon="add"
                onPress={() =>
                {
                  setCreating(true)
                  setLabel('')
                  setIcon('circle')
                  setColor(nextFreeCategorySeries(map))
                  setBucket('wants')
                }}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}
