import { useLocation, useNavigate } from 'react-router-dom'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_CHROME_PLANE } from '../../constants/axelSurfaces'
import { resolveMobileNavItems } from '../../lib/mobileBottomNav'

// Navegação de bolso — visível só no mobile (md:hidden no App)

export function MobileBottomNav()
{
  const location = useLocation()
  const navigate = useNavigate()
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)

  const navItems = resolveMobileNavItems(
    workspacePrefs.mobile_bottom_nav,
    workspacePrefs.dashboard_priority,
  )

  return (
    <nav
      aria-label="Navegação principal"
      className={`fixed bottom-0 inset-x-0 z-50 flex md:hidden items-center justify-around border-t border-line pt-1 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] ${AXEL_CHROME_PLANE}`}
    >
      {navItems.map(({ path, label, icon: Icon, isActive }) =>
      {
        const active = isActive(location.pathname)

        return (
          <button
            key={path}
            type="button"
            onClick={() => navigate(path)}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[52px] transition-colors border-t-2 ${
              active
                ? 'text-accent font-semibold border-accent -mt-px'
                : 'text-ink-muted border-transparent hover:text-ink hover:opacity-90'
            }`}
          >
            <Icon className="w-5 h-5" strokeWidth={active ? 2 : 1.5} />
            <span className="font-mono text-[9px] uppercase tracking-wider">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
