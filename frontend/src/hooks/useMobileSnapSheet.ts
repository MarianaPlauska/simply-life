import { useCallback, useEffect, useRef, useState } from 'react'

export type MobileSheetSnap = 'peek' | 'expanded'

const PEEK_VH = 42
const EXPANDED_VH = 88
const NAV_OFFSET_REM = 4.25
const DRAG_CLOSE_PX = 120

interface UseMobileSnapSheetOptions
{
  open: boolean
  onClose: () => void
  enabled?: boolean
}

interface UseMobileSnapSheetResult
{
  snap: MobileSheetSnap
  sheetStyle: React.CSSProperties
  isDragging: boolean
  expand: () => void
  collapse: () => void
  handleProps: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
    onPointerDown: (e: React.PointerEvent) => void
    onPointerMove: (e: React.PointerEvent) => void
    onPointerUp: () => void
    onPointerCancel: () => void
  }
}

export function useMobileSnapSheet({
  open,
  onClose,
  enabled = true,
}: UseMobileSnapSheetOptions): UseMobileSnapSheetResult
{
  const [snap, setSnap] = useState<MobileSheetSnap>('peek')
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(0)
  const snapAtDragStart = useRef<MobileSheetSnap>('peek')
  const activePointer = useRef<number | null>(null)

  useEffect(() =>
  {
    if (open)
    {
      setSnap('peek')
      setDragOffset(0)
    }
  }, [open])

  const expand = useCallback(() => setSnap('expanded'), [])
  const collapse = useCallback(() => setSnap('peek'), [])

  const beginDrag = (clientY: number) =>
  {
    dragStartY.current = clientY
    snapAtDragStart.current = snap
    setIsDragging(true)
  }

  const moveDrag = (clientY: number) =>
  {
    const delta = clientY - dragStartY.current
    setDragOffset(delta)
  }

  const endDrag = () =>
  {
    setIsDragging(false)
    const delta = dragOffset

    if (delta > DRAG_CLOSE_PX)
    {
      onClose()
      setDragOffset(0)
      return
    }

    if (delta > 48)
    {
      setSnap('peek')
    }
    else if (delta < -48)
    {
      setSnap('expanded')
    }
    else
    {
      setSnap(snapAtDragStart.current)
    }

    setDragOffset(0)
  }

  const onTouchStart = (e: React.TouchEvent) =>
  {
    if (!enabled) return
    beginDrag(e.touches[0].clientY)
  }

  const onTouchMove = (e: React.TouchEvent) =>
  {
    if (!enabled || !isDragging) return
    moveDrag(e.touches[0].clientY)
  }

  const onTouchEnd = () =>
  {
    if (!enabled) return
    endDrag()
  }

  const onPointerDown = (e: React.PointerEvent) =>
  {
    if (!enabled) return
    activePointer.current = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId)
    beginDrag(e.clientY)
  }

  const onPointerMove = (e: React.PointerEvent) =>
  {
    if (!enabled || activePointer.current !== e.pointerId) return
    moveDrag(e.clientY)
  }

  const onPointerUp = () =>
  {
    if (!enabled) return
    activePointer.current = null
    endDrag()
  }

  const onPointerCancel = () =>
  {
    activePointer.current = null
    setIsDragging(false)
    setDragOffset(0)
  }

  const baseVh = snap === 'expanded' ? EXPANDED_VH : PEEK_VH
  const sheetStyle: React.CSSProperties = enabled
    ? {
        height: `min(${baseVh}dvh, calc(100dvh - ${NAV_OFFSET_REM}rem - env(safe-area-inset-bottom, 0px)))`,
        transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
        transition: isDragging ? 'none' : 'height 0.28s ease-out, transform 0.28s ease-out',
      }
    : {}

  return {
    snap,
    sheetStyle,
    isDragging,
    expand,
    collapse,
    handleProps: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  }
}
