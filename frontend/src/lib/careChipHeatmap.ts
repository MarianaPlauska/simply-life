import type { CuidadosTab } from './healthRoute'
import {
  buildConsistencyCells,
  type ConsistencyDay,
  localIsoDate,
} from './consistencyHeatmap'
import type { MedicamentoTomada, SessaoTreino } from '../store/storeTypes'
import type { Habito } from '../types'

const CHIP_LABEL: Record<CuidadosTab, string> = {
  hidratacao: 'Água',
  alimentacao: 'Alimentação',
  medicamentos: 'Medicamentos',
  academia: 'Treino',
}

export function careChipLabel(tab: CuidadosTab): string
{
  return CHIP_LABEL[tab]
}

function bumpDay(map: Record<string, ConsistencyDay>, date: string): void
{
  const key = date.slice(0, 10)
  const prev = map[key] ?? { date: key, count: 0, value: 0 }
  map[key] = { date: key, count: prev.count + 1, value: prev.value + 1 }
}

export function buildHabitHistoricoDayMap(
  rows: { data: string; concluido: number }[],
): Record<string, ConsistencyDay>
{
  const map: Record<string, ConsistencyDay> = {}
  for (const row of rows)
  {
    if (row.concluido !== 1) continue
    bumpDay(map, row.data)
  }
  return map
}

export function buildMedicationDayMap(
  tomadas: MedicamentoTomada[],
): Record<string, ConsistencyDay>
{
  const map: Record<string, ConsistencyDay> = {}
  for (const t of tomadas)
  {
    if (!t.tomado_em) continue
    bumpDay(map, t.tomado_em.slice(0, 10))
  }
  return map
}

export function buildTrainingDayMap(
  sessoes: SessaoTreino[],
): Record<string, ConsistencyDay>
{
  const map: Record<string, ConsistencyDay> = {}
  for (const s of sessoes)
  {
    if (!s.finalizado_em) continue
    const dia = (s.finalizado_em ?? s.iniciado_em).slice(0, 10)
    bumpDay(map, dia)
  }
  return map
}

export function habitForCareTab(
  tab: CuidadosTab,
  habitos: Habito[],
): Habito | undefined
{
  if (tab === 'hidratacao')
  {
    return habitos.find((h) => h.tipo === 'agua')
  }
  if (tab === 'alimentacao')
  {
    return habitos.find((h) => h.tipo === 'proteina')
  }
  return undefined
}

export function buildCareChipCells(
  tab: CuidadosTab,
  byDate: Record<string, ConsistencyDay>,
  weeks = 12,
): ConsistencyDay[]
{
  return buildConsistencyCells(byDate, weeks, new Date())
}

export function careChipEmptyHint(tab: CuidadosTab): string
{
  if (tab === 'hidratacao')
  {
    return 'Registre água para ver sua constância aqui.'
  }
  if (tab === 'alimentacao')
  {
    return 'Registre refeições para montar o mapa.'
  }
  if (tab === 'medicamentos')
  {
    return 'Marque doses para acompanhar o mês.'
  }
  return 'Finalize treinos para ver o mapa.'
}

export function todayIso(): string
{
  return localIsoDate()
}
