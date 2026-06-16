import { useEffect, useRef, useState } from 'react'
import { Pin, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { PINNABLE_VIEWS, MAX_PINNED_MODULES } from '../../store/slices/uiSlice'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

// Editor de atalhos fixos no header (máx. 4 páginas)

export function PinnedNavEditor()
{
  const pinnedModules = useTaskStore((s) => s.pinnedModules)
  const togglePin = useTaskStore((s) => s.togglePin)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() =>
  {
    function handleClickOutside(e: MouseEvent)
    {
      if (ref.current && !ref.current.contains(e.target as Node))
      {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleToggle = (id: string) =>
  {
    const has = pinnedModules.includes(id)
    if (!has && pinnedModules.length >= MAX_PINNED_MODULES)
    {
      toast.message(`Máximo de ${MAX_PINNED_MODULES} páginas fixas`, {
        description: 'Desfixe uma para adicionar outra.',
      })
      return
    }
    togglePin(id)
  }

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-sl border border-line bg-chrome hover:bg-elevated text-ink-muted hover:text-ink transition-colors"
        aria-label="Fixar páginas no topo"
        aria-expanded={open}
        title="Fixar até 4 páginas principais"
      >
        <Pin className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-56 rounded-sl border border-line bg-card shadow-xl z-[120] overflow-hidden">
          <div className="px-3 py-2 border-b border-line">
            <p className={`text-[12px] font-medium ${AXEL_TEXT_PRIMARY}`}>Páginas fixas</p>
            <p className={`text-[10px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
              {pinnedModules.length}/{MAX_PINNED_MODULES} no topo
            </p>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {PINNABLE_VIEWS.map(({ id, label }) =>
            {
              const pinned = pinnedModules.includes(id)
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => handleToggle(id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-[12px] hover:bg-chrome transition-colors ${
                      pinned ? AXEL_TEXT_PRIMARY : AXEL_TEXT_SECONDARY
                    }`}
                  >
                    <span>{label}</span>
                    {pinned && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
