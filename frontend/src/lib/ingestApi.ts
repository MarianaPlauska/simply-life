// Cliente HTTP — endpoint universal de ingestão ORION

export interface OrionIngestPayload
{
  user_id: string
  source: string
  title: string
  content: string
  priority?: string
}

export interface OrionIngestResult
{
  success: boolean
  id?: number
  score_urgencia?: number
  project_tag?: string | null
  error?: string
}

export async function postOrionIngest(
  payload: OrionIngestPayload,
  signature?: string,
): Promise<Response>
{
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (signature) headers['X-Webhook-Signature'] = signature

  return fetch('/api/webhooks/ingest', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}
