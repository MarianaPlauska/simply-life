import type { LucideIcon } from 'lucide-react'
import {
  Home,
  KanbanSquare,
  Wallet,
  Heart,
  CalendarDays,
  StickyNote,
  Calendar,
} from 'lucide-react'
import type { DashboardPriority } from './userWorkspacePrefs'

/** Módulos disponíveis na barra inferior mobile — Home é sempre fixo */
export type MobileNavModuleId =
  | 'home'
  | 'kanban'
  | 'financeiro'
  | 'saude'
  | 'agenda'
  | 'anotacoes'
  | 'calendario'

export const MOBILE_NAV_HOME_ID: MobileNavModuleId = 'home'
export const MAX_MOBILE_NAV_SLOTS = 4
export const MAX_MOBILE_NAV_OPTIONAL = 3
export const MIN_MOBILE_NAV_OPTIONAL = 1

type OptionalMobileNavId = Exclude<MobileNavModuleId, 'home'>

export interface MobileNavModuleDef
{
  id: MobileNavModuleId
  path: string
  label: string
  icon: LucideIcon
  required?: boolean
  isActive: (pathname: string) => boolean
}

const OPTIONAL_MODULES: Record<OptionalMobileNavId, Omit<MobileNavModuleDef, 'id' | 'required'>>
= {
  kanban: {
    path: '/kanban',
    label: 'Kanban',
    icon: KanbanSquare,
    isActive: (pathname) => pathname.startsWith('/kanban'),
  },
  financeiro: {
    path: '/financeiro',
    label: 'Finanças',
    icon: Wallet,
    isActive: (pathname) => pathname.startsWith('/financeiro'),
  },
  saude: {
    path: '/saude',
    label: 'Saúde',
    icon: Heart,
    isActive: (pathname) => pathname.startsWith('/saude'),
  },
  agenda: {
    path: '/superhuman',
    label: 'Agenda',
    icon: CalendarDays,
    isActive: (pathname) => pathname.startsWith('/superhuman'),
  },
  anotacoes: {
    path: '/anotacoes',
    label: 'Notas',
    icon: StickyNote,
    isActive: (pathname) => pathname.startsWith('/anotacoes'),
  },
  calendario: {
    path: '/calendario',
    label: 'Calendário',
    icon: Calendar,
    isActive: (pathname) => pathname.startsWith('/calendario'),
  },
}

export const MOBILE_NAV_OPTIONAL_CATALOG: {
  id: OptionalMobileNavId
  label: string
  hint: string
}[] = [
  { id: 'kanban', label: 'Kanban', hint: 'Tarefas e quadro visual' },
  { id: 'financeiro', label: 'Finanças', hint: 'Gastos, metas e contas' },
  { id: 'saude', label: 'Saúde', hint: 'Hábitos, humor, diário e treino' },
  { id: 'agenda', label: 'Agenda', hint: 'Calendário de foco profundo' },
  { id: 'anotacoes', label: 'Notas', hint: 'Segundo cérebro e ideias' },
  { id: 'calendario', label: 'Calendário', hint: 'Eventos e compromissos' },
]

const HOME_MODULE: MobileNavModuleDef = {
  id: 'home',
  path: '/',
  label: 'Home',
  icon: Home,
  required: true,
  isActive: (pathname) => pathname === '/',
}

const ALL_MODULES: Record<MobileNavModuleId, MobileNavModuleDef> = {
  home: HOME_MODULE,
  kanban: { id: 'kanban', ...OPTIONAL_MODULES.kanban },
  financeiro: { id: 'financeiro', ...OPTIONAL_MODULES.financeiro },
  saude: { id: 'saude', ...OPTIONAL_MODULES.saude },
  agenda: { id: 'agenda', ...OPTIONAL_MODULES.agenda },
  anotacoes: { id: 'anotacoes', ...OPTIONAL_MODULES.anotacoes },
  calendario: { id: 'calendario', ...OPTIONAL_MODULES.calendario },
}

const OPTIONAL_IDS = new Set<OptionalMobileNavId>(
  Object.keys(OPTIONAL_MODULES) as OptionalMobileNavId[],
)

function isOptionalId(id: string): id is OptionalMobileNavId
{
  return OPTIONAL_IDS.has(id as OptionalMobileNavId)
}

/** Preferências antigas usavam academia como atalho separado — agora é aba em Saúde */
function migrateNavModuleId(id: string): MobileNavModuleId | null
{
  if (id === 'home')
  {
    return 'home'
  }
  if (id === 'academia')
  {
    return 'saude'
  }
  if (isOptionalId(id))
  {
    return id
  }
  return null
}

export function defaultMobileNavForPriority(priority: DashboardPriority): MobileNavModuleId[]
{
  if (priority === 'finance')
  {
    return ['home', 'financeiro', 'kanban', 'saude']
  }
  if (priority === 'health')
  {
    return ['home', 'saude', 'kanban', 'financeiro']
  }
  return ['home', 'kanban', 'financeiro', 'saude']
}

export function normalizeMobileNavModules(
  raw: MobileNavModuleId[] | undefined,
  priority: DashboardPriority = 'tasks',
): MobileNavModuleId[]
{
  const source = raw?.length ? raw : defaultMobileNavForPriority(priority)
  const optional = source
    .map((id) => migrateNavModuleId(id))
    .filter((id): id is OptionalMobileNavId => id !== null && id !== 'home')
  const unique = [...new Set(optional)]

  if (unique.length === 0)
  {
    return defaultMobileNavForPriority(priority)
  }

  return ['home', ...unique.slice(0, MAX_MOBILE_NAV_OPTIONAL)]
}

export function resolveMobileNavItems(
  modules: MobileNavModuleId[] | undefined,
  priority: DashboardPriority,
): MobileNavModuleDef[]
{
  return normalizeMobileNavModules(modules, priority).map((id) => ALL_MODULES[id])
}

export function toggleMobileNavModule(
  current: MobileNavModuleId[],
  id: OptionalMobileNavId,
): MobileNavModuleId[]
{
  const normalized = normalizeMobileNavModules(current)
  const optional = normalized.filter((m): m is OptionalMobileNavId => m !== 'home')
  const selected = optional.includes(id)

  if (selected)
  {
    const next = optional.filter((m) => m !== id)
    if (next.length < MIN_MOBILE_NAV_OPTIONAL)
    {
      return normalized
    }
    return ['home', ...next]
  }

  if (optional.length >= MAX_MOBILE_NAV_OPTIONAL)
  {
    return normalized
  }

  return normalizeMobileNavModules(['home', ...optional, id])
}
