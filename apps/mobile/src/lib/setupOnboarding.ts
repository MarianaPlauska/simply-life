import type { DashboardPriority } from './dashboardWidgets'

/** Conteúdo do onboarding. Linguagem institucional, sem gíria. */

export const SETUP_STEPS = [
  'welcome',
  'name',
  'pace',
  'focus',
  'home',
  'cards',
  'goal',
  'alerts',
  'summary',
] as const

export type SetupStepId = (typeof SETUP_STEPS)[number]

export const SETUP_STEP_COUNT = SETUP_STEPS.length

export const SETUP_PRIORITY: {
  id: DashboardPriority
  label: string
  hint: string
}[] = [
  {
    id: 'tasks',
    label: 'Tarefas',
    hint: 'Lista, prazos, pastas e o que fazer agora. O AXEL destaca uma prioridade e silencia o resto.',
  },
  {
    id: 'health',
    label: 'Saúde',
    hint: 'Água, humor, sono, treino e medicamentos. Check-ins curtos, nunca um diagnóstico.',
  },
  {
    id: 'finance',
    label: 'Finanças',
    hint: 'Saldo da conta, cartões, pastas de gastos e relatórios. Débito sai na hora; crédito só na fatura paga.',
  },
]

const TITLES: Record<SetupStepId, string> = {
  welcome: 'Bem-vindo ao Simply Life',
  name: 'Como devemos te chamar',
  pace: 'Ritmo e aparência',
  focus: 'Foco e neurodivergência',
  home: 'Sua tela inicial',
  cards: 'Seus cartões',
  goal: 'Sua meta',
  alerts: 'Alertas no celular',
  summary: 'Pronto para começar',
}

export function setupStepTitle(step: number): string
{
  const id = SETUP_STEPS[step]
  return id ? TITLES[id] : 'Configuração'
}
