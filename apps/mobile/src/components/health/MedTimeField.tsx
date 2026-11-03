import { maskMedTime } from '@simply-life/shared'
import { Field } from '../../ui'

/** Hora só com números. Os dois pontos entram sozinhos. */
export function MedTimeField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (next: string) => void
})
{
  return (
    <Field
      label={label}
      value={value}
      onChangeText={(text) => onChange(maskMedTime(text))}
      placeholder="08:00"
      keyboardType="number-pad"
      inputMode="numeric"
      maxLength={5}
    />
  )
}
