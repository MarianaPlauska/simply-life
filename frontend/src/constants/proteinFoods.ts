// Alimentos padrão com proteína estimada (g por porção)

export type RefeicaoId = 'cafe' | 'almoco' | 'jantar' | 'lanche'

export interface ProteinFood
{
  id: string
  nome: string
  gramas: number
  /** Kcal estimadas da porção completa */
  kcal: number
}

export const REFEICOES_PROTEINA: { id: RefeicaoId; label: string; icon: string }[] = [
  { id: 'cafe', label: 'Café', icon: 'cafe' },
  { id: 'almoco', label: 'Almoço', icon: 'almoco' },
  { id: 'jantar', label: 'Jantar', icon: 'jantar' },
  { id: 'lanche', label: 'Lanche', icon: 'lanche' },
]

export const ALIMENTOS_PROTEINA: Record<RefeicaoId, ProteinFood[]> = {
  cafe: [
    { id: 'ovo2', nome: 'Ovos (2)', gramas: 12, kcal: 156 },
    { id: 'whey', nome: 'Whey (1 scoop)', gramas: 24, kcal: 120 },
    { id: 'iogurte', nome: 'Iogurte grego', gramas: 15, kcal: 110 },
    { id: 'queijo', nome: 'Queijo branco', gramas: 18, kcal: 95 },
    { id: 'aveia', nome: 'Aveia + leite', gramas: 10, kcal: 180 },
  ],
  almoco: [
    { id: 'frango150', nome: 'Frango grelhado (150g)', gramas: 46, kcal: 248 },
    { id: 'carne150', nome: 'Carne magra (150g)', gramas: 42, kcal: 280 },
    { id: 'peixe150', nome: 'Peixe (150g)', gramas: 35, kcal: 195 },
    { id: 'feijao', nome: 'Feijão (1 concha)', gramas: 12, kcal: 120 },
    { id: 'arrozfeijao', nome: 'Arroz + feijão + ovo', gramas: 22, kcal: 420 },
  ],
  jantar: [
    { id: 'frango120', nome: 'Frango (120g)', gramas: 36, kcal: 198 },
    { id: 'atum', nome: 'Atum em lata', gramas: 25, kcal: 145 },
    { id: 'omelete', nome: 'Omelete (3 ovos)', gramas: 18, kcal: 220 },
    { id: 'sopa', nome: 'Sopa de legumes + frango', gramas: 20, kcal: 180 },
    { id: 'tofu', nome: 'Tofu (150g)', gramas: 18, kcal: 165 },
  ],
  lanche: [
    { id: 'barra', nome: 'Barra de proteína', gramas: 20, kcal: 200 },
    { id: 'castanhas', nome: 'Castanhas (30g)', gramas: 6, kcal: 175 },
    { id: 'shake', nome: 'Shake rápido', gramas: 30, kcal: 250 },
    { id: 'queijo2', nome: 'Queijo + fruta', gramas: 12, kcal: 140 },
  ],
}
