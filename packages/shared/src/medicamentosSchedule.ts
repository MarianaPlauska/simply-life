import type { Medicamento } from './medicamentos'

export type MedDraft = {
  nome: string
  horario: string
  dose?: string
}

export function validateMedDraft(draft: MedDraft): string | null
{
  if (!draft.nome.trim()) return 'Informe o nome do remédio'
  if (!/^\d{1,2}:\d{2}$/.test(draft.horario.trim()))
  {
    return 'Horário no formato HH:MM'
  }
  return null
}

export function sortMedsByTime(meds: Medicamento[]): Medicamento[]
{
  return [...meds].sort((a, b) => a.horario.localeCompare(b.horario))
}

export function medsAdherencePct(meds: Medicamento[]): number
{
  if (meds.length === 0) return 0
  const done = meds.filter((m) => m.tomado).length
  return Math.round((done / meds.length) * 100)
}
