import type { ReactNode } from 'react'

interface ActionFeedbackNumberProps
{
  /** Incrementar após ação direta do usuário para disparar o feedback */
  pulseToken?: number
  className?: string
  children: ReactNode
}

/** Número com fade/escala curta — só quando pulseToken muda por ação do usuário */
export function ActionFeedbackNumber({
  pulseToken = 0,
  className = '',
  children,
}: ActionFeedbackNumberProps)
{
  return (
    <span
      key={pulseToken > 0 ? pulseToken : undefined}
      className={`inline-block tabular-nums ${pulseToken > 0 ? 'sl-action-feedback' : ''} ${className}`.trim()}
    >
      {children}
    </span>
  )
}
