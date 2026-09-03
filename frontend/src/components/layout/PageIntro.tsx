import type { ReactNode } from 'react'

interface PageIntroProps
{
  title: string
  /** Meta curta na mesma linha do título (ex.: ritual 2/3) */
  meta?: ReactNode
  /** Subtítulo - evitar quando a mesma info já está em meta/actions */
  lede?: string
  actions?: ReactNode
  /** Abas ou sub-nav - segunda faixa compacta */
  subNav?: ReactNode
}

/** Cabeçalho de página - no máximo título + controles + abas */
export function PageIntro({ title, meta, lede, actions, subNav }: PageIntroProps)
{
  return (
    <header className={subNav ? 'space-y-1' : undefined}>
      <div className="flex items-center justify-between gap-2 min-h-11">
        <div className="min-w-0 flex items-baseline gap-2 flex-wrap">
          <h1 className="sl-page-title shrink-0">{title}</h1>
          {meta && (
            <span className="text-[13px] text-ink-muted truncate max-w-[14rem] sm:max-w-none">
              {meta}
            </span>
          )}
        </div>
        {actions && (
          <div className="shrink-0 flex items-center gap-1">
            {actions}
          </div>
        )}
      </div>
      {lede && (
        <p className="sl-page-lede -mt-0.5">{lede}</p>
      )}
      {subNav}
    </header>
  )
}
