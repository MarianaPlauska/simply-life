import type { HumorRegistro } from '../store/slices/bemEstarSlice'
import { moodLabel } from './moodConstants'

export interface DiaHumorAgregado
{
  data: string
  humor: number
  registros: number
}

/** Média diária - vários check-ins no mesmo dia viram um ponto */
export function aggregateHumorByDay(registros: HumorRegistro[]): DiaHumorAgregado[]
{
  const map = new Map<string, { sum: number; count: number }>()

  for (const r of registros)
  {
    const prev = map.get(r.data) ?? { sum: 0, count: 0 }
    map.set(r.data, { sum: prev.sum + r.humor, count: prev.count + 1 })
  }

  return [...map.entries()]
    .map(([data, { sum, count }]) => ({
      data,
      humor: Math.round((sum / count) * 10) / 10,
      registros: count,
    }))
    .sort((a, b) => a.data.localeCompare(b.data))
}

export function mediaHumor(registros: HumorRegistro[]): number
{
  if (registros.length === 0) return 0
  const sum = registros.reduce((acc, r) => acc + r.humor, 0)
  return Math.round((sum / registros.length) * 10) / 10
}

export function ultimoRegistro(registros: HumorRegistro[]): HumorRegistro | null
{
  if (registros.length === 0) return null
  return [...registros].sort((a, b) =>
    (b.created_at || b.data).localeCompare(a.created_at || a.data),
  )[0]
}

export type HumorTendencia = 'positiva' | 'estavel' | 'desafiadora'

export function tendenciaSemana(dias: DiaHumorAgregado[]): HumorTendencia
{
  if (dias.length < 2) return 'estavel'
  const media = mediaHumor(dias.map((d) => ({ humor: d.humor } as HumorRegistro)))
  if (media >= 4) return 'positiva'
  if (media >= 3) return 'estavel'
  return 'desafiadora'
}

export function tendenciaLabel(t: HumorTendencia): string
{
  if (t === 'positiva') return 'Semana leve'
  if (t === 'estavel') return 'Semana estável'
  return 'Semana exigente'
}

export function insightHumorHoje(
  hoje: HumorRegistro[],
  semana: DiaHumorAgregado[],
): string
{
  if (hoje.length === 0)
  {
    return 'Registre seu humor - o AXEL usa isso para calibrar ritmo e carga hoje.'
  }

  const ultimo = ultimoRegistro(hoje)
  if (!ultimo) return ''

  const mediaHoje = mediaHumor(hoje)
  const partes: string[] = []

  if (hoje.length > 1)
  {
    partes.push(`${hoje.length} momentos hoje · média ${mediaHoje}`)
  }
  else
  {
    partes.push(`Agora: ${moodLabel(ultimo.humor)}`)
  }

  if (semana.length >= 3)
  {
    const tend = tendenciaSemana(semana)
    partes.push(tendenciaLabel(tend).toLowerCase())
  }

  return partes.join(' · ')
}

/** Últimos N dias com slot vazio para heatmap */
export function buildMonthSlots(
  agregados: DiaHumorAgregado[],
  dias = 30,
): Array<{ data: string; humor: number | null; registros: number }>
{
  const map = new Map(agregados.map((d) => [d.data, d]))
  const today = new Date()
  const slots: Array<{ data: string; humor: number | null; registros: number }> = []

  for (let i = dias - 1; i >= 0; i--)
  {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const data = d.toISOString().slice(0, 10)
    const row = map.get(data)
    slots.push({
      data,
      humor: row ? row.humor : null,
      registros: row?.registros ?? 0,
    })
  }

  return slots
}
