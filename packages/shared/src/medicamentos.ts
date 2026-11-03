/** Medicamentos - tipos compartilhados web/mobile */

export interface Medicamento
{
  id: number
  nome: string
  horario: string
  tomado: boolean
}

export function demoMedicamentos(): Medicamento[]
{
  return [
    { id: 1, nome: 'Xarope de exemplo', horario: '09:40', tomado: true },
    { id: 2, nome: 'Comprimido modelo', horario: '14:20', tomado: false },
    { id: 3, nome: 'Spray de demonstração', horario: '19:05', tomado: false },
  ]
}

export function medsTakenCount(meds: Medicamento[]): number
{
  return meds.filter((m) => m.tomado).length
}

export function medsWeekAdherencePct(
  medCount: number,
  takenDayKeys: string[],
  days = 7,
): number
{
  if (medCount <= 0)
  {
    return 0
  }
  const expected = medCount * days
  const unique = new Set(takenDayKeys)
  return Math.min(100, Math.round((unique.size / expected) * 100))
}
