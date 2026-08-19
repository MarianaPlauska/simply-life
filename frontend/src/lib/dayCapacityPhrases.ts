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
  (c) => `Boa margem hoje · até ${priorities(c.importantTasks)} importantes.`,
  (c) => `Capacidade alta. Cabe até ${tasks(c.importantTasks)} sem apertar o dia.`,
  (c) => `Dia favorável · ${priorities(c.importantTasks)} com calma.`,
  (c) => `Energia e folga ok. Aproveite para ${tasks(c.importantTasks)}.`,
  (c) => `Tudo alinhado · o freio menor é ${c.bottleneckLabel.toLowerCase()} (${c.bottleneckPct}%).`,
]

const PLENO_IMPULSE_PHRASES: PhraseTemplate[] = [
  (c) => `Margem boa, mas ${c.bottleneckLabel.toLowerCase()} pede cautela · zero compra por impulso.`,
  (c) => `Caixa e humor ok; segure gastos emocionais · freio em ${c.bottleneckLabel.toLowerCase()}.`,
  (c) => `Até ${priorities(c.importantTasks)} · confortável, mas sem compras reativas.`,
]

const EQUILIBRADO_PHRASES: PhraseTemplate[] = [
  (c) => `${priorities(c.importantTasks)} em Hoje. O que mais limita: ${c.bottleneckLabel.toLowerCase()} · ${c.bottleneckDetail}.`,
  (c) => `Dia equilibrado. Gargalo em ${c.bottleneckLabel.toLowerCase()} (${c.bottleneckPct}%).`,
  (c) => `Ritmo moderado · ${tasks(c.importantTasks)} e atenção à ${c.bottleneckLabel.toLowerCase()}.`,
  (c) => `Capacidade na média. ${c.bottleneckDetail}.`,
  (c) => `Sustentável: ${priorities(c.importantTasks)}. Freio: ${c.bottleneckLabel.toLowerCase()}.`,
]

const CUIDADO_PHRASES: PhraseTemplate[] = [
  (c) => `Modo cuidado · ${tasks(c.importantTasks)}. Principal freio: ${c.bottleneckDetail}.`,
  (c) => `Capacidade moderada. ${c.bottleneckLabel} em ${c.bottleneckPct}% · vá com calma.`,
  (c) => `Pouca folga hoje. Priorize ${c.importantTasks} coisa${c.importantTasks !== 1 ? 's' : ''} e proteja energia.`,
  (c) => `O gargalo é ${c.bottleneckLabel.toLowerCase()}: ${c.bottleneckDetail}.`,
  (c) => `Não empilhe · ${tasks(c.importantTasks)} e pausas curtas.`,
]

const CUIDADO_MOOD_PHRASES: PhraseTemplate[] = [
  (c) => `Recuperação em curso · ${tasks(c.importantTasks)} e zero cobrança extra.`,
  (c) => `Corpo pedindo cuidado. ${c.bottleneckDetail}.`,
  (c) => `Humor frágil (${c.bottleneckPct}%) · proteja o básico e adie o resto.`,
]

const CRITICO_PHRASES: PhraseTemplate[] = [
  (c) => `Capacidade baixa · gargalo em ${c.bottleneckLabel.toLowerCase()}: ${c.bottleneckDetail}. Só o essencial.`,
  (c) => `Dia apertado. ${c.bottleneckLabel} (${c.bottleneckPct}%) puxa tudo para baixo · 1 prioridade.`,
  (c) => `Freio forte na ${c.bottleneckLabel.toLowerCase()}. ${c.bottleneckDetail}. Modo sobrevivência.`,
  (c) => `Não force a barra · ${c.bottleneckLabel.toLowerCase()} limita em ${c.bottleneckPct}%.`,
  (c) => `Essencial apenas. O que mais pesa: ${c.bottleneckDetail}.`,
]

const SEM_HUMOR_PHRASES: PhraseTemplate[] = [
  (c) => `Sem humor registrado. Gargalo provável: ${c.bottleneckLabel.toLowerCase()} · ${c.bottleneckDetail}.`,
  (c) => `Registre humor para calibrar. Por ora: ${tasks(c.importantTasks)} e atenção à ${c.bottleneckLabel.toLowerCase()}.`,
  (c) => `Falta humor hoje · estimativa baseada em ${c.bottleneckLabel.toLowerCase()} (${c.bottleneckDetail}).`,
]

const BOTTLENECK_FINANCE: PhraseTemplate[] = [
  (c) => `A folga financeira está apertada: ${c.bottleneckDetail}.`,
  (c) => `Boletos da semana pesam · ${c.bottleneckDetail}.`,
]

const BOTTLENECK_KANBAN: PhraseTemplate[] = [
  (c) => `A carga em Hoje está alta · ${c.bottleneckDetail}.`,
  (c) => `Kanban cheio: ${c.bottleneckDetail}.`,
]

const BOTTLENECK_MOOD: PhraseTemplate[] = [
  (c) => `Humor/energia baixos · ${c.bottleneckDetail}.`,
  (c) => `Como você está pesa hoje: ${c.bottleneckDetail}.`,
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
