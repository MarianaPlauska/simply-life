import type { LucideIcon } from 'lucide-react'
import { Frown, Annoyed, Meh, Smile, Laugh, BatteryLow, BatteryMedium, BatteryFull } from 'lucide-react'

export interface MoodOption
{
  value: number
  icon: LucideIcon
  label: string
  shortLabel: string
  colorClass: string
  hex: string
}

export const MOODS: MoodOption[] = [
  { value: 1, icon: Frown, label: 'Péssimo', shortLabel: 'Péssimo', colorClass: 'border-red-500/40 bg-red-500/10 text-red-400', hex: '#ef4444' },
  { value: 2, icon: Annoyed, label: 'Ruim', shortLabel: 'Ruim', colorClass: 'border-orange-500/40 bg-orange-500/10 text-orange-400', hex: '#f97316' },
  { value: 3, icon: Meh, label: 'Neutro', shortLabel: 'Neutro', colorClass: 'border-amber-500/40 bg-amber-500/10 text-amber-400', hex: '#eab308' },
  { value: 4, icon: Smile, label: 'Bom', shortLabel: 'Bom', colorClass: 'border-sky-500/40 bg-sky-500/10 text-sky-400', hex: '#22d3ee' },
  { value: 5, icon: Laugh, label: 'Ótimo', shortLabel: 'Ótimo', colorClass: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400', hex: '#06b6d4' },
]

export const MOOD_HEX: Record<number, string> = Object.fromEntries(
  MOODS.map((m) => [m.value, m.hex]),
)

export interface EnergyOption
{
  value: number
  icon: LucideIcon
  label: string
}

export const ENERGY_LEVELS: EnergyOption[] = [
  { value: 1, icon: BatteryLow, label: 'Baixa' },
  { value: 2, icon: BatteryMedium, label: 'Média' },
  { value: 3, icon: BatteryFull, label: 'Alta' },
]

/** Contextos opcionais — inspirado em Daylio/Bearable, sem obrigar preenchimento */
export const MOOD_CONTEXT_TAGS = [
  { id: 'trabalho', label: 'Trabalho' },
  { id: 'sono', label: 'Sono' },
  { id: 'social', label: 'Social' },
  { id: 'exercicio', label: 'Exercício' },
  { id: 'familia', label: 'Família' },
  { id: 'descanso', label: 'Descanso' },
] as const

export function moodLabel(value: number): string
{
  return MOODS.find((m) => m.value === value)?.label ?? '—'
}
