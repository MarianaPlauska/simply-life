import type { DashboardPriority } from './dashboardWidgets'

/** Conteúdo do onboarding. Linguagem institucional, sem gíria. */

export const SETUP_STEP_COUNT = 11

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

export function setupStepTitle(step: number): string
{
  const titles = [
    'Bem-vindo ao Simply Life',
    'O que você vai ver',
    'Ritmo e aparência',
    'Foco e neurodivergência',
    'Como devemos te chamar',
    'Ordem das prioridades',
    'Sua meta',
    'Humor e cuidados',
    'Alertas no celular',
    'Dinheiro com clareza',
    'Pronto para começar',
  ]
  return titles[step] ?? 'Configuração'
}
