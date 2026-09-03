import { Sparkles } from 'lucide-react'

interface AxelLoaderProps
{
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const WRAPPER_CLASS: Record<NonNullable<AxelLoaderProps['size']>, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

const ICON_SIZE: Record<NonNullable<AxelLoaderProps['size']>, number> = {
  sm: 14,
  md: 18,
  lg: 22,
}

/** Loader AXEL - sparkles com respiração suave */
export function AxelLoader({ size = 'md', className = '' }: AxelLoaderProps)
{
  return (
    <div
      role="status"
      aria-label="Carregando"
      className={[
        'relative inline-flex items-center justify-center',
        WRAPPER_CLASS[size],
        className,
      ].join(' ')}
    >
      <span
        className="absolute inset-0 rounded-sl border border-accent/25 axel-loader-ring"
        aria-hidden
      />
      <Sparkles
        size={ICON_SIZE[size]}
        className="relative text-accent axel-loader-spark"
        strokeWidth={2}
        aria-hidden
      />
    </div>
  )
}
