import { useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { brDateFromIso } from '@simply-life/shared'
import { Text } from './Text'
import { Icon } from './Icon'
import { useTheme } from '../theme/ThemeProvider'
import { useRipple } from './ripple'

type Props = {
  label: string
  /** dia escolhido (AAAA-MM-DD) ou vazio */
  value: string
  /** menor dia aceito (AAAA-MM-DD) */
  min?: string
  onChange: (iso: string) => void
  /** mesmos tons do Field: sand = papel do studio · widget = painel escuro da Saúde/Home */
  tone?: 'default' | 'sand' | 'widget'
}

function fromIso(iso: string): Date
{
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

function toIso(d: Date): string
{
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Campo de data no celular: abre o calendário do próprio sistema (Android: janela do
 * sistema; iPhone: calendário logo abaixo). Na web há DateField.web.tsx com DD/MM/AAAA digitado.
 */
export function DateField({ label, value, min, onChange, tone = 'default' }: Props)
{
  const { colors } = useTheme()
  const ripple = useRipple()
  const [iosOpen, setIosOpen] = useState(false)
  const current = value ? fromIso(value) : min ? fromIso(min) : new Date()
  const minimumDate = min ? fromIso(min) : undefined

  const handle = (e: DateTimePickerEvent, d?: Date) =>
  {
    if (e.type === 'set' && d) onChange(toIso(d))
  }

  const open = () =>
  {
    if (Platform.OS === 'android')
    {
      DateTimePickerAndroid.open({ value: current, minimumDate, mode: 'date', onChange: handle })
      return
    }
    setIosOpen((v) => !v)
  }

  return (
    <View style={{ gap: 6 }}>
      <Text variant="label" color={tone === 'widget' ? colors.featureMuted : colors.inkMuted}>
        {label}
      </Text>
      <Pressable
        onPress={open}
        android_ripple={ripple}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? brDateFromIso(value) : 'escolher'}`}
        style={{
          minHeight: 52,
          borderRadius: 10,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          overflow: 'hidden',
          backgroundColor: tone === 'widget' ? colors.canvas : tone === 'sand' ? colors.hairline : colors.elevated,
        }}
      >
        <Icon name="calendar" size={18} color={colors.inkMuted} />
        <Text variant="body" style={{ flex: 1, color: value ? (tone === 'widget' ? colors.featureInk : colors.ink) : colors.inkFaint }}>
          {value ? brDateFromIso(value) : 'Escolher o dia'}
        </Text>
      </Pressable>
      {Platform.OS === 'ios' && iosOpen ? (
        <DateTimePicker
          value={current}
          minimumDate={minimumDate}
          mode="date"
          display="inline"
          locale="pt-BR"
          accentColor={colors.axelFill}
          onChange={(e, d) =>
          {
            handle(e, d)
            setIosOpen(false)
          }}
        />
      ) : null}
    </View>
  )
}
