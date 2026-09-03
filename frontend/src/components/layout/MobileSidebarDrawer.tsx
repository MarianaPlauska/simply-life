import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { NAV_GROUPS } from './Sidebar'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_NAV_PLANE, AXEL_NAV_ACTIVE, AXEL_NAV_IDLE } from '../../constants/axelSurfaces'
import { SimplyLifeMark } from '../brand/SimplyLifeMark'

// Drawer de navegação no mobile - mesma estrutura da sidebar desktop

export function MobileSidebarDrawer()
{
  const navigate = useNavigate()
  const location = useLocation()
  const open = useTaskStore((s) => s.mobileSidebarOpen)
  const setOpen = useTaskStore((s) => s.setMobileSidebarOpen)
  const activeView = useTaskStore((s) => s.activeView)
  const registerInteraction = useTaskStore((s) => s.registerInteraction)

  useEffect(() =>
  {
    if (open)
    {
      document.body.style.overflow = 'hidden'
    }
    else
    {
      document.body.style.overflow = ''
    }
    return () =>
    {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open)
  {
    return null
  }

  const go = (path: string, moduleKey?: string) =>
  {
    navigate(path)
    if (moduleKey) registerInteraction(moduleKey)
    setOpen(false)
  }

  return (
    <div className="fixed inset-0 z-[200] md:hidden" role="dialog" aria-modal="true" aria-label="Menu de navegação">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        aria-label="Fechar menu"
        onClick={() => setOpen(false)}
      />
      <aside className={`absolute inset-y-0 left-0 w-[min(18rem,88vw)] flex flex-col shadow-2xl ${AXEL_NAV_PLANE}`}>
        <div className="h-14 px-4 flex items-center justify-between border-b border-line shrink-0">
          <SimplyLifeMark variant="lockup" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-2 rounded-sl text-ink-muted hover:text-ink hover:bg-chrome"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="px-3 mb-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-muted">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) =>
                {
                  const isActive = activeView === item.id || location.pathname === item.path
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => go(item.path, item.moduleKey)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-sl text-[13px] transition-colors ${
                          isActive ? AXEL_NAV_ACTIVE : AXEL_NAV_IDLE
                        }`}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {item.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </div>
  )
}
