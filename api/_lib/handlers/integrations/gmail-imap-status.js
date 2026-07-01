// GET /api/integrations/gmail/imap-status

import { getSupabaseAdmin } from '../../supabaseAdmin.js'
import { corsJson, getUserFromBearer } from '../../supabaseUser.js'

export default async function handler(req, res)
{
  corsJson(res, req)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const user = await getUserFromBearer(req)
  if (!user)
  {
    return res.status(401).json({ error: 'Não autenticado' })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase)
  {
    return res.status(200).json({ configured: false })
  }

  const { data } = await supabase
    .from('gmail_imap_settings')
    .select('email, enabled, last_sync_at')
    .eq('user_id', user.id)
    .maybeSingle()

  return res.status(200).json({
    configured: Boolean(data?.enabled),
    email: data?.email ?? null,
    last_sync_at: data?.last_sync_at ?? null,
  })
}
