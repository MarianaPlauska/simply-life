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
  { value: 1, icon: Frown, label: 'Péssimo', shortLabel: 'Péssimo', colorClass: 'border-urgente/30 bg-urgente/8 text-urgente', hex: '#D47878' },
  { value: 2, icon: Annoyed, label: 'Ruim', shortLabel: 'Ruim', colorClass: 'border-atencao/30 bg-atencao/8 text-atencao', hex: '#C9A15C' },
  { value: 3, icon: Meh, label: 'Neutro', shortLabel: 'Neutro', colorClass: 'border-line bg-chrome text-ink-muted', hex: '#B0A89C' },
  { value: 4, icon: Smile, label: 'Bom', shortLabel: 'Bom', colorClass: 'border-health/30 bg-health-muted text-health', hex: '#7FA37A' },
  { value: 5, icon: Laugh, label: 'Ótimo', shortLabel: 'Ótimo', colorClass: 'border-health/40 bg-health-muted text-ink', hex: '#7FA37A' },
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

/** Contextos opcionais - inspirado em Daylio/Bearable, sem obrigar preenchimento */
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
  return MOODS.find((m) => m.value === value)?.label ?? '-'
}
