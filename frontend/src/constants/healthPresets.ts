export const AGUA_PRESET = {
  tipo: 'agua',
  nome_exibicao: 'Água',
  meta_diaria: 8,
  unidade: 'copos',
  config: { incremento: 1 },
} as const;

export const PROTEINA_PRESET = {
  tipo: 'proteina',
  nome_exibicao: 'Proteína',
  meta_diaria: 120,
  unidade: 'g',
  config: { incremento: 10 },
} as const;

export const DEFAULT_TREINO_MINUTOS = 45;
