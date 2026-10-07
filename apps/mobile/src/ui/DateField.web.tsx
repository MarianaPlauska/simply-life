import { useEffect, useState } from 'react'
import { brDateFromIso, isoFromBrDate, maskBrDate } from '@simply-life/shared'
import { Field } from './Field'

type Props = {
  label: string
  value: string
  min?: string
  onChange: (iso: string) => void
  tone?: 'default' | 'sand' | 'widget'
}

/**
 * Campo de data na web: DD/MM/AAAA digitado, com as barras entrando sozinhas.
 * Data incompleta ou que não existe devolve '' (quem usa decide a mensagem).
 */
export function DateField({ label, value, onChange, tone = 'default' }: Props)
{
  const [text, setText] = useState(brDateFromIso(value))
  // um atalho (ex.: "Em 7 dias") trocou o dia: o campo acompanha
  useEffect(() =>
  {
    if (value && isoFromBrDate(text) !== value) setText(brDateFromIso(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <Field
      tone={tone}
      label={`${label} (DD/MM/AAAA)`}
      placeholder="DD/MM/AAAA"
      value={text}
      keyboardType="number-pad"
      maxLength={10}
      onChangeText={(v) =>
      {
        const masked = maskBrDate(v)
        setText(masked)
        onChange(isoFromBrDate(masked) ?? '')
      }}
    />
  )
}
