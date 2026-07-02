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
  { value: 1, icon: Frown, label: 'Péssimo', shortLabel: 'Péssimo', colorClass: 'border-red-400/30 bg-red-400/8 text-red-400/90', hex: '#f87171' },
  { value: 2, icon: Annoyed, label: 'Ruim', shortLabel: 'Ruim', colorClass: 'border-orange-400/30 bg-orange-400/8 text-orange-400/90', hex: '#fb923c' },
  { value: 3, icon: Meh, label: 'Neutro', shortLabel: 'Neutro', colorClass: 'border-amber-400/30 bg-amber-400/8 text-amber-400/90', hex: '#fbbf24' },
  { value: 4, icon: Smile, label: 'Bom', shortLabel: 'Bom', colorClass: 'border-sky-400/30 bg-sky-400/8 text-sky-400/90', hex: '#38bdf8' },
  { value: 5, icon: Laugh, label: 'Ótimo', shortLabel: 'Ótimo', colorClass: 'border-cyan-400/30 bg-cyan-400/8 text-cyan-400/90', hex: '#22d3ee' },
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
