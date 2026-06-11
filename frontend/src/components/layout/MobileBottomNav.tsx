import { Home, KanbanSquare, Wallet, Heart } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AXEL_CHROME_PLANE } from '../../constants/axelSurfaces'

// Navegação de bolso — visível só no mobile (md:hidden no App)

interface NavItem
{
  path: string
  label: string
  icon: React.ElementType
  isActive: (pathname: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    path: '/',
    label: 'Home',
    icon: Home,
    isActive: (pathname) => pathname === '/',
  },
  {
    path: '/kanban',
    label: 'Kanban',
    icon: KanbanSquare,
    isActive: (pathname) => pathname.startsWith('/kanban'),
  },
  {
    path: '/financeiro',
    label: 'Finanças',
    icon: Wallet,
    isActive: (pathname) => pathname.startsWith('/financeiro'),
  },
  {
    path: '/saude',
    label: 'Saúde',
    icon: Heart,
    isActive: (pathname) => pathname.startsWith('/saude'),
  },
]

export function MobileBottomNav()
{
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav
      aria-label="Navegação principal"
      className={`fixed bottom-0 inset-x-0 z-50 flex md:hidden items-center justify-around border-t border-line pb-[env(safe-area-inset-bottom,0px)] ${AXEL_CHROME_PLANE}`}
    >
      {NAV_ITEMS.map(({ path, label, icon: Icon, isActive }) =>
      {
        const active = isActive(location.pathname)

        return (
          <button
            key={path}
            type="button"
            onClick={() => navigate(path)}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-3 min-h-[56px] transition-colors border-t-2 ${
              active
                ? 'text-accent border-accent -mt-px'
                : 'text-ink-muted border-transparent hover:text-ink'
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
