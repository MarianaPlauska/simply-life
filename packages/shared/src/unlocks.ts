import type { CollectionThemeId } from './chamaRewards'

/**
 * O que o XP libera. Cada nível abre itens que a pessoa vê antes de ganhar
 * (nada de surpresa). Alguns também podem ser comprados com moedas antes do
 * nível, para quem quer escolher o próprio caminho.
 */
export type UnlockKind = 'colecao' | 'avatar' | 'fundo' | 'moldura'

export type UnlockItem = {
  id: string
  kind: UnlockKind
  label: string
  /** nível que libera sem gastar nada */
  level: number
  /** compra antecipada na loja (moedas); null = só pelo nível */
  coins: number | null
  /** coleção: tema · avatar: ícone · fundo: cor ou padrão · moldura: estilo do anel */
  value: string
}

export type KanbanBackdrop =
  | { tipo: 'nenhum' }
  | { tipo: 'cor'; tom: 'areia' | 'salvia' | 'lavanda' | 'ceu' | 'pessego' }
  | { tipo: 'padrao'; desenho: 'pontos' | 'grade' | 'ondas' | 'estrelas' | 'folhas' }

/** Ordem pensada para cada nível ter algo de cada tipo, sem pular muito. */
export const UNLOCKS: UnlockItem[] = [
  // nível 1: o começo
  { id: 'col-jardim', kind: 'colecao', label: 'Coleção Jardim', level: 1, coins: null, value: 'jardim' },
  { id: 'col-ceu', kind: 'colecao', label: 'Coleção Céu', level: 1, coins: null, value: 'ceu' },
  { id: 'av-inicial', kind: 'avatar', label: 'Sua inicial', level: 1, coins: null, value: 'initials' },
  { id: 'fundo-nenhum', kind: 'fundo', label: 'Fundo padrão', level: 1, coins: null, value: 'nenhum' },
  { id: 'moldura-lisa', kind: 'moldura', label: 'Anel liso', level: 1, coins: null, value: 'lisa' },

  // nível 2
  { id: 'col-oceano', kind: 'colecao', label: 'Coleção Oceano', level: 2, coins: 60, value: 'oceano' },
  { id: 'av-gato', kind: 'avatar', label: 'Gato', level: 2, coins: 40, value: 'col-cat' },
  { id: 'fundo-areia', kind: 'fundo', label: 'Quadro cor areia', level: 2, coins: 40, value: 'cor:areia' },

  // nível 3
  { id: 'col-bichos', kind: 'colecao', label: 'Coleção Bichos', level: 3, coins: 80, value: 'bichos' },
  { id: 'av-cachorro', kind: 'avatar', label: 'Cachorro', level: 3, coins: 50, value: 'col-dog' },
  { id: 'fundo-pontos', kind: 'fundo', label: 'Quadro com pontinhos', level: 3, coins: 70, value: 'padrao:pontos' },
  { id: 'moldura-pontilhada', kind: 'moldura', label: 'Anel pontilhado', level: 3, coins: 50, value: 'pontilhada' },

  // nível 4
  { id: 'col-cozinha', kind: 'colecao', label: 'Coleção Cozinha', level: 4, coins: 90, value: 'cozinha' },
  { id: 'av-planta', kind: 'avatar', label: 'Planta', level: 4, coins: 60, value: 'col-potted-plant' },
  { id: 'fundo-salvia', kind: 'fundo', label: 'Quadro cor sálvia', level: 4, coins: 60, value: 'cor:salvia' },

  // nível 5
  { id: 'col-aventura', kind: 'colecao', label: 'Coleção Aventura', level: 5, coins: 100, value: 'aventura' },
  { id: 'av-foguete', kind: 'avatar', label: 'Foguete', level: 5, coins: 80, value: 'col-rocket' },
  { id: 'fundo-ondas', kind: 'fundo', label: 'Quadro com ondas', level: 5, coins: 90, value: 'padrao:ondas' },
  { id: 'moldura-dupla', kind: 'moldura', label: 'Anel duplo', level: 5, coins: 70, value: 'dupla' },

  // nível 6
  { id: 'col-viagem', kind: 'colecao', label: 'Coleção Viagem', level: 6, coins: 110, value: 'viagem' },
  { id: 'av-passaro', kind: 'avatar', label: 'Passarinho', level: 6, coins: 80, value: 'col-bird' },
  { id: 'fundo-grade', kind: 'fundo', label: 'Quadro quadriculado', level: 6, coins: 90, value: 'padrao:grade' },

  // nível 7
  { id: 'col-musica', kind: 'colecao', label: 'Coleção Música', level: 7, coins: 120, value: 'musica' },
  { id: 'av-violao', kind: 'avatar', label: 'Violão', level: 7, coins: 90, value: 'col-guitar' },
  { id: 'fundo-lavanda', kind: 'fundo', label: 'Quadro cor lavanda', level: 7, coins: 80, value: 'cor:lavanda' },

  // nível 8
  { id: 'col-arte', kind: 'colecao', label: 'Coleção Ateliê', level: 8, coins: 130, value: 'arte' },
  { id: 'av-coroa', kind: 'avatar', label: 'Coroa', level: 8, coins: 110, value: 'col-crown' },
  { id: 'fundo-folhas', kind: 'fundo', label: 'Quadro com folhas', level: 8, coins: 110, value: 'padrao:folhas' },
  { id: 'moldura-brilho', kind: 'moldura', label: 'Anel com brilho', level: 8, coins: 100, value: 'brilho' },

  // nível 9
  { id: 'fundo-ceu', kind: 'fundo', label: 'Quadro cor céu', level: 9, coins: 100, value: 'cor:ceu' },
  { id: 'av-planeta', kind: 'avatar', label: 'Planeta', level: 9, coins: 120, value: 'col-planet' },

  // nível 10
  { id: 'col-jogos', kind: 'colecao', label: 'Coleção Jogos', level: 10, coins: 150, value: 'jogos' },
  { id: 'av-diamante', kind: 'avatar', label: 'Diamante', level: 10, coins: 150, value: 'col-diamond' },
  { id: 'fundo-estrelas', kind: 'fundo', label: 'Quadro estrelado', level: 10, coins: 140, value: 'padrao:estrelas' },
  { id: 'fundo-pessego', kind: 'fundo', label: 'Quadro cor pêssego', level: 10, coins: 120, value: 'cor:pessego' },

  // mais avatares, de 3 a 5 por nível (12, 14 e 15 são metas longas)
  { id: 'av-sorriso', kind: 'avatar', label: 'Sorriso', level: 1, coins: null, value: 'happy' },
  { id: 'av-folha', kind: 'avatar', label: 'Folha', level: 1, coins: null, value: 'leaf' },
  { id: 'av-estrela', kind: 'avatar', label: 'Estrela', level: 1, coins: null, value: 'star' },
  { id: 'av-coracao', kind: 'avatar', label: 'Coração', level: 1, coins: null, value: 'heart' },
  { id: 'av-pata', kind: 'avatar', label: 'Patinha', level: 1, coins: null, value: 'paw' },
  { id: 'av-coelho', kind: 'avatar', label: 'Coelho', level: 2, coins: 54, value: 'col-rabbit' },
  { id: 'av-sol', kind: 'avatar', label: 'Sol nascendo', level: 2, coins: 54, value: 'col-sun-horizon' },
  { id: 'av-cafe', kind: 'avatar', label: 'Café', level: 2, coins: 54, value: 'cafe' },
  { id: 'av-borboleta', kind: 'avatar', label: 'Borboleta', level: 3, coins: 66, value: 'col-butterfly' },
  { id: 'av-piscadinha', kind: 'avatar', label: 'Piscadinha', level: 3, coins: 66, value: 'col-smiley-wink' },
  { id: 'av-guarda-chuva', kind: 'avatar', label: 'Guarda chuva', level: 3, coins: 66, value: 'col-umbrella' },
  { id: 'av-peixe', kind: 'avatar', label: 'Peixe', level: 4, coins: 78, value: 'col-fish' },
  { id: 'av-cacto', kind: 'avatar', label: 'Cacto', level: 4, coins: 78, value: 'col-cactus' },
  { id: 'av-picole', kind: 'avatar', label: 'Picolé', level: 4, coins: 78, value: 'col-popsicle' },
  { id: 'av-livros', kind: 'avatar', label: 'Livros', level: 4, coins: 78, value: 'col-books' },
  { id: 'av-vaca', kind: 'avatar', label: 'Vaca', level: 5, coins: 90, value: 'col-cow' },
  { id: 'av-lampada', kind: 'avatar', label: 'Ideia', level: 5, coins: 90, value: 'col-lightbulb' },
  { id: 'av-fone', kind: 'avatar', label: 'Fone', level: 5, coins: 90, value: 'col-headphones' },
  { id: 'av-cavalo', kind: 'avatar', label: 'Cavalo', level: 6, coins: 102, value: 'col-horse' },
  { id: 'av-palmeira', kind: 'avatar', label: 'Palmeira', level: 6, coins: 102, value: 'col-tree-palm' },
  { id: 'av-microfone', kind: 'avatar', label: 'Microfone', level: 6, coins: 102, value: 'col-microphone' },
  { id: 'av-joaninha', kind: 'avatar', label: 'Besouro', level: 6, coins: 102, value: 'col-bug-beetle' },
  { id: 'av-lua', kind: 'avatar', label: 'Lua estrelada', level: 7, coins: 114, value: 'col-moon-stars' },
  { id: 'av-disco', kind: 'avatar', label: 'Disco de vinil', level: 7, coins: 114, value: 'col-vinyl-record' },
  { id: 'av-piano', kind: 'avatar', label: 'Piano', level: 7, coins: 114, value: 'col-piano-keys' },
  { id: 'av-pinheiro', kind: 'avatar', label: 'Pinheiro', level: 8, coins: 126, value: 'col-tree-evergreen' },
  { id: 'av-fogueira', kind: 'avatar', label: 'Fogueira', level: 8, coins: 126, value: 'col-campfire' },
  { id: 'av-dado', kind: 'avatar', label: 'Dado', level: 8, coins: 126, value: 'col-dice-five' },
  { id: 'av-estudante', kind: 'avatar', label: 'Estudante', level: 8, coins: 126, value: 'col-student' },
  { id: 'av-camarao', kind: 'avatar', label: 'Camarão', level: 9, coins: 138, value: 'col-shrimp' },
  { id: 'av-cerebro', kind: 'avatar', label: 'Cérebro', level: 9, coins: 138, value: 'col-brain' },
  { id: 'av-controle', kind: 'avatar', label: 'Controle', level: 9, coins: 138, value: 'col-joystick' },
  { id: 'av-estrela-cadente', kind: 'avatar', label: 'Estrela cadente', level: 10, coins: 150, value: 'col-shooting-star' },
  { id: 'av-atomo', kind: 'avatar', label: 'Átomo', level: 10, coins: 150, value: 'col-atom' },
  { id: 'av-yin-yang', kind: 'avatar', label: 'Equilíbrio', level: 10, coins: 150, value: 'col-yin-yang' },
  { id: 'av-robo', kind: 'avatar', label: 'Robô', level: 12, coins: 174, value: 'col-robot' },
  { id: 'av-frasco', kind: 'avatar', label: 'Laboratório', level: 12, coins: 174, value: 'col-flask' },
  { id: 'av-detetive', kind: 'avatar', label: 'Detetive', level: 12, coins: 174, value: 'col-detective' },
  { id: 'av-fantasma', kind: 'avatar', label: 'Fantasminha', level: 14, coins: 198, value: 'col-ghost' },
  { id: 'av-escudo', kind: 'avatar', label: 'Escudo', level: 14, coins: 198, value: 'col-shield' },
  { id: 'av-espada', kind: 'avatar', label: 'Espada', level: 14, coins: 198, value: 'col-sword' },
  { id: 'av-alien', kind: 'avatar', label: 'Alien', level: 15, coins: 210, value: 'col-alien' },
  { id: 'av-varinha', kind: 'avatar', label: 'Varinha mágica', level: 15, coins: 210, value: 'col-magic-wand' },
  { id: 'av-hamburguer', kind: 'avatar', label: 'Hambúrguer', level: 15, coins: 210, value: 'col-hamburger' },
]

