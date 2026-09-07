import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, Field, PrimaryButton, ListRow } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { defaultCategoryMeta } from '../../lib/categoryMeta'
import { useCategoryMetaStore } from '../../store/categoryMetaStore'
import { FinanceColorSwatches } from './FinanceColorSwatches'
import { LucideIconPicker } from './LucideIconPicker'

type Props = {
  visible: boolean
  onClose: () => void
}

/** Editar, criar e excluir categorias de despesa */
export function FinanceCategoriesSheet({ visible, onClose }: Props)
{
  const { colors, space, radius } = useTheme()
  const insets = useSafeAreaInsets()
  const hydrate = useCategoryMetaStore((s) => s.hydrate)
  const resolve = useCategoryMetaStore((s) => s.resolve)
  const patch = useCategoryMetaStore((s) => s.patch)
  const create = useCategoryMetaStore((s) => s.create)
  const remove = useCategoryMetaStore((s) => s.remove)
  const map = useCategoryMetaStore((s) => s.map)
  const listIds = useCategoryMetaStore((s) => s.ids)

  const [editId, setEditId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [label, setLabel] = useState('')
  const [icon, setIcon] = useState('circle')
  const [color, setColor] = useState('#E8734A')

  const ids = listIds()

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
  }, [editId, resolve, map])

  const closeForm = () =>
  {
    setEditId(null)
    setCreating(false)
    setLabel('')
    setIcon('circle')
    setColor('#E8734A')
  }

  const formOpen = Boolean(editId) || creating

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            padding: space.lg,
            paddingBottom: Math.max(insets.bottom, space.lg),
            maxHeight: '88%',
            gap: space.md,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: 999,
              backgroundColor: colors.hairlineStrong,
            }}
          />
          <Text variant="section">
            {creating ? 'Nova categoria' : editId ? 'Editar categoria' : 'Categorias'}
          </Text>
          <Text variant="caption" muted>
            Nome, ícone e cor ficam neste aparelho e no seletor de gastos.
          </Text>

          {formOpen ? (
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 420 }}>
              <View style={{ gap: space.md }}>
                <Field label="Nome" value={label} onChangeText={setLabel} placeholder="Ex: Pet" />
                <FinanceColorSwatches value={color} onChange={setColor} />
                <LucideIconPicker value={icon} onChange={setIcon} />
                <PrimaryButton
                  label={creating ? 'Criar categoria' : 'Salvar categoria'}
                  disabled={!label.trim()}
                  onPress={() =>
                  {
                    if (creating)
                    {
                      void create(label, icon, color).then(() => closeForm())
                      return
                    }
                    if (!editId) return
                    void patch(editId, {
                      label: label.trim() || defaultCategoryMeta(editId).label,
                      icon,
                      color,
                    }).then(() => closeForm())
                  }}
                />
                {editId ? (
                  <PrimaryButton
                    label={resolve(editId).custom ? 'Excluir' : 'Ocultar da lista'}
                    variant="danger"
                    onPress={() =>
                    {
                      void remove(editId).then(() => closeForm())
                    }}
                  />
                ) : null}
                <PrimaryButton label="Voltar" variant="ghost" onPress={closeForm} />
              </View>
            </ScrollView>
          ) : (
            <>
              <ScrollView style={{ maxHeight: 420 }}>
                {ids.map((id, i) =>
                {
                  const meta = resolve(id)
                  return (
                    <View
                      key={id}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                    >
                      <View
                        style={{
                          width: 6,
                          height: 36,
                          borderRadius: 999,
                          backgroundColor: meta.color,
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <ListRow
                          title={meta.label}
                          subtitle={id}
                          right="Editar"
                          showSeparator={i < ids.length - 1}
                          onPress={() => setEditId(id)}
                        />
                      </View>
                    </View>
                  )
                })}
              </ScrollView>
              <PrimaryButton
                label="Nova categoria"
                variant="secondary"
                onPress={() =>
                {
                  setCreating(true)
                  setLabel('')
                  setIcon('circle')
                  setColor('#E8734A')
                }}
              />
              <PrimaryButton label="Fechar" variant="dismiss" onPress={onClose} />
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}
