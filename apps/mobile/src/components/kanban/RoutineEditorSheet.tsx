import { useState } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { RoutineCadence } from '@simply-life/shared'
import { Text, Field, PrimaryButton, Chip } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  visible: boolean
  mode: 'habit' | 'routine'
  onClose: () => void
  onSave: (payload: {
    title: string
    cadence: RoutineCadence
    dailyTarget: number
    weeklyTarget: number
  }) => void
}

/** Criar hábito avulso ou rotina-mãe. */
export function RoutineEditorSheet({ visible, mode, onClose, onSave }: Props)
{
  const { colors, space, radius } = useTheme()
  const insets = useSafeAreaInsets()
  const [title, setTitle] = useState('')
  const [cadence, setCadence] = useState<RoutineCadence>('daily')
  const [dailyTarget, setDailyTarget] = useState('1')
  const [weeklyTarget, setWeeklyTarget] = useState('3')

  const reset = () =>
  {
    setTitle('')
    setCadence('daily')
    setDailyTarget('1')
    setWeeklyTarget('3')
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
            {mode === 'routine' ? 'Nova rotina' : 'Novo hábito'}
          </Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={{ gap: space.md }}>
              <Field
                label="Nome"
                value={title}
                onChangeText={setTitle}
                placeholder={mode === 'routine' ? 'Bem-estar, manhã, trabalho…' : 'Meditar, ler, caminhar…'}
              />
              {mode === 'habit' ? (
                <>
                  <Text variant="caption" muted>
                    Frequência
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Chip
                      label="Todo dia"
                      active={cadence === 'daily'}
                      onPress={() => setCadence('daily')}
                    />
                    <Chip
                      label="Na semana"
                      active={cadence === 'weekly'}
                      onPress={() => setCadence('weekly')}
                    />
                  </View>
                  {cadence === 'daily' ? (
                    <Field
                      label="Vezes por dia"
                      value={dailyTarget}
                      onChangeText={setDailyTarget}
                      keyboardType="number-pad"
                      placeholder="1"
                    />
                  ) : (
                    <Field
                      label="Dias por semana"
                      value={weeklyTarget}
                      onChangeText={setWeeklyTarget}
                      keyboardType="number-pad"
                      placeholder="3"
                    />
                  )}
                </>
              ) : (
                <Text variant="caption" muted>
                  Depois você encaixa os hábitos dentro. Marcar a rotina completa todos de uma vez.
                </Text>
              )}
              <PrimaryButton
                label="Salvar"
                disabled={!title.trim()}
                onPress={() =>
                {
                  onSave({
                    title: title.trim(),
                    cadence,
                    dailyTarget: Math.max(1, Number(dailyTarget) || 1),
                    weeklyTarget: Math.max(1, Math.min(7, Number(weeklyTarget) || 3)),
                  })
                  reset()
                  onClose()
                }}
              />
              <PrimaryButton label="Cancelar" variant="ghost" onPress={onClose} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