export const UNLOCK_KIND_LABEL: Record<UnlockKind, string> = {
  colecao: 'Coleção',
  avatar: 'Avatar',
  fundo: 'Fundo do quadro',
  moldura: 'Anel do avatar',
}

export function unlockById(id: string): UnlockItem | undefined
{
  return UNLOCKS.find((u) => u.id === id)
}

/** Liberado pelo nível ou comprado com moedas. */
export function isUnlocked(item: UnlockItem, level: number, owned: string[]): boolean
{
  return level >= item.level || owned.includes(item.id)
}

/** O que o próximo nível vai liberar (para mostrar antes). */
export function unlocksAtLevel(level: number): UnlockItem[]
{
  return UNLOCKS.filter((u) => u.level === level)
}

export function collectionUnlockId(tema: CollectionThemeId): string
{
  return `col-${tema}`
}

export function parseBackdrop(value: string | null | undefined): KanbanBackdrop
{
  if (!value || value === 'nenhum') return { tipo: 'nenhum' }
  const [tipo, nome] = value.split(':')
  if (tipo === 'cor' && nome) return { tipo: 'cor', tom: nome as Extract<KanbanBackdrop, { tipo: 'cor' }>['tom'] }
  if (tipo === 'padrao' && nome) return { tipo: 'padrao', desenho: nome as Extract<KanbanBackdrop, { tipo: 'padrao' }>['desenho'] }
  return { tipo: 'nenhum' }
}
