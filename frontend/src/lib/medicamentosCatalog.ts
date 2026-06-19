import type { MedicamentoCategoria, MedicamentoPeriodo } from '../store/storeTypes'

export const MED_CATEGORIAS: { id: MedicamentoCategoria; label: string; hint: string }[] = [
  { id: 'pressao', label: 'Pressão', hint: 'Anti-hipertensivo' },
  { id: 'antidepressivo', label: 'Antidepressivo', hint: 'Humor / ansiedade' },
  { id: 'vitamina', label: 'Vitamina', hint: 'Suplemento diário' },
  { id: 'dor', label: 'Dor / febre', hint: 'Sintomático' },
  { id: 'cronico', label: 'Crônico', hint: 'Uso contínuo' },
  { id: 'outro', label: 'Outro', hint: 'Demais tipos' },
]

export const MED_PERIODOS: Record<MedicamentoPeriodo, { label: string; defaultTime: string }> = {
  manha: { label: 'Manhã', defaultTime: '08:00' },
  tarde: { label: 'Tarde', defaultTime: '14:00' },
  noite: { label: 'Noite', defaultTime: '20:00' },
}

export function horariosFromPeriodos(
  periodos: MedicamentoPeriodo[],
  customTimes?: Partial<Record<MedicamentoPeriodo, string>>,
): string[]
{
  return periodos.map((p) => customTimes?.[p] || MED_PERIODOS[p].defaultTime)
}

export const DIAS_SEMANA: { id: number; label: string; short: string }[] = [
  { id: 0, label: 'Domingo', short: 'Dom' },
  { id: 1, label: 'Segunda', short: 'Seg' },
  { id: 2, label: 'Terça', short: 'Ter' },
  { id: 3, label: 'Quarta', short: 'Qua' },
  { id: 4, label: 'Quinta', short: 'Qui' },
  { id: 5, label: 'Sexta', short: 'Sex' },
  { id: 6, label: 'Sábado', short: 'Sáb' },
]

export const DURACAO_PRESETS: { id: number | null; label: string }[] = [
  { id: null, label: 'Contínuo' },
  { id: 5, label: '5 dias' },
  { id: 7, label: '7 dias' },
  { id: 10, label: '10 dias' },
  { id: 15, label: '15 dias' },
  { id: 30, label: '30 dias' },
  { id: 60, label: '60 dias' },
  { id: 90, label: '90 dias' },
]

export function fimTratamentoFromInicio(inicio: string, dias: number): string
{
  const d = new Date(`${inicio}T12:00:00`)
  d.setDate(d.getDate() + dias - 1)
  return d.toISOString().slice(0, 10)
}

export function labelDiasSemana(ids: number[] | undefined): string
{
  if (!ids || ids.length === 0 || ids.length === 7) return 'Todos os dias'
  return ids
    .slice()
    .sort((a, b) => a - b)
    .map((id) => DIAS_SEMANA.find((d) => d.id === id)?.short ?? '')
    .filter(Boolean)
    .join(' · ')
}
