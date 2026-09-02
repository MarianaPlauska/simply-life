export type HealthSection = 'hoje' | 'cuidados' | 'diario'

export type CuidadosTab = 'hidratacao' | 'alimentacao' | 'academia' | 'medicamentos'

export const HEALTH_MAIN_TABS = [
  { id: 'hoje' as const, label: 'Hoje' },
  { id: 'cuidados' as const, label: 'Cuidados' },
  { id: 'diario' as const, label: 'Diário' },
]

export const CUIDADOS_SUB_TABS = [
  { id: 'hidratacao' as const, label: 'Hidratação' },
  { id: 'alimentacao' as const, label: 'Alimentação' },
  { id: 'academia' as const, label: 'Academia' },
  { id: 'medicamentos' as const, label: 'Medicamentos' },
]
