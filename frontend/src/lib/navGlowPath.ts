/** Linha na base da barra - arco baixo, não sobe até o rótulo. viewBox 0 0 100 12 */

export function navGlowPath(centerPct: number): string
{
  const y = 9
  const c = Math.min(90, Math.max(10, centerPct))
  const half = 8
  const l = c - half
  const r = c + half
  const peak = 3.2

  return [
    `M 0 ${y}`,
    `L ${l} ${y}`,
    `C ${l + 2.5} ${y}, ${c - 3.5} ${peak}, ${c} ${peak}`,
    `C ${c + 3.5} ${peak}, ${r - 2.5} ${y}, ${r} ${y}`,
    `L 100 ${y}`,
  ].join(' ')
}

export function navSlotCenterPct(activeIndex: number, slotCount: number): number
{
  if (slotCount <= 0)
  {
    return 50
  }
  const i = Math.min(Math.max(0, activeIndex), slotCount - 1)
  return ((i + 0.5) / slotCount) * 100
}
