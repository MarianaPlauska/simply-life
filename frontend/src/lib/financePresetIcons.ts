import type { LucideIcon } from 'lucide-react'
import type { Category } from '../store/storeTypes'
import type { ExpensePreset } from './financeExpensePresets'
import { resolveAxelIcon } from './axelIconMap'

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
  return resolveAxelIcon(preset.icon ?? preset.id)
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
