export * from './xpEconomy'

export type Achievement = {
  id: string
  title: string
  description: string
  xpReward: number
}

export const STARTER_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_task', title: 'Primeira entrega', description: 'Conclua uma tarefa', xpReward: 20 },
  { id: 'water_day', title: 'Hidratado', description: 'Bata a meta de água', xpReward: 15 },
  { id: 'mood_check', title: 'Check-in', description: 'Registre o humor', xpReward: 10 },
  { id: 'streak_3', title: 'Ofensiva 3', description: '3 dias seguidos ativos', xpReward: 40 },
  { id: 'finance_log', title: 'Controle', description: 'Lance um gasto', xpReward: 15 },
]

export type ShopItem = {
  id: string
  title: string
  cost: number
  kind: 'cosmetic' | 'boost'
}

export const REWARD_SHOP: ShopItem[] = [
  { id: 'theme_ember', title: 'Tema Ember', cost: 120, kind: 'cosmetic' },
  { id: 'badge_spark', title: 'Badge Spark', cost: 80, kind: 'cosmetic' },
  { id: 'boost_focus', title: 'Boost de foco', cost: 60, kind: 'boost' },
]
