import { useId } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_TOUCH_PRESS } from '../../constants/axelSurfaces'
import { resolveMobileNavItems } from '../../lib/mobileBottomNav'
import { navGlowPath, navSlotCenterPct } from '../../lib/navGlowPath'
import { CapturePlusButton } from '../capture/CapturePlusButton'

export function MobileBottomNav()
{
  const location = useLocation()
  const navigate = useNavigate()
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)
  const reduceMotion = useReducedMotion()
  const glowId = useId().replace(/:/g, '')

  const navItems = resolveMobileNavItems(
    workspacePrefs.mobile_bottom_nav,
    workspacePrefs.dashboard_priority,
  )

  const mid = Math.ceil(navItems.length / 2)
  const left = navItems.slice(0, mid)
  const right = navItems.slice(mid)
  const slotCount = left.length + 1 + right.length

  const activeNavIndex = navItems.findIndex((item) => item.isActive(location.pathname))
  const activeSlot =
    activeNavIndex < 0
      ? 0
      : activeNavIndex < mid
        ? activeNavIndex
        : activeNavIndex + 1

  const centerPct = navSlotCenterPct(activeSlot, slotCount)
  const path = navGlowPath(centerPct)

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-chrome border-t border-line"
    >
      <div className="flex items-center justify-around px-1 pt-1">
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
      </div>

      <div className="relative h-2.5 overflow-hidden" aria-hidden="true">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 12"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id={glowId} x="-8%" y="-40%" width="116%" height="180%">
              <feGaussianBlur stdDeviation="0.55" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <motion.path
            d={path}
            fill="none"
            stroke="var(--sl-axel)"
            strokeWidth="1.5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            filter={`url(#${glowId})`}
            initial={false}
            animate={{ d: path }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 320, damping: 30 }
            }
          />
        </svg>
      </div>

      <div className="h-[env(safe-area-inset-bottom,0px)] bg-chrome" />
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
      className={`sl-touch flex flex-col items-center justify-center gap-0.5 flex-1 min-h-11 py-1 ${AXEL_TOUCH_PRESS} ${
        active ? 'text-ink font-semibold' : 'text-ink-muted hover:text-ink'
      }`}
    >
      <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2 : 1.5} />
      <span className="text-[10px] font-medium tracking-wide leading-tight">{label}</span>
      <span className="h-1.5 flex items-center justify-center" aria-hidden="true">
        {active && (
          <span className="w-1 h-1 rounded-full bg-axel" />
        )}
      </span>
    </button>
  )
}
