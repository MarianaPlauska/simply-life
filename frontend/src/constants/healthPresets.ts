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

export const TREINO_PRESET = {
  tipo: 'treino',
  nome_exibicao: 'Treino',
  meta_diaria: 1,
  unidade: 'sessão',
  config: {
    meta_minutos: DEFAULT_TREINO_MINUTOS,
    plano_semana: {
      seg: { titulo: 'Peito e tríceps', meta_minutos: 45 },
      ter: { titulo: 'Costas e bíceps', meta_minutos: 45 },
      qua: { titulo: 'Descanso ativo', meta_minutos: 30 },
      qui: { titulo: 'Pernas', meta_minutos: 50 },
      sex: { titulo: 'Ombros e core', meta_minutos: 40 },
      sab: { titulo: 'Cardio leve', meta_minutos: 35 },
      dom: { titulo: 'Descanso', meta_minutos: 0 },
    },
  },
} as const;
