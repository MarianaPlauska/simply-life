export const AXEL_VOICE_LINE =
  'Humor, água, tarefas e finanças em um só lugar. O AXEL prioriza o essencial e reduz o ruído do dia.'

export const AXEL_VOICE_LINE_SHORT =
  'O essencial do seu dia, com calma.'

export type CarePace = 'calm' | 'balanced' | 'direct'

export const CARE_PACE_OPTIONS: {
  id: CarePace
  label: string
  hint: string
}[] = [
  {
    id: 'calm',
    label: 'Calmo',
    hint: 'Menos texto, um passo de cada vez. Indicado se o dia pesa com facilidade.',
  },
  {
    id: 'balanced',
    label: 'Equilibrado',
    hint: 'Clareza sem pressa. O padrão do aplicativo.',
  },
  {
    id: 'direct',
    label: 'Objetivo',
    hint: 'Frases curtas e o próximo compromisso primeiro.',
  },
]

/** Teto de avisos no celular. Opt-in: o padrão do setup é silêncio. */
export type NotifyCadence = 'off' | 'once' | 'batch3'

export type GamificationMode = 'calm' | 'rpg'

export const GAMIFICATION_MODE_OPTIONS: {
  id: GamificationMode
  label: string
  hint: string
}[] = [
  {
    id: 'calm',
    label: 'Discreto',
    hint: 'XP e ofensiva ficam em segundo plano. Sem elementos de jogo na tela inicial.',
  },
  {
    id: 'rpg',
    label: 'Aventura',
    hint: 'Nível, moedas e trilha visíveis na Home. Útil para motivação com TDAH — sem punir dias parados.',
  },
]

export const NOTIFY_CADENCE_OPTIONS: {
  id: NotifyCadence
  label: string
  hint: string
}[] = [
  {
    id: 'off',
    label: 'Só no aplicativo',
    hint: 'Nenhum alerta no celular. Você abre quando quiser. O ritmo mais calmo.',
  },
  {
    id: 'once',
    label: 'Um resumo por dia',
    hint: 'No máximo um aviso, em horário comercial. Sem cobrança de sequência.',
  },
  {
    id: 'batch3',
    label: 'Até três no dia',
    hint: '9h, 15h e 21h — como no estudo da Duke sobre bem-estar digital. Sem urgência.',
  },
]

export function parseNotifyCadence(value: unknown): NotifyCadence | null
{
  if (value === 'off' || value === 'once' || value === 'batch3')
  {
    return value
  }
  return null
}
