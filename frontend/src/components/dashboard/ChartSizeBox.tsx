import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

interface ChartSizeBoxProps
{
  className?: string
  minHeight?: number
  children: (width: number, height: number) => ReactNode
}

/** Só monta gráfico Recharts quando o container tem tamanho real (>0) */
export function ChartSizeBox({ className = '', minHeight = 140, children }: ChartSizeBoxProps)
{
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useLayoutEffect(() =>
  {
    const el = ref.current
    if (!el) return

    const measure = () =>
    {
      const rect = el.getBoundingClientRect()
      const w = Math.floor(rect.width)
      const h = Math.max(minHeight, Math.floor(rect.height))
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }))
    }

    measure()
    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    return () => ro.disconnect()
  }, [minHeight])

  return (
    <div ref={ref} className={`min-w-0 w-full ${className}`} style={{ minHeight }}>
      {size.w > 0 && size.h > 0 ? children(size.w, size.h) : null}
    </div>
  )
}
