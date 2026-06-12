import type { CSSProperties } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Briefcase,
  Car,
  Gamepad2,
  GraduationCap,
  Heart,
  Home,
  Plane,
  ShoppingCart,
  Target,
  Utensils,
  Wallet,
  Wifi,
  Zap,
} from 'lucide-react'

export const FINANCE_CATEGORY_ICONS: Record<string, LucideIcon> = {
  Wallet,
  ShoppingCart,
  Utensils,
  Home,
  Heart,
  GraduationCap,
  Gamepad2,
  Wifi,
  Plane,
  Briefcase,
  Car,
  Zap,
  Target,
}

export function FinanceCategoryIcon({
  name,
  className,
  style,
}: {
  name: string
  className?: string
  style?: CSSProperties
})
{
  const Icon = FINANCE_CATEGORY_ICONS[name] ?? Wallet
  return <Icon className={className} style={style} />
}
