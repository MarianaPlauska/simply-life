import type { LucideIcon } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_GLASS_CHROME, AXEL_TOUCH_PRESS } from '../../constants/axelSurfaces'
import { resolveMobileNavItems } from '../../lib/mobileBottomNav'
import { CapturePlusButton } from '../capture/CapturePlusButton'

// Navegação de bolso. O + no centro é a captura rápida.

export function MobileBottomNav()
{
  const location = useLocation()
  const navigate = useNavigate()
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)

  const navItems = resolveMobileNavItems(
    workspacePrefs.mobile_bottom_nav,
    workspacePrefs.dashboard_priority,
  )

  const mid = Math.ceil(navItems.length / 2)
  const left = navItems.slice(0, mid)
  const right = navItems.slice(mid)

  return (
    <nav
      aria-label="Navegação principal"
      className={`sl-glass-chrome fixed bottom-0 inset-x-0 z-50 flex md:hidden items-end justify-around border-t pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] ${AXEL_GLASS_CHROME}`}
    >
      {left.map((item) => (
        <NavItem
          key={item.path}
          label={item.label}
          icon={item.icon}
          active={item.isActive(location.pathname)}
          onClick={() => navigate(item.path)}
        />
      ))}
      <CapturePlusButton placement="nav" />
      {right.map((item) => (
        <NavItem
          key={item.path}
          label={item.label}
          icon={item.icon}
          active={item.isActive(location.pathname)}
          onClick={() => navigate(item.path)}
        />
      ))}
    </nav>
  )
}

function NavItem({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: LucideIcon
  active: boolean
  onClick: () => void
})
{
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      aria-label={label}
      className={`sl-touch flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 min-h-[48px] border-t-2 ${AXEL_TOUCH_PRESS} ${
        active
          ? 'text-ink font-semibold border-ink -mt-px'
          : 'text-ink-muted border-transparent hover:text-ink hover:opacity-90'
      }`}
    >
      <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" strokeWidth={active ? 2 : 1.5} />
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
  )
}
