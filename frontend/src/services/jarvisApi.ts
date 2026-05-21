// cliente para as API routes serverless do Vercel (/api/*)
// todas as chamadas de IA/news passam por aqui pra não expor keys no frontend

const API_BASE = '/api';

// processa um evento (e-mail/mensagem) via Groq NLP
export async function processEventIA(params: {
  sender: string;
  subject: string;
  body: string;
  userKeywords?: string[];
}): Promise<{
  resumo: string;
  idioma_detectado: string;
  acao: 'responder' | 'fazer' | 'agendar' | 'ignorar';
  score_urgencia: number;
  keywords_detectadas: string[];
}>
{
  const res = await fetch(`${API_BASE}/process-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) throw new Error(`process-event: ${res.status}`);
  return res.json();
}

// gera saudação contextual JARVIS via Groq
export async function generateGreetingIA(params: {
  lat?: number;
  lon?: number;
  emailsUrgentes?: number;
  medsPendentes?: number;
  tarefasCriticas?: number;
  streak?: number;
  saldoMes?: number;
  proximoEvento?: string;
}): Promise<{
  greeting: string;
  weather: { temperatura: number; codigo: number; chovendo: boolean } | null;
  periodo: string;
}>
{
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) =>
  {
    if (v !== undefined && v !== null) query.set(k, String(v));
  });

  const res = await fetch(`${API_BASE}/generate-greeting?${query.toString()}`);
  if (!res.ok) throw new Error(`generate-greeting: ${res.status}`);
  return res.json();
}

// busca notícias reais via Google News RSS
export async function fetchNewsIA(topics: string[]): Promise<{
  news: Array<{
    titulo: string;
    resumo: string;
    url: string;
    fonte: string;
    topico: string;
    relevancia: number;
    timestamp: string;
  }>;
  topicsSearched: string[];
  updatedAt: string;
}>
{
  const res = await fetch(`${API_BASE}/fetch-news?topics=${encodeURIComponent(topics.join(','))}`);
  if (!res.ok) throw new Error(`fetch-news: ${res.status}`);
  return res.json();
}

// ── Motor de Triagem Ativa ──
// envia itens brutos para o backend processar via Gemini IA + Score Matemático
export interface IngestItem
{
  sender?: string;
  subject?: string;
  body?: string;
  origem?: string;
  created_at?: string;
}

export interface IngestResult
{
  success: boolean;
  id?: number;
  titulo?: string;
  score_urgencia?: number;
  prioridade?: string;
  breakdown?: {
    base: number;
    context: number;
    temporal: number;
    origem: string;
  };
  ai_flags?: {
    is_urgent: boolean;
    is_vip: boolean;
    is_bug: boolean;
    is_noise: boolean;
    acao: string;
  };
  error?: string;
}

export async function ingestTasksIA(params: {
  items: IngestItem[];
  user_id: string;
}): Promise<{
  processed: number;
  results: IngestResult[];
}>
{
  const res = await fetch(`${API_BASE}/ingest-tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) throw new Error(`ingest-tasks: ${res.status}`);
  return res.json();
}
