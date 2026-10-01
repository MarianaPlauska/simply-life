import { useEffect, useState } from 'react'
import { Modal, Pressable, View } from 'react-native'
import { clampItemKcal, formatItemKcal, isEstimatedKcalSource, type FoodItem } from '@simply-life/shared'
import { Field, PrimaryButton, Text, CloseButton } from '../../ui'
import { Icon } from '../../ui/Icon'
import { useTheme } from '../../theme/ThemeProvider'

/**
 * Número de calorias de um item. Estimativa aparece com "≈" e o rótulo "estimativa";
 * valor da pessoa ou da embalagem aparece limpo. Tocar abre a correção.
 */
export function KcalChip({ item, onPress }: { item: FoodItem; onPress: () => void })
{
  const { colors, radius } = useTheme()
  const has = typeof item.kcal === 'number'
  const estimated = has && isEstimatedKcalSource(item.fonte)
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={has
        ? `${formatItemKcal(item.kcal as number, item.fonte)}${estimated ? ', estimativa' : ''}. Tocar para corrigir`
        : `Informar calorias de ${item.nome}`}
      hitSlop={6}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.hairline,
        backgroundColor: colors.surface,
      }}
    >
      <Text variant="micro" color={colors.ink}>{has ? formatItemKcal(item.kcal as number, item.fonte) : 'kcal'}</Text>
      {estimated ? <Text variant="micro" muted>estimativa</Text> : null}
      {!has ? <Icon name="pencil-outline" size={12} color={colors.inkMuted} /> : null}
    </Pressable>
  )
}

type SheetProps = {
  item: FoodItem | null
  onClose: () => void
  onSave: (kcal: number) => void
}

/** Correção da caloria de um item (teclado numérico). O valor fica lembrado para o item. */
export function KcalEditSheet({ item, onClose, onSave }: SheetProps)
{
  const { colors, space, radius } = useTheme()
  const [value, setValue] = useState('')

  useEffect(() =>
  {
    setValue(item && typeof item.kcal === 'number' ? String(Math.round(item.kcal)) : '')
  }, [item])

  if (!item) return null
  const parsed = clampItemKcal(value.replace(/\D/g, '') || NaN)
  const estimated = typeof item.kcal === 'number' && isEstimatedKcalSource(item.fonte)
  const porcao = item.quantidade || item.porcao
  const save = () =>
  {
    if (parsed == null) return
    onSave(parsed)
    onClose()
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={onClose} accessibilityLabel="Fechar" />
      <View
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          padding: space.lg,
          paddingBottom: space.xxl,
          gap: space.md,
          maxWidth: 560,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Icon name="flame-outline" size={20} color={colors.brand} />
          <Text variant="section" style={{ flex: 1 }}>{`Calorias de ${item.nome}`}</Text>
          <CloseButton onPress={onClose} size={36} />
        </View>
        {estimated ? (
          <Text variant="caption" muted>
            {`${formatItemKcal(item.kcal as number, item.fonte)} é uma estimativa${porcao ? ` para ${porcao}` : ''}. Se souber o número, ajuste aqui.`}
          </Text>
        ) : porcao ? (
          <Text variant="caption" muted>{`Porção: ${porcao}`}</Text>
        ) : null}
        <Field
          label="kcal"
          value={value}
          onChangeText={(t) => setValue(t.replace(/\D/g, '').slice(0, 4))}
          keyboardType="number-pad"
          placeholder="Ex: 320"
          returnKeyType="done"
          onSubmitEditing={save}
          autoFocus
        />
        <Text variant="micro" muted>O app lembra desse valor para as próximas vezes que você registrar este item.</Text>
        <PrimaryButton label="Salvar" disabled={parsed == null} onPress={save} />
      </View>
    </Modal>
  )
}
