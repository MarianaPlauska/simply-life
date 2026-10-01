import { localTodayIso, mondayOfLocalWeek } from './dates'
import { addDaysIso } from './taskPrompt'

/**
 * Chama: semanas fechadas, coleção e prêmios escolhidos pela pessoa.
 * Regras fixas e explicadas na tela (pensado para TDAH e autismo):
 * - semana = segunda a domingo; fecha com 4 dias de registro
 * - a semana fecha na hora em que chega ao 4º dia, sem esperar o domingo
 * - nada se perde: semana que não fechou só não soma
 * - sem sorteio: as peças da coleção vêm sempre na mesma ordem
 */
export const CHAMA_WEEK_GOAL_DAYS = 4

/** Segunda-feira (ISO local) da semana do dia. */
export function weekStartIso(iso: string): string
{
  return localTodayIso(mondayOfLocalWeek(new Date(`${iso}T12:00:00`)))
}

export type ChamaWeek = {
  start: string
  days: number
  closed: boolean
}

/** Semanas desde `fromIso` (inclusive a semana dele) até hoje, com os dias de registro de cada uma. */
export function chamaWeeks(activeIsos: string[], fromIso: string, ref = new Date(), goal = CHAMA_WEEK_GOAL_DAYS): ChamaWeek[]
{
  const today = localTodayIso(ref)
  const first = weekStartIso(fromIso <= today ? fromIso : today)
  const counts = new Map<string, number>()
  for (const iso of new Set(activeIsos))
  {
    if (iso < first || iso > today) continue
    const w = weekStartIso(iso)
    counts.set(w, (counts.get(w) ?? 0) + 1)
  }
  const out: ChamaWeek[] = []
  for (let w = first; w <= today; w = addDaysIso(w, 7))
  {
    const days = counts.get(w) ?? 0
    out.push({ start: w, days, closed: days >= goal })
  }
  return out
}

export function closedWeekCount(activeIsos: string[], fromIso: string, ref = new Date()): number
{
  return chamaWeeks(activeIsos, fromIso, ref).filter((w) => w.closed).length
}

/** Semana atual: quantos dias já tem e quantos faltam para fechar. */
export function currentChamaWeek(activeIsos: string[], ref = new Date()): { days: number; goal: number; closed: boolean }
{
  const today = localTodayIso(ref)
  const start = weekStartIso(today)
  const days = new Set(activeIsos.filter((iso) => iso >= start && iso <= today)).size
  return { days, goal: CHAMA_WEEK_GOAL_DAYS, closed: days >= CHAMA_WEEK_GOAL_DAYS }
}

/* ── Coleções ─────────────────────────────────────────────── */

export type CollectionThemeId =
  | 'jardim' | 'ceu' | 'viagem' | 'arte'
  | 'oceano' | 'bichos' | 'cozinha' | 'aventura' | 'musica' | 'jogos'

export type CollectionPiece = { name: string; icon: string }

export type CollectionTheme = {
  id: CollectionThemeId
  label: string
  hint: string
  pieces: CollectionPiece[]
}

