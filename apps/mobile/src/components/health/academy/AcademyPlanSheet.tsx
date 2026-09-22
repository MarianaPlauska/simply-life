import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ACADEMY_WEEK_DAYS,
  academyWeekKey,
  configWithWeekPlan,
  newAcademyExercise,
  type AcademyExercise,
  type AcademyWeekKey,
  type AcademyWeekPlan,
} from '@simply-life/shared'
import { Chip, PrimaryButton, Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { AcademyExerciseRow } from './AcademyExerciseRow'

type Props = {
  visible: boolean
  plan: AcademyWeekPlan
  savedConfig?: Record<string, unknown>
  onClose: () => void
  onSave: (config: Record<string, unknown>) => void
}

/** Editor do padrão semanal: cada dia da semana tem a sua lista. */
export function AcademyPlanSheet({ visible, plan, savedConfig, onClose, onSave }: Props)
{
  const { colors, space, radius } = useTheme()
  const insets = useSafeAreaInsets()
  const [draft, setDraft] = useState<AcademyWeekPlan>(plan)
  const [day, setDay] = useState<AcademyWeekKey>(academyWeekKey())

  useEffect(() =>
  {
    if (!visible) return
    setDraft(plan)
    setDay(academyWeekKey())
  }, [visible, plan])

  const list = draft[day] ?? []

  const setList = (next: AcademyExercise[]) =>
  {
    setDraft((prev) => ({ ...prev, [day]: next }))
  }

  const copyToTrainingDays = () =>
  {
    const source = draft[day] ?? []
    setDraft((prev) => ({
      ...prev,
      seg: source.map((ex) => ({ ...ex, id: `${ex.id}-seg` })),
      qua: source.map((ex) => ({ ...ex, id: `${ex.id}-qua` })),
      sex: source.map((ex) => ({ ...ex, id: `${ex.id}-sex` })),
    }))
    setDay('seg')
  }

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
            maxHeight: '92%',
            gap: space.md,
          }}
        >
          <Text variant="title">Padrão da semana</Text>
          <Text variant="caption" muted>
            Segunda com X exercícios, terça com outros. O treino de hoje segue o calendário.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {ACADEMY_WEEK_DAYS.map((item) => (
              <Chip
                key={item.key}
                label={item.label}
                count={(draft[item.key] ?? []).length}
                active={day === item.key}
                onPress={() => setDay(item.key)}
              />
            ))}
          </ScrollView>
          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 10, paddingBottom: 8 }}>
            {list.map((ex, index) => (
              <AcademyExerciseRow
                key={ex.id}
                exercise={ex}
                onChange={(next) => setList(list.map((row, i) => (i === index ? next : row)))}
                onRemove={() => setList(list.filter((_, i) => i !== index))}
              />
            ))}
            <PrimaryButton
              label="Adicionar exercício"
              variant="ghost"
              onPress={() => setList([...list, newAcademyExercise()])}
            />
            <PrimaryButton
              label="Copiar este dia para Seg, Qua e Sex"
              variant="ghost"
              onPress={copyToTrainingDays}
            />
          </ScrollView>
          <PrimaryButton
            label="Salvar padrão"
            onPress={() =>
            {
              onSave(configWithWeekPlan(savedConfig, draft))
              onClose()
            }}
          />
          <PrimaryButton label="Cancelar" variant="ghost" onPress={onClose} />
        </View>
      </View>
    </Modal>
  )
}
