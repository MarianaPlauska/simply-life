import type { CategoryGrupo } from '../store/storeTypes'

export interface DefaultCategorySeed
{
  nome: string
  cor: string
  icone: string
  tipo: 'receita' | 'despesa'
  grupo: CategoryGrupo
}

export const CATEGORY_GRUPO_ORDER: CategoryGrupo[] = [
  'casa',
  'contas',
  'futuro',
  'lazer',
  'streaming',
  'importantes',
  'geral',
]

export const CATEGORY_GRUPO_LABELS: Record<CategoryGrupo, string> = {
  casa: 'Casa',
  contas: 'Contas',
  futuro: 'Organizações futuras',
  lazer: 'Lazer',
  streaming: 'Streaming',
  importantes: 'Importantes',
  geral: 'Geral',
}

export const DEFAULT_CATEGORY_SEEDS: DefaultCategorySeed[] = [
  // Casa
  { nome: 'Aluguel', cor: '#6366f1', icone: 'Home', tipo: 'despesa', grupo: 'casa' },
  { nome: 'Mercado', cor: '#10b981', icone: 'ShoppingCart', tipo: 'despesa', grupo: 'casa' },
  { nome: 'Manutenção', cor: '#f59e0b', icone: 'Home', tipo: 'despesa', grupo: 'casa' },
  // Contas
  { nome: 'Luz', cor: '#eab308', icone: 'Zap', tipo: 'despesa', grupo: 'contas' },
  { nome: 'Internet', cor: '#06b6d4', icone: 'Wifi', tipo: 'despesa', grupo: 'contas' },
  { nome: 'Celular', cor: '#8b5cf6', icone: 'Wifi', tipo: 'despesa', grupo: 'contas' },
  { nome: 'Água', cor: '#3b82f6', icone: 'Heart', tipo: 'despesa', grupo: 'contas' },
  // Futuro
  { nome: 'Férias', cor: '#ec4899', icone: 'Plane', tipo: 'despesa', grupo: 'futuro' },
  { nome: 'Educação', cor: '#14b8a6', icone: 'GraduationCap', tipo: 'despesa', grupo: 'futuro' },
  { nome: 'Investimentos', cor: '#22c55e', icone: 'Target', tipo: 'despesa', grupo: 'futuro' },
  // Lazer
  { nome: 'Lazer', cor: '#a855f7', icone: 'Gamepad2', tipo: 'despesa', grupo: 'lazer' },
  { nome: 'Restaurante', cor: '#f97316', icone: 'Utensils', tipo: 'despesa', grupo: 'lazer' },
  // Streaming
  { nome: 'Netflix', cor: '#ef4444', icone: 'Film', tipo: 'despesa', grupo: 'streaming' },
  { nome: 'Spotify', cor: '#22c55e', icone: 'Music', tipo: 'despesa', grupo: 'streaming' },
  // Importantes
  { nome: 'Seguro', cor: '#0ea5e9', icone: 'Shield', tipo: 'despesa', grupo: 'importantes' },
  { nome: 'Emergência', cor: '#f59e0b', icone: 'PiggyBank', tipo: 'despesa', grupo: 'importantes' },
  // Geral
  { nome: 'Transporte', cor: '#f97316', icone: 'Car', tipo: 'despesa', grupo: 'geral' },
  { nome: 'Alimentação', cor: '#ef4444', icone: 'Utensils', tipo: 'despesa', grupo: 'geral' },
  { nome: 'Saúde', cor: '#f43f5e', icone: 'Heart', tipo: 'despesa', grupo: 'geral' },
  { nome: 'Salário', cor: '#22c55e', icone: 'Briefcase', tipo: 'receita', grupo: 'geral' },
  { nome: 'Freelance', cor: '#10b981', icone: 'Wallet', tipo: 'receita', grupo: 'geral' },
]
