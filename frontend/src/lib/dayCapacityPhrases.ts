// Frases do AXEL para capacidade do dia · banco rotativo por contexto

import type { CapacityMode } from './dayCapacity'
import type { CapacityFactorId } from './dayCapacityModel'

export interface PhraseContext
{
  mode: CapacityMode
  bottleneckId: CapacityFactorId
  bottleneckLabel: string
  bottleneckDetail: string
  bottleneckPct: number
  importantTasks: number
  hasMood: boolean
  impulseRisk: boolean
  moodProfile?: string
  /** Chave estável para variar frase no mesmo dia sem piscar */
  seed: string
}

type PhraseTemplate = (ctx: PhraseContext) => string

function tasks(n: number): string
{
  return `${n} foco${n !== 1 ? 's' : ''}`
}

function priorities(n: number): string
{
  return `${n} prioridade${n !== 1 ? 's' : ''}`
}

function pickIndex(seed: string, bucket: string, size: number): number
{
  if (size <= 1) return 0
  let hash = 0
  const key = `${seed}:${bucket}`
  for (let i = 0; i < key.length; i++)
  {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return hash % size
}

const PLENO_PHRASES: PhraseTemplate[] = [
  (c) => `Bom te ver. Cabe até ${priorities(c.importantTasks)} hoje, com calma.`,
  (c) => `O dia está folgado. ${priorities(c.importantTasks)} no seu ritmo.`,
  (c) => `Como você está? Tem espaço para ${tasks(c.importantTasks)} sem apertar.`,
  (c) => `Margem boa hoje. Aproveite para ${tasks(c.importantTasks)}, sem pressa.`,
  (c) => `Tudo alinhado. Se couber, olha ${priorities(c.importantTasks)}.`,
]

const PLENO_IMPULSE_PHRASES: PhraseTemplate[] = [
  (c) => `Margem boa — só evita compra por impulso. ${c.bottleneckLabel} pede calma.`,
  (c) => `Caixa e humor ok. Segura gasto reativo e segue ${priorities(c.importantTasks)}.`,
  (c) => `Até ${priorities(c.importantTasks)} · confortável, sem compras no piloto.`,
]

const EQUILIBRADO_PHRASES: PhraseTemplate[] = [
  (c) => `${priorities(c.importantTasks)} em Hoje. Quando fizer sentido, dá uma olhada.`,
  (c) => `Dia equilibrado. O que mais pede atenção: ${c.bottleneckLabel.toLowerCase()}.`,
  (c) => `Ritmo ok · ${tasks(c.importantTasks)}, no seu tempo.`,
  (c) => `Sustentável: ${priorities(c.importantTasks)}. Sem pressa.`,
  (c) => `Como você está? ${c.bottleneckDetail}`,
]

const CUIDADO_PHRASES: PhraseTemplate[] = [
  (c) => `Estou com você no ritmo curto · ${tasks(c.importantTasks)}.`,
  (c) => `Pouca folga hoje. Priorize ${c.importantTasks} coisa${c.importantTasks !== 1 ? 's' : ''} e proteja energia.`,
  (c) => `Vá com calma. ${c.bottleneckDetail}`,
  (c) => `Não empilhe · ${tasks(c.importantTasks)} e pausas curtas.`,
  (c) => `O essencial primeiro. ${c.bottleneckLabel} pede cuidado.`,
]

const CUIDADO_MOOD_PHRASES: PhraseTemplate[] = [
  (c) => `Recuperação em curso · ${tasks(c.importantTasks)} e zero cobrança extra.`,
  (c) => `Corpo pedindo cuidado. ${c.bottleneckDetail}`,
  () => 'Proteja o básico hoje. O resto espera.',
]

const CRITICO_PHRASES: PhraseTemplate[] = [
  () => 'Hoje pede o essencial, no seu tempo.',
  (c) => `Uma prioridade basta. ${c.bottleneckDetail}`,
  () => 'Não force a barra. Quando fizer sentido, olha o básico.',
  () => 'Dia curto de propósito. Estou com você.',
  (c) => `Só o que importa agora. ${c.bottleneckDetail}`,
]

const SEM_HUMOR_PHRASES: PhraseTemplate[] = [
  () => 'Como você está hoje?',
  () => 'Bom te ver. Como você está?',
  (c) => `Tem ${tasks(c.importantTasks)} em Hoje. Como você está?`,
]

const BOTTLENECK_FINANCE: PhraseTemplate[] = [
  (c) => `A folga financeira está apertada: ${c.bottleneckDetail}`,
  (c) => `Contas da semana pesam um pouco · ${c.bottleneckDetail}`,
]

const BOTTLENECK_KANBAN: PhraseTemplate[] = [
  (c) => `Hoje está cheio · ${c.bottleneckDetail}`,
  (c) => `A fila pede calma: ${c.bottleneckDetail}`,
]

const BOTTLENECK_MOOD: PhraseTemplate[] = [
  (c) => `Como você está pesa hoje: ${c.bottleneckDetail}`,
  (c) => `Energia baixa · ${c.bottleneckDetail}`,
]

function poolForContext(ctx: PhraseContext): PhraseTemplate[]
{
  if (!ctx.hasMood)
  {
    return [...SEM_HUMOR_PHRASES, ...poolForMode(ctx)]
  }

  const modePool = poolForMode(ctx)
  const bottleneckPool = bottleneckPoolFor(ctx.bottleneckId)
  return [...modePool, ...bottleneckPool]
}

function poolForMode(ctx: PhraseContext): PhraseTemplate[]
{
  if (ctx.mode === 'pleno')
  {
    return ctx.impulseRisk ? [...PLENO_PHRASES, ...PLENO_IMPULSE_PHRASES] : PLENO_PHRASES
  }
  if (ctx.mode === 'equilibrado') return EQUILIBRADO_PHRASES
  if (ctx.mode === 'cuidado')
  {
    if (ctx.moodProfile === 'recuperacao' || ctx.moodProfile === 'cuidado')
    {
      return [...CUIDADO_PHRASES, ...CUIDADO_MOOD_PHRASES]
    }
    return CUIDADO_PHRASES
  }
  return CRITICO_PHRASES
}

function bottleneckPoolFor(id: CapacityFactorId): PhraseTemplate[]
{
  if (id === 'finance') return BOTTLENECK_FINANCE
  if (id === 'kanban') return BOTTLENECK_KANBAN
  return BOTTLENECK_MOOD
}

export function pickCapacityPhrase(ctx: PhraseContext): string
{
  const pool = poolForContext(ctx)
  const idx = pickIndex(ctx.seed, `${ctx.mode}:${ctx.bottleneckId}`, pool.length)
  return pool[idx](ctx)
}

/** Total de templates únicos no banco (para referência / testes) */
export const CAPACITY_PHRASE_COUNT =
  PLENO_PHRASES.length
  + PLENO_IMPULSE_PHRASES.length
  + EQUILIBRADO_PHRASES.length
  + CUIDADO_PHRASES.length
  + CUIDADO_MOOD_PHRASES.length
  + CRITICO_PHRASES.length
  + SEM_HUMOR_PHRASES.length
  + BOTTLENECK_FINANCE.length
  + BOTTLENECK_KANBAN.length
  + BOTTLENECK_MOOD.length
