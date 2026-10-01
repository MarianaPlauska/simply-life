export type HealthSection = 'hoje' | 'cuidados' | 'diario' | 'apoio'

export type CuidadosTab = 'hidratacao' | 'alimentacao' | 'academia' | 'medicamentos' | 'sono'

export const HEALTH_MAIN_TABS = [
  { id: 'diario' as const, label: 'Diário' },
  { id: 'hoje' as const, label: 'Hoje' },
  { id: 'cuidados' as const, label: 'Cuidados' },
  { id: 'apoio' as const, label: 'Apoio' },
]

export const CUIDADOS_SUB_TABS = [
  { id: 'hidratacao' as const, label: 'Hidratação' },
  { id: 'alimentacao' as const, label: 'Alimentação' },
  { id: 'sono' as const, label: 'Sono' },
  { id: 'academia' as const, label: 'Academia' },
  { id: 'medicamentos' as const, label: 'Medicamentos' },
]

import type { AppModuleId } from '../../lib/appModules'

export const CARE_MODULE: Record<CuidadosTab, AppModuleId> = {
  hidratacao: 'water',
  alimentacao: 'food',
  sono: 'sleep',
  academia: 'gym',
  medicamentos: 'meds',
}

/** Abas de Saúde que aparecem: Hoje sempre; as outras dependem do módulo. */
export function visibleHealthTabs(on: (id: AppModuleId) => boolean)
{
  const anyCare = CUIDADOS_SUB_TABS.some((t) => on(CARE_MODULE[t.id]))
  return HEALTH_MAIN_TABS.filter((t) =>
    t.id === 'diario' ? on('mood')
      : t.id === 'cuidados' ? anyCare
        : t.id === 'apoio' ? on('support')
          : true)
}

export function visibleCuidadosTabs(on: (id: AppModuleId) => boolean)
{
  return CUIDADOS_SUB_TABS.filter((t) => on(CARE_MODULE[t.id]))
}

export const HEALTH_SECTION_INTRO: Record<HealthSection, { title: string; subtitle: string }> = {
  diario: {
    title: 'Diário',
    subtitle: 'Humor de hoje, padrões do mês e o que você escreveu.',
  },
  hoje: {
    title: 'Hoje',
    subtitle: 'O essencial do dia: humor, hábitos e próximo passo.',
  },
  cuidados: {
    title: 'Cuidados',
    subtitle: 'Água, sono, alimentação, treino e medicamentos.',
  },
  apoio: {
    title: 'Apoio',
    subtitle: 'Acalmar, foco e recursos quando precisar.',
  },
}
