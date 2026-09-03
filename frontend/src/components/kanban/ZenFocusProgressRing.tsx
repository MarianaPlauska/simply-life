import type { ReactNode } from 'react'

// Anel de progresso sutil - sem segundos, avanço lento

interface ZenFocusProgressRingProps
{
  progress: number
  size?: number
  children: ReactNode
}

export function ZenFocusProgressRing({
  progress,
  size = 128,
  children,
}: ZenFocusProgressRingProps)
{
  const r = (size / 2) - 8
  const cx = size / 2
  const circumference = 2 * Math.PI * r
  const clamped = Math.min(1, Math.max(0, progress))
  const offset = circumference * (1 - clamped)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="absolute inset-0 -rotate-90"
        aria-hidden
      >
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          strokeWidth="2"
          className="stroke-line"
        />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="stroke-accent transition-[stroke-dashoffset] duration-[2000ms] ease-out"
        />
      </svg>
      <div className="relative z-10 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}
