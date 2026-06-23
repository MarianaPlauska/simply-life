// Alimentos padrão com proteína estimada (g por porção)

export type RefeicaoId = 'cafe' | 'almoco' | 'jantar' | 'lanche'

export interface ProteinFood
{
  id: string
  nome: string
  gramas: number
}

export const REFEICOES_PROTEINA: { id: RefeicaoId; label: string; emoji: string }[] = [
  { id: 'cafe', label: 'Café', emoji: '☕' },
  { id: 'almoco', label: 'Almoço', emoji: '🍽️' },
  { id: 'jantar', label: 'Jantar', emoji: '🌙' },
  { id: 'lanche', label: 'Lanche', emoji: '🥤' },
]

export const ALIMENTOS_PROTEINA: Record<RefeicaoId, ProteinFood[]> = {
  cafe: [
    { id: 'ovo2', nome: 'Ovos (2)', gramas: 12 },
    { id: 'whey', nome: 'Whey (1 scoop)', gramas: 24 },
    { id: 'iogurte', nome: 'Iogurte grego', gramas: 15 },
    { id: 'queijo', nome: 'Queijo branco', gramas: 18 },
    { id: 'aveia', nome: 'Aveia + leite', gramas: 10 },
  ],
  almoco: [
    { id: 'frango150', nome: 'Frango grelhado (150g)', gramas: 46 },
    { id: 'carne150', nome: 'Carne magra (150g)', gramas: 42 },
    { id: 'peixe150', nome: 'Peixe (150g)', gramas: 35 },
    { id: 'feijao', nome: 'Feijão (1 concha)', gramas: 12 },
    { id: 'arrozfeijao', nome: 'Arroz + feijão + ovo', gramas: 22 },
  ],
  jantar: [
    { id: 'frango120', nome: 'Frango (120g)', gramas: 36 },
    { id: 'atum', nome: 'Atum em lata', gramas: 25 },
    { id: 'omelete', nome: 'Omelete (3 ovos)', gramas: 18 },
    { id: 'sopa', nome: 'Sopa de legumes + frango', gramas: 20 },
    { id: 'tofu', nome: 'Tofu (150g)', gramas: 18 },
  ],
  lanche: [
    { id: 'barra', nome: 'Barra de proteína', gramas: 20 },
    { id: 'castanhas', nome: 'Castanhas (30g)', gramas: 6 },
    { id: 'shake', nome: 'Shake rápido', gramas: 30 },
    { id: 'queijo2', nome: 'Queijo + fruta', gramas: 12 },
  ],
}
