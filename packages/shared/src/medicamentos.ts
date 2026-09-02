/** Medicamentos — tipos compartilhados web/mobile */

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
    { id: 1, nome: 'Vitamina D', horario: '08:00', tomado: true },
    { id: 2, nome: 'Ômega 3', horario: '12:00', tomado: false },
    { id: 3, nome: 'Melatonina', horario: '22:00', tomado: false },
  ]
}

export function medsTakenCount(meds: Medicamento[]): number
{
  return meds.filter((m) => m.tomado).length
}