/** Ordem fixa: a pessoa sabe qual é a próxima peça antes de ganhar. */
export const COLLECTION_THEMES: CollectionTheme[] = [
  {
    id: 'jardim',
    label: 'Jardim',
    hint: 'Uma planta que cresce semana a semana.',
    pieces: [
      { name: 'Semente', icon: 'ellipse' },
      { name: 'Broto', icon: 'leaf-outline' },
      { name: 'Primeira rega', icon: 'water-outline' },
      { name: 'Sol da manhã', icon: 'sunny-outline' },
      { name: 'Folhas novas', icon: 'leaf' },
      { name: 'Chuva boa', icon: 'rainy-outline' },
      { name: 'Raiz firme', icon: 'git-branch-outline' },
      { name: 'Vaso', icon: 'col-potted-plant' },
      { name: 'Colheita', icon: 'nutrition-outline' },
      { name: 'Tulipa', icon: 'col-flower-tulip' },
      { name: 'Árvore', icon: 'col-tree' },
      { name: 'Jardim completo', icon: 'trophy' },
    ],
  },
  {
    id: 'ceu',
    label: 'Céu',
    hint: 'Uma constelação ganhando estrelas.',
    pieces: [
      { name: 'Primeira estrela', icon: 'star-outline' },
      { name: 'Lua nova', icon: 'moon-outline' },
      { name: 'Nuvem', icon: 'cloud-outline' },
      { name: 'Amanhecer', icon: 'partly-sunny-outline' },
      { name: 'Estrela brilhante', icon: 'star' },
      { name: 'Faísca', icon: 'sparkles-outline' },
      { name: 'Lua cheia', icon: 'moon' },
      { name: 'Floco de neve', icon: 'snow-outline' },
      { name: 'Relâmpago', icon: 'flash-outline' },
      { name: 'Sol do meio dia', icon: 'sunny' },
      { name: 'Planeta', icon: 'globe-outline' },
      { name: 'Constelação completa', icon: 'trophy' },
    ],
  },
  {
    id: 'viagem',
    label: 'Viagem',
    hint: 'Selos de uma viagem imaginária.',
    pieces: [
      { name: 'Mala pronta', icon: 'briefcase-outline' },
      { name: 'Bilhete', icon: 'pricetag-outline' },
      { name: 'Decolagem', icon: 'airplane-outline' },
      { name: 'Café no caminho', icon: 'cafe-outline' },
      { name: 'Estrada', icon: 'car-outline' },
      { name: 'Mapa', icon: 'location-outline' },
      { name: 'Foto', icon: 'film-outline' },
      { name: 'Música local', icon: 'musical-notes-outline' },
      { name: 'Comida típica', icon: 'restaurant-outline' },
      { name: 'Chave do hotel', icon: 'key-outline' },
      { name: 'Volta ao mundo', icon: 'globe' },
      { name: 'Passaporte completo', icon: 'trophy' },
    ],
  },
  {
    id: 'arte',
    label: 'Ateliê',
    hint: 'Cartas de um ateliê de artes.',
    pieces: [
      { name: 'Lápis', icon: 'pencil-outline' },
      { name: 'Paleta', icon: 'color-palette-outline' },
      { name: 'Caderno', icon: 'book-outline' },
      { name: 'Melodia', icon: 'musical-notes' },
      { name: 'Filme', icon: 'film' },
      { name: 'Jogo', icon: 'game-controller-outline' },
      { name: 'Sorvete do intervalo', icon: 'ice-cream-outline' },
      { name: 'Ideia', icon: 'sparkles' },
      { name: 'Medalha', icon: 'medal-outline' },
      { name: 'Exposição', icon: 'albums-outline' },
      { name: 'Obra prima', icon: 'star' },
      { name: 'Ateliê completo', icon: 'trophy' },
    ],
  },
  {
    id: 'oceano',
    label: 'Oceano',
    hint: 'Do primeiro pingo até o farol.',
    pieces: [
      { name: 'Gota', icon: 'water' },
      { name: 'Onda', icon: 'col-waves' },
      { name: 'Peixinho', icon: 'col-fish' },
      { name: 'Pena de gaivota', icon: 'col-feather' },
      { name: 'Gaivota', icon: 'col-bird' },
      { name: 'Barco à vela', icon: 'col-sailboat' },
      { name: 'Âncora', icon: 'col-anchor' },
      { name: 'Ilha', icon: 'col-island' },
      { name: 'Arco íris no mar', icon: 'col-rainbow' },
      { name: 'Diamante do fundo', icon: 'col-diamond' },
      { name: 'Farol', icon: 'col-lighthouse' },
      { name: 'Oceano completo', icon: 'trophy' },
    ],
  },
  {
    id: 'bichos',
    label: 'Bichos',
    hint: 'Uma turma de bichos que vai chegando.',
    pieces: [
      { name: 'Pegada', icon: 'paw' },
      { name: 'Joaninha', icon: 'col-bug' },
      { name: 'Borboleta', icon: 'col-butterfly' },
      { name: 'Passarinho', icon: 'col-bird' },
      { name: 'Peixe', icon: 'col-fish' },
      { name: 'Coelho', icon: 'col-rabbit' },
      { name: 'Gato', icon: 'col-cat' },
      { name: 'Cachorro', icon: 'col-dog' },
      { name: 'Cavalo', icon: 'col-horse' },
      { name: 'Bolota para o esquilo', icon: 'col-acorn' },
      { name: 'Coroa da turma', icon: 'col-crown' },
      { name: 'Turma completa', icon: 'trophy' },
    ],
  },
  {
    id: 'cozinha',
    label: 'Cozinha',
    hint: 'Ingredientes até um banquete.',
    pieces: [
      { name: 'Ovo', icon: 'col-egg' },
      { name: 'Pão', icon: 'col-bread' },
      { name: 'Cenoura', icon: 'nutrition' },
      { name: 'Abacate', icon: 'col-avocado' },
      { name: 'Pimenta', icon: 'col-pepper' },
      { name: 'Laranja', icon: 'col-orange' },
      { name: 'Cerejas', icon: 'col-cherries' },
      { name: 'Café', icon: 'cafe' },
      { name: 'Pizza', icon: 'col-pizza' },
      { name: 'Biscoito', icon: 'col-cookie' },
      { name: 'Bolo', icon: 'col-cake' },
      { name: 'Banquete completo', icon: 'trophy' },
    ],
  },
  {
    id: 'aventura',
    label: 'Aventura',
    hint: 'Uma trilha do acampamento ao espaço.',
    pieces: [
      { name: 'Bússola', icon: 'col-compass' },
      { name: 'Barraca', icon: 'col-tent' },
      { name: 'Fogueira', icon: 'col-fire' },
      { name: 'Árvore', icon: 'col-tree' },
      { name: 'Cacto', icon: 'col-cactus' },
      { name: 'Bicicleta', icon: 'col-bicycle' },
      { name: 'Corrida', icon: 'col-person-simple-run' },
      { name: 'Montanhas', icon: 'col-mountains' },
      { name: 'Câmera', icon: 'col-camera' },
      { name: 'Foguete', icon: 'col-rocket' },
      { name: 'Planeta', icon: 'col-planet' },
      { name: 'Aventura completa', icon: 'trophy' },
    ],
  },
  {
    id: 'musica',
    label: 'Música',
    hint: 'Um palco montado peça por peça.',
    pieces: [
      { name: 'Primeira nota', icon: 'col-music-note' },
      { name: 'Fone', icon: 'col-headphones' },
      { name: 'Violão', icon: 'col-guitar' },
      { name: 'Partitura', icon: 'col-book-bookmark' },
      { name: 'Melodia', icon: 'musical-notes' },
      { name: 'Pipoca do show', icon: 'col-popcorn' },
      { name: 'Balões', icon: 'col-balloon' },
      { name: 'Luzes', icon: 'sparkles' },
      { name: 'Confete', icon: 'col-confetti' },
      { name: 'Estrela do palco', icon: 'star' },
      { name: 'Coroa', icon: 'col-crown' },
      { name: 'Show completo', icon: 'trophy' },
    ],
  },
  {
    id: 'jogos',
    label: 'Jogos',
    hint: 'Peças de um tabuleiro que fica pronto.',
    pieces: [
      { name: 'Quebra cabeça', icon: 'col-puzzle-piece' },
      { name: 'Cartas', icon: 'col-cards' },
      { name: 'Controle', icon: 'game-controller' },
      { name: 'Bola', icon: 'col-soccer-ball' },
      { name: 'Basquete', icon: 'col-basketball' },
      { name: 'Pincel', icon: 'col-paint-brush' },
      { name: 'Flor de lótus', icon: 'col-flower-lotus' },
      { name: 'Medalha', icon: 'medal' },
      { name: 'Diamante', icon: 'col-diamond' },
      { name: 'Coroa', icon: 'col-crown' },
      { name: 'Troféu dourado', icon: 'trophy-outline' },
      { name: 'Tabuleiro completo', icon: 'trophy' },
    ],
  },
]

