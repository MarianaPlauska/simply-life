import { supabase, supabaseConfigured } from '../supabase'

export type UnifiedEvent = {
  id: string
  source: string
  sender: string | null
  raw_subject: string | null
  resumo: string | null
  acao_sugerida: string | null
  score_urgencia: number
  dismissed: boolean
  created_at: string
}

export async function fetchInboxEvents(): Promise<UnifiedEvent[]>
{
  if (!supabaseConfigured) return []
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []
  const { data, error } = await supabase
    .from('unified_events')
    .select('id, source, sender, raw_subject, resumo, acao_sugerida, score_urgencia, dismissed, created_at')
    .eq('dismissed', false)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return (data ?? []) as UnifiedEvent[]
}

export async function dismissInboxEvent(id: string): Promise<void>
{
  if (!supabaseConfigured) return
  await supabase.from('unified_events').update({ dismissed: true }).eq('id', id)
}
