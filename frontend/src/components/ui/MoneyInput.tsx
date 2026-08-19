import type { ChangeEvent, KeyboardEvent } from 'react'
import { applyMoneyDigit, formatCentsToBrl, normalizeMoneyBlur } from '../../lib/currencyInput'
import { AXEL_FIELD_INPUT } from '../../constants/axelSurfaces'

interface MoneyInputProps
{
  value: string
  onChange: (display: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

/** Campo BRL — digitação centavos → reais (ex.: 3 → 0,03 · 30 → 0,30 · 3000 → 30,00) */
export function MoneyInput({
  value,
  onChange,
  placeholder = '0,00',
  disabled = false,
  className = '',
  id,
}: MoneyInputProps)
{
  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
  {
    const raw = e.target.value
    const prev = value
    if (raw.length < prev.length)
    {
      onChange(applyMoneyDigit(prev, 'Backspace'))
      return
    }
    const added = raw.slice(prev.length)
    onChange(applyMoneyDigit(prev, added))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) =>
  {
    if (e.key === 'Backspace')
    {
      e.preventDefault()
      onChange(applyMoneyDigit(value, 'Backspace'))
    }
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      disabled={disabled}
      placeholder={placeholder}
      value={value || ''}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={() => onChange(normalizeMoneyBlur(value))}
      onFocus={() =>
      {
        if (!value)
        {
          onChange(formatCentsToBrl(0))
        }
      }}
      className={`${AXEL_FIELD_INPUT} font-mono ${className}`}
    />
  )
}
