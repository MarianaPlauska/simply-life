import { FinanceCategoryIcon } from '../financeCategoryIcons'

type CategoryIconSize = 'sm' | 'md' | 'lg'

const SIZE: Record<CategoryIconSize, { box: string; icon: string }> = {
  sm: { box: 'w-7 h-7', icon: 'w-3.5 h-3.5' },
  md: { box: 'w-8 h-8', icon: 'w-3.5 h-3.5' },
  lg: { box: 'w-9 h-9', icon: 'w-4 h-4' },
}

interface CategoryIconCircleProps
{
  icone: string
  cor?: string
  size?: CategoryIconSize
  className?: string
  /** Receitas usam verde fixo em vez da cor da categoria */
  receita?: boolean
}

/** Ícone de categoria em badge padronizado - Finanças */
export function CategoryIconCircle({
  icone,
  cor,
  size = 'sm',
  className = '',
  receita = false,
}: CategoryIconCircleProps)
{
  const dims = SIZE[size]

  return (
    <div
      className={`${dims.box} rounded-sl flex items-center justify-center border border-line bg-chrome shrink-0 ${className}`}
      style={receita ? undefined : cor ? { color: cor } : undefined}
      aria-hidden
    >
      <FinanceCategoryIcon
        name={icone}
        className={`${dims.icon} ${receita ? 'text-concluido' : ''}`}
      />
    </div>
  )
}
