import { useEffect, useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { Icon } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { hapticLight } from '../../../lib/haptics'

type Props = {
  value: number
  step: number
  min?: number
  max?: number
  decimals?: boolean
  label: string
  width?: number
  onChange: (next: number) => void
}

function fmt(n: number): string
{
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',')
}

/** Menos, valor e mais, compacto; o número também aceita digitação. */
export function WorkoutStepper({ value, step, min = 0, max = 9999, decimals, label, width = 46, onChange }: Props)
{
  const { colors, radius, type } = useTheme()
  const [draft, setDraft] = useState(fmt(value))

  useEffect(() =>
  {
    setDraft(fmt(value))
  }, [value])

  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n * 10) / 10))
  const bump = (dir: 1 | -1) =>
  {
    hapticLight()
    onChange(clamp(value + dir * step))
  }

  const commit = () =>
  {
    const n = Number(draft.replace(',', '.'))
    if (Number.isFinite(n)) onChange(clamp(decimals ? n : Math.round(n)))
    else setDraft(fmt(value))
  }

  const btn = (dir: 1 | -1) => (
    <Pressable
      onPress={() => bump(dir)}
      accessibilityRole="button"
      accessibilityLabel={`${dir > 0 ? 'Aumentar' : 'Diminuir'} ${label}`}
      hitSlop={4}
      style={({ pressed }) => ({
        width: 30,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon name={dir > 0 ? 'add' : 'remove'} size={16} color={colors.inkMuted} />
    </Pressable>
  )

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: radius.control,
        backgroundColor: colors.canvas,
      }}
    >
      {btn(-1)}
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onBlur={commit}
        onSubmitEditing={commit}
        selectTextOnFocus
        keyboardType={decimals ? 'decimal-pad' : 'number-pad'}
        accessibilityLabel={label}
        style={{
          width,
          textAlign: 'center',
          color: colors.ink,
          fontFamily: 'Lexend_600SemiBold',
          fontSize: type.bodyStrong.size,
          paddingVertical: 8,
        }}
      />
      {btn(1)}
    </View>
  )
}
