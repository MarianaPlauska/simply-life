import { useEffect, useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { formatHourPt, formatMinutesPt, maskMedTime, type SequenceStep } from '@simply-life/shared'
import { Icon } from '../../ui/Icon'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

export type EditableStep = SequenceStep & { id: string }

function parseHour(masked: string): number | null
{
  const match = /^(\d{2}):(\d{2})$/.exec(masked)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function TimeCell({ value, onCommit }: { value: number; onCommit: (minutes: number) => void })
{
  const { colors } = useTheme()
  const [text, setText] = useState(formatHourPt(value))

  useEffect(() =>
  {
    setText(formatHourPt(value))
  }, [value])

  return (
    <TextInput
      value={text}
      keyboardType="number-pad"
      inputMode="numeric"
      maxLength={5}
      accessibilityLabel="Horário"
      onChangeText={(raw) =>
      {
        const next = maskMedTime(raw)
        setText(next)
        const minutes = parseHour(next)
        if (minutes != null) onCommit(minutes)
      }}
      placeholderTextColor={colors.inkMuted}
      style={{
        width: 52,
        fontSize: 14,
        lineHeight: 20,
        fontFamily: 'Lexend_500Medium',
        color: colors.inkMuted,
        padding: 0,
      }}
    />
  )
}

/** Linhas do plano sugerido: horário, texto e tirar, antes de confirmar. */
export function TomorrowPlanEditor({
  rows,
  onTime,
  onLabel,
  onRemove,
}: {
  rows: EditableStep[]
  onTime: (id: string, minutes: number) => void
  onLabel: (id: string, label: string) => void
  onRemove: (id: string) => void
})
{
  const { colors } = useTheme()
  if (!rows.length) return null

  return (
    <View style={{ gap: 8 }}>
      <Text variant="caption" muted>Um jeito de encaixar o dia (horários são sugestão)</Text>
      {rows.map((row) => (
        <View key={row.id} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TimeCell value={row.inicio} onCommit={(minutes) => onTime(row.id, minutes)} />
          <Icon
            name={row.kind === 'pausa' ? 'cafe-outline' : row.kind === 'cuidado' ? 'heart-outline' : row.kind === 'compromisso' ? 'time-outline' : 'ellipse-outline'}
            size={14}
            color={row.kind === 'tarefa' ? colors.axel : colors.inkMuted}
          />
          <TextInput
            value={row.label}
            onChangeText={(text) => onLabel(row.id, text)}
            accessibilityLabel="O que fazer"
            placeholderTextColor={colors.inkMuted}
            style={{
              flex: 1,
              fontSize: 14,
              lineHeight: 20,
              fontFamily: 'Lexend_400Regular',
              color: colors.ink,
              padding: 0,
            }}
          />
          <Text variant="caption" muted>{formatMinutesPt(row.minutos)}</Text>
          <Pressable
            onPress={() => onRemove(row.id)}
            accessibilityLabel={`Tirar ${row.label}`}
            hitSlop={10}
            style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="close" size={18} color={colors.inkMuted} />
          </Pressable>
        </View>
      ))}
    </View>
  )
}
