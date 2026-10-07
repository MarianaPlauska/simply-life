import { useEffect, useState } from 'react'
import { Linking, Pressable, View } from 'react-native'
import { Modal } from '../../ui/Modal'
import {
  clampItemGrams,
  clampItemKcal,
  foodSourceLabel,
  formatItemKcal,
  formatItemNutrients,
  isEstimatedKcalSource,
  type FoodItem,
} from '@simply-life/shared'
import { Field, PrimaryButton, Text, CloseButton } from '../../ui'
import { Icon } from '../../ui/Icon'
import { useTheme } from '../../theme/ThemeProvider'

/**
 * Números de um item: "≈ 320 kcal · 18 g prot · 4 g açúcar". Estimativa aparece com "≈" e o
 * rótulo "estimativa"; valor da pessoa ou da embalagem aparece limpo. Tocar abre a correção.
 */
export function KcalChip({ item, onPress }: { item: FoodItem; onPress: () => void })
{
  const { colors, radius } = useTheme()
  const line = formatItemNutrients(item)
  const estimated = line != null && isEstimatedKcalSource(item.fonte)
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={line
        ? `${line}${estimated ? ', estimativa' : ''}. Tocar para corrigir`
        : `Informar calorias e nutrientes de ${item.nome}`}
      hitSlop={6}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        minHeight: 32,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.hairline,
        backgroundColor: colors.surface,
        flexShrink: 1,
      }}
    >
      <Text variant="micro" color={colors.ink}>{line ?? 'kcal'}</Text>
      {estimated ? <Text variant="micro" muted>estimativa</Text> : null}
      {!line ? <Icon name="pencil-outline" size={12} color={colors.inkMuted} /> : null}
    </Pressable>
  )
}

/** "Fonte: pesquisa na web" com até 2 links tocáveis; nada quando o item não tem número. */
export function FoodSourceLine({ item }: { item: FoodItem })
{
  const { colors } = useTheme()
  if (typeof item.kcal !== 'number') return null
  const label = foodSourceLabel(item)
  if (!label) return null
  const links = item.fontes ?? []
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8 }}>
      <Text variant="micro" muted>{`Fonte: ${label}`}</Text>
      {links.map((url, i) => (
        <Pressable
          key={url}
          onPress={() => void Linking.openURL(url)}
          accessibilityRole="link"
          accessibilityLabel={`Abrir fonte ${i + 1} na web`}
          hitSlop={10}
          style={{ minHeight: 32, justifyContent: 'center' }}
        >
          <Text variant="micro" color={colors.brand} style={{ textDecorationLine: 'underline' }}>
            {links.length > 1 ? `ver fonte ${i + 1}` : 'ver fonte'}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

export type KcalEditValues = { kcal: number; proteina: number | null; acucar: number | null }

type SheetProps = {
  item: FoodItem | null
  onClose: () => void
  onSave: (values: KcalEditValues) => void
}

function gramsText(v: number | null | undefined): string
{
  return typeof v === 'number' && Number.isFinite(v) ? String(v).replace('.', ',') : ''
}

/** Deixa só dígitos e uma vírgula, no máximo 3 dígitos inteiros e 1 decimal ("18", "4,5"). */
function cleanGrams(t: string): string
{
  const s = t.replace('.', ',').replace(/[^\d,]/g, '')
  const [int, ...rest] = s.split(',')
  const dec = rest.join('').slice(0, 1)
  return rest.length ? `${int.slice(0, 3)},${dec}` : int.slice(0, 3)
}

/**
 * Correção de um item: kcal, proteína e açúcar (teclado numérico). Proteína e açúcar podem
 * ficar vazios. Os valores ficam lembrados para o item.
 */
export function KcalEditSheet({ item, onClose, onSave }: SheetProps)
{
  const { colors, space, radius } = useTheme()
  const [kcal, setKcal] = useState('')
  const [prot, setProt] = useState('')
  const [acucar, setAcucar] = useState('')

  useEffect(() =>
  {
    setKcal(item && typeof item.kcal === 'number' ? String(Math.round(item.kcal)) : '')
    setProt(gramsText(item?.proteina))
    setAcucar(gramsText(item?.acucar))
  }, [item])

  if (!item) return null
  const parsed = clampItemKcal(kcal.replace(/\D/g, '') || NaN)
  const line = formatItemNutrients(item)
  const estimated = line != null && isEstimatedKcalSource(item.fonte)
  const porcao = item.quantidade || item.porcao
  const save = () =>
  {
    if (parsed == null) return
    onSave({ kcal: parsed, proteina: clampItemGrams(prot), acucar: clampItemGrams(acucar) })
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
          <Icon name="nutrition-outline" size={20} color={colors.brand} />
          <Text variant="section" style={{ flex: 1 }}>{item.nome}</Text>
          <CloseButton onPress={onClose} size={44} />
        </View>
        {estimated && typeof item.kcal === 'number' ? (
          <Text variant="caption" muted>
            {`${formatItemKcal(item.kcal, item.fonte)} é uma estimativa${porcao ? ` para ${porcao}` : ''}. Se souber os números, ajuste aqui.`}
          </Text>
        ) : porcao ? (
          <Text variant="caption" muted>{`Porção: ${porcao}`}</Text>
        ) : null}
        <Field
          label="Calorias (kcal)"
          value={kcal}
          onChangeText={(t) => setKcal(t.replace(/\D/g, '').slice(0, 4))}
          keyboardType="number-pad"
          placeholder="Ex: 320"
          returnKeyType="next"
          autoFocus
        />
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <Field
              label="Proteína (g)"
              value={prot}
              onChangeText={(t) => setProt(cleanGrams(t))}
              keyboardType="decimal-pad"
              placeholder="Opcional"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Açúcar (g)"
              value={acucar}
              onChangeText={(t) => setAcucar(cleanGrams(t))}
              keyboardType="decimal-pad"
              placeholder="Opcional"
              returnKeyType="done"
              onSubmitEditing={save}
            />
          </View>
        </View>
        <Text variant="micro" muted>O app lembra desses números para as próximas vezes que você registrar este item.</Text>
        <PrimaryButton label="Salvar" disabled={parsed == null} onPress={save} />
      </View>
    </Modal>
  )
}
