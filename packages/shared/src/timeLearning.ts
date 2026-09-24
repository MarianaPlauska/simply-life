/**
 * Aprender com o histórico quanto você costuma demorar.
 * Fonte: sessões de foco (tempo real) × estimativa da tarefa.
 * - Só usa tarefas concluídas (ou abertas que já passaram bem da estimativa)
 * - Mediana (robusta a um dia atípico), limitada a 0,6×–2,5×
 * - Por tipo de tarefa quando há amostras suficientes; senão, o geral
 * Nunca julga: "costuma levar mais" é informação para planejar melhor.
 */
import type { MobileTask } from './tasks'
import { foldText } from './taskPrompt'

export type FocusSessionLog = {
  taskId: string | null
  minutes: number
  /** ISO do fim da sessão */
  at: string
}

export type TaskKind = 'estudo' | 'escrita' | 'rapidas' | 'casa' | 'compras' | 'reunioes' | 'outros'

export const TASK_KIND_LABEL: Record<TaskKind, string> = {
  estudo: 'estudo',
  escrita: 'escrita e projetos',
  rapidas: 'tarefas rápidas (ligar, pagar, responder)',
  casa: 'casa e organização',
  compras: 'compras e rua',
  reunioes: 'reuniões e consultas',
  outros: 'outras tarefas',
}

const KIND_RULES: [TaskKind, RegExp][] = [
  ['reunioes', /\b(reuniao|consulta|encontro|call|entrevista)\b/],
  ['estudo', /\b(estudar|revisar|ler|prova|aula|curso|exercicio)\b/],
  ['escrita', /\b(escrever|relatorio|tcc|artigo|apresentacao|projeto|redigir|planejar)\b/],
  ['rapidas', /\b(ligar|mandar|enviar|pagar|responder|agendar|marcar|confirmar|avisar|renovar|cancelar|email)\b/],
  ['casa', /\b(limpar|arrumar|organizar|faxina|lavar|cozinhar|passar roupa)\b/],
  ['compras', /\b(comprar|mercado|buscar|levar|farmacia|banco)\b/],
]

export function taskKindOf(titulo: string): TaskKind
{
  const f = foldText(titulo)
  for (const [kind, re] of KIND_RULES)
  {
    if (re.test(f)) return kind
  }
  return 'outros'
}

export type LearnedFactor = { factor: number; samples: number }

export type TimeLearning = {
  overall: LearnedFactor | null
  byKind: Partial<Record<TaskKind, LearnedFactor>>
  /** minutos de foco registrados no total */
  totalFocusMinutes: number
  sessions: number
}

const MIN_SAMPLES_OVERALL = 5
const MIN_SAMPLES_KIND = 3
const MIN_FACTOR = 0.6
const MAX_FACTOR = 2.5

function median(values: number[]): number
{
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

function clampFactor(v: number): number
{
  return Math.round(Math.max(MIN_FACTOR, Math.min(MAX_FACTOR, v)) * 20) / 20
}

export function learnTimeFactors(tasks: MobileTask[], sessions: FocusSessionLog[]): TimeLearning
{
  const focusByTask = new Map<string, number>()
  let total = 0
  for (const s of sessions)
  {
    total += s.minutes
    if (s.taskId) focusByTask.set(s.taskId, (focusByTask.get(s.taskId) ?? 0) + s.minutes)
  }

  const ratios: { kind: TaskKind; r: number }[] = []
  for (const t of tasks)
  {
    const real = focusByTask.get(t.id)
    const est = t.estimativaMinutos || 0
    if (!real || est < 5 || real < 3) continue
    const done = t.status === 'done'
    // aberta mas já bem acima da estimativa: evidência de subestimar (limite inferior)
    if (!done && real < est * 1.2) continue
    ratios.push({ kind: taskKindOf(t.titulo), r: real / est })
  }

  const byKind: TimeLearning['byKind'] = {}
  const kinds = new Set(ratios.map((x) => x.kind))
  for (const k of kinds)
  {
    const rs = ratios.filter((x) => x.kind === k).map((x) => x.r)
    if (rs.length >= MIN_SAMPLES_KIND) byKind[k] = { factor: clampFactor(median(rs)), samples: rs.length }
  }
  const all = ratios.map((x) => x.r)
  return {
    overall: all.length >= MIN_SAMPLES_OVERALL ? { factor: clampFactor(median(all)), samples: all.length } : null,
    byKind,
    totalFocusMinutes: Math.round(total),
    sessions: sessions.length,
  }
}

/**
 * Fator para uma tarefa: o aprendido do tipo > o aprendido geral > a folga manual do perfil.
 * (Dado real vence o palpite.)
 */
export function learnedFactorFor(titulo: string, learning: TimeLearning | null | undefined, manualFactor = 1): number
{
  if (!learning) return manualFactor
  const kind = learning.byKind[taskKindOf(titulo)]
  if (kind) return kind.factor
  if (learning.overall) return learning.overall.factor
  return manualFactor
}

/** Frases gentis para mostrar o que foi aprendido. */
export function describeLearning(learning: TimeLearning): string[]
{
  const out: string[] = []
  const fmt = (f: number) => f.toFixed(2).replace(/0$/, '').replace('.', ',')
  const pct = (f: number) => Math.round(Math.abs(f - 1) * 100)
  if (learning.overall)
  {
    const f = learning.overall.factor
    out.push(
      Math.abs(f - 1) < 0.1
        ? `Suas estimativas estão certeiras (${learning.overall.samples} tarefas medidas).`
        : f > 1
          ? `No geral você leva cerca de ${fmt(f)}× o estimado (+${pct(f)}%). O Axel já planeja com essa folga.`
          : `No geral você termina antes do estimado (${pct(f)}% mais rápido). O Axel encaixa mais coisas por dia.`,
    )
  }
  const kinds = Object.entries(learning.byKind) as [TaskKind, LearnedFactor][]
  for (const [k, v] of kinds.sort((a, b) => Math.abs(b[1].factor - 1) - Math.abs(a[1].factor - 1)).slice(0, 3))
  {
    if (Math.abs(v.factor - 1) < 0.15) continue
    out.push(`Em ${TASK_KIND_LABEL[k]}: ${v.factor > 1 ? `leva ${fmt(v.factor)}× o estimado` : `termina ${pct(v.factor)}% mais rápido`} (${v.samples} tarefas).`)
  }
  if (!out.length)
  {
    const faltam = Math.max(0, MIN_SAMPLES_OVERALL - Object.values(learning.byKind).reduce((s, v) => s + (v?.samples ?? 0), 0))
    out.push(
      learning.sessions
        ? `Ainda aprendendo: use o timer em mais ${Math.max(1, faltam)} ${faltam === 1 ? 'tarefa' : 'tarefas'} e conclua para o Axel entender seu ritmo.`
        : 'Use o timer de foco nas tarefas: com o tempo real, o Axel aprende quanto você costuma demorar.',
    )
  }
  return out
}
