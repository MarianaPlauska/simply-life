import { supabaseAuthHeaders } from '../lib/supabaseAuthHeaders'
import type { AxelTodayVerdict } from '../lib/axelTodayVerdict'

// Cliente AXEL - API routes serverless (/api/* → /api/axel/*)
const API_BASE = '/api'

export async function processEventIA(params: {
  sender: string
  subject: string
  body: string
  userKeywords?: string[]
}): Promise<{
  resumo: string
  idioma_detectado: string
  acao: 'responder' | 'fazer' | 'agendar' | 'ignorar'
  score_urgencia: number
  keywords_detectadas: string[]
}>
{
  const headers = await supabaseAuthHeaders()
  const res = await fetch(`${API_BASE}/process-event`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  })

  if (!res.ok) throw new Error(`process-event: ${res.status}`)
  return res.json()
}

export async function generateGreetingIA(params: {
  lat?: number
  lon?: number
  emailsUrgentes?: number
  medsPendentes?: number
  tarefasCriticas?: number
  streak?: number
  saldoMes?: number
  proximoEvento?: string
}): Promise<{
  greeting: string
  weather: { temperatura: number; codigo: number; chovendo: boolean } | null
  periodo: string
}>
{
  const query = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) =>
  {
    if (v !== undefined && v !== null) query.set(k, String(v))
  })

  const res = await fetch(`${API_BASE}/generate-greeting?${query.toString()}`)
  if (!res.ok) throw new Error(`generate-greeting: ${res.status}`)
  return res.json()
}

export async function fetchNewsIA(topics: string[]): Promise<{
  news: Array<{
    titulo: string
    resumo: string
    url: string
    fonte: string
    topico: string
    relevancia: number
    timestamp: string
  }>
  topicsSearched: string[]
  updatedAt: string
}>
{
  const res = await fetch(`${API_BASE}/fetch-news?topics=${encodeURIComponent(topics.join(','))}`)
  if (!res.ok) throw new Error(`fetch-news: ${res.status}`)
  return res.json()
}

export interface IngestItem
{
  sender?: string
  subject?: string
  body?: string
  origem?: string
  created_at?: string
}

export interface IngestResult
{
  success: boolean
  id?: number
  titulo?: string
  score_urgencia?: number
  prioridade?: string
  breakdown?: {
    base: number
    context: number
    temporal: number
    origem: string
  }
  ai_flags?: {
    is_urgent: boolean
    is_vip: boolean
    is_bug: boolean
    is_noise: boolean
    acao: string
  }
  error?: string
}

export interface FinanceCoachIAResponse
{
  headline: string
  detail: string
  tone: 'ok' | 'caution' | 'urgent'
  limiteDiarioSugerido: number | null
  limitSuggestions: Array<{
    categoriaNome: string
    valorSugerido: number
    motivo: string
  }>
  source: 'local' | 'groq'
  iaDisponivel?: boolean
}

export interface FinancePurchaseCheckIAResponse
{
  tone: 'ok' | 'caution' | 'wait'
  headline: string
  detail: string
  folgaAposCompra?: number
  limiteDiarioRestante?: number | null
  categoriaNome?: string
  categoriaPctApos?: number
  diasSugeridos?: number | null
  source: 'local' | 'groq'
  iaDisponivel?: boolean
}

export interface AxelTodayVerdictIAResponse extends AxelTodayVerdict
{
  source: 'local' | 'groq'
  iaDisponivel?: boolean
}

/** AXEL - "posso comprar?" antes de confirmar gasto */
export async function fetchFinancePurchaseCheckIA(params: {
  context: Record<string, unknown>
  localVerdict: Record<string, unknown>
}): Promise<FinancePurchaseCheckIAResponse>
{
  const res = await fetch(`${API_BASE}/finance-purchase-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      context: params.context,
      localVerdict: params.localVerdict,
    }),
  })

  if (!res.ok) throw new Error(`finance-purchase-check: ${res.status}`)
  return res.json()
}

/** AXEL - "posso fazer isso hoje?" com refinamento IA */
export async function fetchAxelTodayVerdictIA(params: {
  context: Record<string, unknown>
  localVerdict: AxelTodayVerdict
  signal?: AbortSignal
}): Promise<AxelTodayVerdictIAResponse>
{
  const res = await fetch(`${API_BASE}/today-verdict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      context: params.context,
      localVerdict: params.localVerdict,
    }),
    signal: params.signal,
  })

  if (!res.ok) throw new Error(`today-verdict: ${res.status}`)
  return res.json()
}

export async function fetchFinanceCoachIA(params: {
  context: Record<string, unknown>
  localAdvice: Record<string, unknown>
  aiTone?: string
  signal?: AbortSignal
}): Promise<FinanceCoachIAResponse>
{
  const res = await fetch(`${API_BASE}/finance-coach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      context: params.context,
      localAdvice: params.localAdvice,
      aiTone: params.aiTone,
    }),
    signal: params.signal,
  })

  if (!res.ok) throw new Error(`finance-coach: ${res.status}`)
  return res.json()
}

export async function ingestTasksIA(params: {
  items: IngestItem[]
}): Promise<{
  processed: number
  results: IngestResult[]
}>
{
  const headers = await supabaseAuthHeaders()
  const res = await fetch(`${API_BASE}/ingest-tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ items: params.items }),
  })

  if (!res.ok) throw new Error(`ingest-tasks: ${res.status}`)
  return res.json()
}

export interface TaskEstimateIAResponse
{
  estimate_minutes: number
  extension_days: number
  reasoning: string
  confidence: number
  source: 'local' | 'groq'
  iaDisponivel: boolean
}

export async function fetchTaskEstimateIA(params: {
  titulo: string
  descricao?: string
  prioridade?: string
  status?: string
  subtarefas?: Array<{ titulo: string; concluida: boolean }>
  activityEntryCount?: number
  elapsedFocusMinutes?: number
  difficultySignal?: boolean
  score_urgencia?: number
}): Promise<TaskEstimateIAResponse>
{
  const res = await fetch(`${API_BASE}/task-estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!res.ok) throw new Error(`task-estimate: ${res.status}`)
  return res.json()
}
