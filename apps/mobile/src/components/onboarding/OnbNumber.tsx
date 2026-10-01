import { View } from 'react-native'
import { Text, PressableScale, Icon } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  min: number
  max: number
  /** Como mostrar o número (ex.: "8 copos", "7h30") */
  format?: (v: number) => string
}

/** Número com menos e mais: sem teclado, bom para metas. */
export function OnbNumber({ label, value, onChange, step = 1, min, max, format }: Props)
{
  const { colors, space } = useTheme()
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 100) / 100))

  const btn = (icon: 'remove' | 'add', delta: number, disabled: boolean) => (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${icon === 'add' ? 'Aumentar' : 'Diminuir'} ${label}`}
      disabled={disabled}
      onPress={() => onChange(clamp(value + delta))}
      style={{
        width: 44,
        height: 44,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.elevated,
        borderWidth: 1,
        borderColor: colors.hairline,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Icon name={icon} size={18} color={colors.ink} />
    </PressableScale>
  )

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <Text variant="body" style={{ flex: 1 }}>
        {label}
      </Text>
      {btn('remove', -step, value <= min)}
      <Text variant="bodyStrong" style={{ minWidth: 76, textAlign: 'center', fontVariant: ['tabular-nums'] }}>
        {format ? format(value) : String(value)}
      </Text>
      {btn('add', step, value >= max)}
    </View>
  )
}
