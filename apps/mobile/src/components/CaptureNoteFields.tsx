import { useMemo } from 'react'
import { View } from 'react-native'
import { localTodayIso } from '@simply-life/shared'
import { Field, Text } from '../ui'
import { useTheme } from '../theme/ThemeProvider'

const DAILY_NUDGES = [
  'O que você quer lembrar deste dia?',
  'O que te deu energia hoje?',
  'O que você faria diferente amanhã?',
  'Quem ou o que te apoiou hoje?',
  'O que você aprendeu sobre si?',
  'O que merece ser celebrado, mesmo pequeno?',
  'O que está pedindo atenção na sua cabeça?',
]

function dailyNudge(): string
{
  const start = new Date(`${localTodayIso()}T12:00:00`)
  const dayOfYear = Math.floor(
    (start.getTime() - new Date(start.getFullYear(), 0, 0).getTime()) / 86400000,
  )
  return DAILY_NUDGES[dayOfYear % DAILY_NUDGES.length]
}

type Props = {
  text: string
  onTextChange: (value: string) => void
}

/** Campos de diário na captura rápida. */
export function CaptureNoteFields({ text, onTextChange }: Props)
{
  const { colors, space, radius } = useTheme()
  const nudge = useMemo(() => dailyNudge(), [])

  return (
    <View style={{ gap: space.md }}>
      <View
        style={{
          padding: 12,
          borderRadius: radius.control,
          backgroundColor: colors.axelMuted,
          gap: 4,
        }}
      >
        <Text variant="caption" color={colors.axel} style={{ fontWeight: '700' }}>
          Diário
        </Text>
        <Text variant="micro" muted>
          {nudge}
        </Text>
      </View>

      <Field
        label="Entrada do dia (opcional)"
        placeholder="Como foi seu dia? Escreva se quiser."
        multiline
        value={text}
        onChangeText={onTextChange}
        style={{
          minHeight: 160,
          textAlignVertical: 'top',
          paddingTop: 14,
        }}
      />
    </View>
  )
}
