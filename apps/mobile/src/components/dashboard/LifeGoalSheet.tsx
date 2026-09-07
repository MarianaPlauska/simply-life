import { useState } from 'react'
import { Modal, Pressable, View } from 'react-native'
import {
  LIFE_GOAL_TEMPLATES,
  lifeGoalMicroLabel,
  lifeGoalNeedsRefresh,
  localTodayIso,
  type LifeGoal,
  type LifeGoalCadence,
  type LifeGoalCategory,
} from '@simply-life/shared'
import { Card, Text, Field, PrimaryButton, Chip } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { usePrefsStore } from '../../store/prefsStore'

type Props = {
  visible: boolean
  onClose: () => void
}

/** Definir ou renovar meta semanal/mensal. */
export function LifeGoalSheet({ visible, onClose }: Props)
{
  const { colors, space } = useTheme()
  const prefs = usePrefsStore((s) => s.prefs)
  const patch = usePrefsStore((s) => s.patch)
  const existing = prefs.life_goal
  const [category, setCategory] = useState<LifeGoalCategory>(existing?.category ?? 'custom')
  const [title, setTitle] = useState(existing?.title ?? '')
  const [cadence, setCadence] = useState<LifeGoalCadence>(existing?.cadence ?? 'week')
  const [saving, setSaving] = useState(false)

  const template = LIFE_GOAL_TEMPLATES.find((t) => t.id === category)

  const onSave = async () =>
  {
    const trimmed = title.trim() || template?.example || 'Minha meta'
    setSaving(true)
    const goal: LifeGoal = {
      title: trimmed,
      category,
      cadence,
      periodStart: localTodayIso(),
    }
    await patch({ life_goal: goal })
    setSaving(false)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Card
            tone="elevated"
            style={{
              gap: space.md,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: space.xl,
            }}
          >
            <Text variant="section">Sua meta</Text>
            <Text variant="caption" muted>
              Semanal renova todo domingo; mensal, no próximo mês. Você escolhe o foco.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {LIFE_GOAL_TEMPLATES.map((t) => (
                <Chip
                  key={t.id}
                  label={t.label}
                  active={category === t.id}
                  onPress={() =>
                  {
                    setCategory(t.id)
                    if (!title.trim()) setTitle(t.example)
                  }}
                />
              ))}
            </View>
            <Field
              label="Descrição"
              placeholder={template?.example ?? 'O que você quer alcançar?'}
              value={title}
              onChangeText={setTitle}
              multiline
              style={{ minHeight: 72, textAlignVertical: 'top', paddingTop: 14 }}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip
                label="Semana"
                active={cadence === 'week'}
                onPress={() => setCadence('week')}
              />
              <Chip
                label="Mês"
                active={cadence === 'month'}
                onPress={() => setCadence('month')}
              />
            </View>
            <PrimaryButton
              label="Salvar meta"
              loading={saving}
              disabled={!title.trim() && !template?.example}
              onPress={() => void onSave()}
            />
            <PrimaryButton label="Cancelar" variant="ghost" onPress={onClose} />
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

/** Linha compacta na área de progresso — sem alterar layout. */
export function LifeGoalMicroLine({ onPress }: { onPress: () => void })
{
  const { colors } = useTheme()
  const goal = usePrefsStore((s) => s.prefs.life_goal)
  const needs = lifeGoalNeedsRefresh(goal)
  const label = lifeGoalMicroLabel(goal)

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Abre a definição da sua meta"
      hitSlop={6}
    >
      <Text
        variant="micro"
        style={{
          color: needs ? colors.axel : colors.widgetMuted,
          maxWidth: 220,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  )
}
