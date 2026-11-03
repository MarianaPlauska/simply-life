import type { Medicamento } from './medicamentos'

export type MedDraft = {
  nome: string
  horario: string
  dose?: string
}

/** Só números. Depois de dois dígitos, entra os dois pontos da hora. */
export function maskMedTime(raw: string): string
{
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length < 2) return digits
  const hour = Math.min(23, Number(digits.slice(0, 2)))
  const hh = String(hour).padStart(2, '0')
  const mm = digits.slice(2)
  if (!mm) return `${hh}:`
  if (mm.length === 1) return `${hh}:${mm}`
  return `${hh}:${String(Math.min(59, Number(mm))).padStart(2, '0')}`
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
