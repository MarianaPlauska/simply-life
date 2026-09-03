// Catálogo de exercícios - busca e criação de customizados

export interface LibraryExercise
{
  id: string
  nome: string
  grupo: string
  equipamento?: string
}

export const ACADEMY_GRUPOS = [
  'Peito',
  'Costas',
  'Pernas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Core',
  'Cardio',
  'Mobilidade',
] as const

export const ACADEMY_LIBRARY: LibraryExercise[] = [
  { id: 'lib-supino-reto', nome: 'Supino reto', grupo: 'Peito', equipamento: 'Barra' },
  { id: 'lib-supino-inclinado', nome: 'Supino inclinado', grupo: 'Peito', equipamento: 'Barra' },
  { id: 'lib-crucifixo', nome: 'Crucifixo', grupo: 'Peito', equipamento: 'Halteres' },
  { id: 'lib-flexao', nome: 'Flexão de braço', grupo: 'Peito' },
  { id: 'lib-remada-curvada', nome: 'Remada curvada', grupo: 'Costas', equipamento: 'Barra' },
  { id: 'lib-puxada', nome: 'Puxada frontal', grupo: 'Costas', equipamento: 'Polia' },
  { id: 'lib-remada-unilateral', nome: 'Remada unilateral', grupo: 'Costas', equipamento: 'Halter' },
  { id: 'lib-barra-fixa', nome: 'Barra fixa', grupo: 'Costas' },
  { id: 'lib-agachamento', nome: 'Agachamento', grupo: 'Pernas', equipamento: 'Barra' },
  { id: 'lib-leg-press', nome: 'Leg press', grupo: 'Pernas', equipamento: 'Máquina' },
  { id: 'lib-cadeira-extensora', nome: 'Cadeira extensora', grupo: 'Pernas', equipamento: 'Máquina' },
  { id: 'lib-stiff', nome: 'Stiff', grupo: 'Pernas', equipamento: 'Barra' },
  { id: 'lib-afundo', nome: 'Afundo', grupo: 'Pernas', equipamento: 'Halteres' },
  { id: 'lib-desenvolvimento', nome: 'Desenvolvimento', grupo: 'Ombros', equipamento: 'Halteres' },
  { id: 'lib-elevacao-lateral', nome: 'Elevação lateral', grupo: 'Ombros', equipamento: 'Halteres' },
  { id: 'lib-rosca-direta', nome: 'Rosca direta', grupo: 'Bíceps', equipamento: 'Barra' },
  { id: 'lib-rosca-alternada', nome: 'Rosca alternada', grupo: 'Bíceps', equipamento: 'Halteres' },
  { id: 'lib-triceps-corda', nome: 'Tríceps corda', grupo: 'Tríceps', equipamento: 'Polia' },
  { id: 'lib-triceps-testa', nome: 'Tríceps testa', grupo: 'Tríceps', equipamento: 'Barra' },
  { id: 'lib-prancha', nome: 'Prancha', grupo: 'Core' },
  { id: 'lib-abdominal', nome: 'Abdominal', grupo: 'Core' },
  { id: 'lib-esteira', nome: 'Esteira', grupo: 'Cardio' },
  { id: 'lib-bike', nome: 'Bike', grupo: 'Cardio' },
  { id: 'lib-mobilidade-quadril', nome: 'Mobilidade de quadril', grupo: 'Mobilidade' },
]

function normalizeQuery(q: string): string
{
  return q.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export function searchExerciseLibrary(
  query: string,
  custom: LibraryExercise[] = [],
): LibraryExercise[]
{
  const all = [...ACADEMY_LIBRARY, ...custom]
  const q = normalizeQuery(query)
  if (!q)
  {
    return all.slice(0, 12)
  }
  return all.filter((ex) =>
  {
    const blob = normalizeQuery(`${ex.nome} ${ex.grupo} ${ex.equipamento ?? ''}`)
    return blob.includes(q)
  }).slice(0, 20)
}

export function libraryToAcademyExercise(lib: LibraryExercise): import('./academyWorkouts').AcademyExercise
{
  const slug = lib.id.replace(/^lib-/, '')
  return {
    id: slug,
    nome: lib.nome,
    series: 3,
    reps_alvo: '8-12',
    carga_kg: 0,
  }
}

export function createCustomLibraryExercise(nome: string, grupo: string): LibraryExercise
{
  const slug = nome.trim().toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return {
    id: `custom-${slug || Date.now()}`,
    nome: nome.trim(),
    grupo: grupo || 'Outros',
  }
}
