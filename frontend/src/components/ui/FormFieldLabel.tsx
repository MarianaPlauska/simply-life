import type { ReactNode } from 'react'

interface FormFieldLabelProps
{
  children: ReactNode
  required?: boolean
  optional?: boolean
  className?: string
}

/** Rótulo de campo — asterisco em obrigatórios */
export function FormFieldLabel({
  children,
  required = false,
  optional = false,
  className = 'font-mono text-[9px] uppercase text-ink-muted',
}: FormFieldLabelProps)
{
  return (
    <span className={className}>
      {children}
      {required && <span className="text-urgente ml-0.5" aria-hidden>*</span>}
      {optional && !required && (
        <span className="text-ink-muted/70 normal-case ml-1">(opcional)</span>
      )}
    </span>
  )
}