export function collectionTheme(id: CollectionThemeId): CollectionTheme
{
  return COLLECTION_THEMES.find((t) => t.id === id) ?? COLLECTION_THEMES[0]!
}

export type ChamaCollection = { tema: CollectionThemeId; desde: string }

export type CollectionProgress = {
  theme: CollectionTheme
  earned: number
  total: number
  next: CollectionPiece | null
  complete: boolean
}

export function collectionProgress(c: ChamaCollection, activeIsos: string[], ref = new Date()): CollectionProgress
{
  const theme = collectionTheme(c.tema)
  const earned = Math.min(theme.pieces.length, closedWeekCount(activeIsos, c.desde, ref))
  return {
    theme,
    earned,
    total: theme.pieces.length,
    next: theme.pieces[earned] ?? null,
    complete: earned >= theme.pieces.length,
  }
}

/* ── Prêmios reais ────────────────────────────────────────── */

/** O que conta para o prêmio: qualquer registro (chama) ou um hábito específico. */
export type ChamaPrizeRule = 'chama' | 'agua' | 'tarefas' | 'foco' | 'humor'

export const CHAMA_PRIZE_RULES: { id: ChamaPrizeRule; label: string; phrase: string }[] = [
  { id: 'chama', label: 'Qualquer registro', phrase: 'com registro' },
  { id: 'agua', label: 'Água', phrase: 'bebendo água' },
  { id: 'tarefas', label: 'Tarefas', phrase: 'concluindo tarefas' },
  { id: 'foco', label: 'Foco', phrase: 'com foco' },
  { id: 'humor', label: 'Humor', phrase: 'registrando o humor' },
]

export type ChamaPrize = {
  id: string
  titulo: string
  regra: ChamaPrizeRule
  semanas: number
  /** quanto custa, se for algo pago (liga ao financeiro) */
  valor: number | null
  /** meta financeira criada para juntar o valor (fin_metas.id) */
  metaFinanceiraId?: number | null
  desde: string
  resgatadoEm: string | null
}

export type ChamaPrizeProgress = {
  prize: ChamaPrize
  done: number
  pct: number
  unlocked: boolean
}

/** Dias que contam para a regra: `byKind` vem do registro de atividade (água, tarefa, foco...). */
export function prizeProgress(
  prize: ChamaPrize,
  activeIsos: string[],
  byKind: Partial<Record<Exclude<ChamaPrizeRule, 'chama'>, string[]>>,
  ref = new Date(),
): ChamaPrizeProgress
{
  const isos = prize.regra === 'chama' ? activeIsos : byKind[prize.regra] ?? []
  const done = Math.min(prize.semanas, closedWeekCount(isos, prize.desde, ref))
  return {
    prize,
    done,
    pct: prize.semanas > 0 ? done / prize.semanas : 0,
    unlocked: done >= prize.semanas,
  }
}

export function prizeRuleLine(p: Pick<ChamaPrize, 'regra' | 'semanas'>): string
{
  const phrase = CHAMA_PRIZE_RULES.find((r) => r.id === p.regra)?.phrase ?? 'com registro'
  return `${p.semanas} semana${p.semanas === 1 ? '' : 's'} ${phrase} (${CHAMA_WEEK_GOAL_DAYS} dias por semana)`
}
