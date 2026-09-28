import { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  MUSCLE_GROUP_LABEL,
  MUSCLE_GROUP_ORDER,
  WORKOUT_CATALOG,
  searchWorkoutCatalog,
  type MuscleGroup,
  type WorkoutCatalogExercise,
} from '@simply-life/shared'
import { Chip, Field, Icon, PrimaryButton, Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'

type Props = {
  visible: boolean
  onClose: () => void
  onPick: (ex: WorkoutCatalogExercise) => void
}

function slug(s: string): string
{
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** Lista do catálogo com busca e filtro por grupo; aceita exercício próprio. */
export function ExercisePickerSheet({ visible, onClose, onPick }: Props)
{
  const { colors, radius, space } = useTheme()
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<MuscleGroup | null>(null)

  useEffect(() =>
  {
    if (!visible) return
    setQuery('')
    setGroup(null)
  }, [visible])

  const list = useMemo(() =>
  {
    const base = group ? WORKOUT_CATALOG.filter((e) => e.group === group) : WORKOUT_CATALOG
    return searchWorkoutCatalog(query, base)
  }, [query, group])

  const custom = query.trim()
  const canCustom = custom.length >= 2 && !list.some((e) => e.name.toLowerCase() === custom.toLowerCase())

  const pick = (ex: WorkoutCatalogExercise) =>
  {
    onPick(ex)
    onClose()
  }

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
          <Text variant="title">Adicionar exercício</Text>
          <Field label="Buscar" value={query} onChangeText={setQuery} placeholder="Supino, costas, prancha" autoCorrect={false} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            <Chip label="Todos" active={group == null} onPress={() => setGroup(null)} />
            {MUSCLE_GROUP_ORDER.map((g) => (
              <Chip key={g} label={MUSCLE_GROUP_LABEL[g]} active={group === g} onPress={() => setGroup(g)} />
            ))}
          </ScrollView>
          <ScrollView style={{ maxHeight: 440 }} contentContainerStyle={{ gap: 6, paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
            {canCustom ? (
              <Pressable
                onPress={() => pick({ id: `proprio-${slug(custom)}`, name: custom, group: group ?? 'corpo', bodyweight: false })}
                accessibilityRole="button"
                style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: 8 }}
              >
                <Icon name="add" size={18} color={colors.ink} />
                <Text variant="bodyStrong" style={{ flex: 1 }}>Criar “{custom}”</Text>
              </Pressable>
            ) : null}
            {list.map((e) => (
              <Pressable
                key={e.id}
                onPress={() => pick(e)}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  minHeight: 52,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.sm,
                  paddingHorizontal: 8,
                  borderRadius: radius.control,
                  backgroundColor: pressed ? colors.elevated : 'transparent',
                })}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="body" numberOfLines={1}>{e.name}</Text>
                  <Text variant="micro" muted>
                    {MUSCLE_GROUP_LABEL[e.group]}{e.bodyweight ? ' · peso do corpo' : ''}
                  </Text>
                </View>
                <Icon name="add" size={18} color={colors.inkMuted} />
              </Pressable>
            ))}
            {list.length === 0 && !canCustom ? (
              <Text variant="caption" muted>Nada com esse nome. Digite para criar o seu.</Text>
            ) : null}
          </ScrollView>
          <PrimaryButton label="Fechar" variant="dismiss" onPress={onClose} />
        </View>
      </View>
    </Modal>
  )
}
