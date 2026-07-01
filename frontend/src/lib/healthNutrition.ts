// Resumo nutricional do dia — proteína + kcal no hábito `proteina`

import type { HabitoDiario } from '../store/useTaskStore'
import { PROTEINA_PRESET } from '../constants/healthPresets'

export interface NutricaoHojeSnapshot
{
  gramas: number
  metaGramas: number
  kcal: number
  metaKcal: number
  pctProteina: number
  pctKcal: number
}

const DEFAULT_META_KCAL = 2000

export function snapshotNutricaoHoje(habitos: HabitoDiario[]): NutricaoHojeSnapshot
{
  const proteina = habitos.find((h) => h.tipo === 'proteina')
  const gramas = proteina?.progresso_atual ?? 0
  const metaGramas = proteina?.meta_diaria ?? PROTEINA_PRESET.meta_diaria
  const kcal = typeof proteina?.config?.kcal_hoje === 'number' ? proteina.config.kcal_hoje : 0
  const metaKcal = typeof proteina?.config?.meta_kcal_diaria === 'number'
    ? proteina.config.meta_kcal_diaria
    : DEFAULT_META_KCAL

  return {
    gramas,
    metaGramas,
    kcal,
    metaKcal,
    pctProteina: metaGramas > 0 ? Math.min(100, Math.round((gramas / metaGramas) * 100)) : 0,
    pctKcal: metaKcal > 0 ? Math.min(100, Math.round((kcal / metaKcal) * 100)) : 0,
  }
}

/** Kcal aproximada só da porção de proteína (+ carb/gordura residual) */
export function kcalFromProteinGrams(gramas: number): number
{
  return Math.max(0, Math.round(gramas * 4.2 + gramas * 1.5))
}
