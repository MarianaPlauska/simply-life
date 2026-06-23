import type { LucideIcon } from 'lucide-react'
import {
  Car,
  Clapperboard,
  Coffee,
  Fuel,
  Pill,
  QrCode,
  ShoppingCart,
  Smartphone,
  Utensils,
  Wallet,
} from 'lucide-react'
import type { Category } from '../store/storeTypes'
import type { ExpensePreset } from './financeExpensePresets'

const ICONS: Record<string, LucideIcon> = {
  'qr-code': QrCode,
  car: Car,
  utensils: Utensils,
  coffee: Coffee,
  'shopping-cart': ShoppingCart,
  pill: Pill,
  smartphone: Smartphone,
  fuel: Fuel,
  clapperboard: Clapperboard,
  wallet: Wallet,
}

const BY_PRESET_ID: Record<string, LucideIcon> = {
  'preset-pix': QrCode,
  'preset-uber': Car,
  'preset-almoco': Utensils,
  'preset-cafe': Coffee,
  'preset-mercado': ShoppingCart,
  'preset-farmacia': Pill,
  'preset-assinatura': Smartphone,
  'preset-gasolina': Fuel,
  'preset-lazer': Clapperboard,
}

const FALLBACK_COLORS: Record<string, string> = {
  outros: '#6366F1',
  transporte: '#F97316',
  alimentacao: '#EF4444',
  saude: '#F43F5E',
  internet: '#8B5CF6',
  lazer: '#A855F7',
}

export function resolvePresetIcon(preset: ExpensePreset): LucideIcon
{
  if (preset.icon && ICONS[preset.icon])
  {
    return ICONS[preset.icon]
  }
  return BY_PRESET_ID[preset.id] ?? Wallet
}

export function resolvePresetColor(preset: ExpensePreset, categories: Category[]): string
{
  if (preset.categoria_id)
  {
    const cat = categories.find((c) => c.id === preset.categoria_id)
    if (cat?.cor) return cat.cor
  }

  if (preset.categoria)
  {
    const byName = categories.find(
      (c) => c.nome.toLowerCase() === preset.categoria?.toLowerCase(),
    )
    if (byName?.cor) return byName.cor

    const fallback = FALLBACK_COLORS[preset.categoria.toLowerCase()]
    if (fallback) return fallback
  }

  return '#71717A'
}
