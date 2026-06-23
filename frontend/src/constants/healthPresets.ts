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

/** Hábito mínimo de treino — sem plano pré-preenchido */
export const TREINO_PRESET = {
  tipo: 'treino',
  nome_exibicao: 'Treino',
  meta_diaria: 1,
  unidade: 'sessão',
  config: {
    meta_minutos: DEFAULT_TREINO_MINUTOS,
    plano_semana: {},
  },
} as const;
