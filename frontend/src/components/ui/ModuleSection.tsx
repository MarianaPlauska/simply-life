import type { ReactNode } from 'react'
import { MODULE_STRIP } from '../../constants/axelSurfaces'

export type ModuleTone = 'finance' | 'health' | 'tasks'

interface ModuleSectionProps
{
  tone: ModuleTone
  label: string
  children: ReactNode
  className?: string
}

/** Seção de dado: faixa do módulo + kicker; sem caixa extra */
export function ModuleSection({ tone, label, children, className = '' }: ModuleSectionProps)
{
  return (
    <section className={`${MODULE_STRIP[tone]} ${className}`.trim()}>
      <p className="sl-section-label">{label}</p>
      <div className="mt-2">{children}</div>
    </section>
  )
}
