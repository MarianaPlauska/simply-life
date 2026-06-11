// GET /api/integrations/google/status — verifica conexão Google

import { getSupabaseAdmin } from '../../_lib/supabaseAdmin.js';
import { corsJson, getUserFromBearer } from '../../_lib/supabaseUser.js';

export default async function handler(req, res)
{
  corsJson(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getUserFromBearer(req);
  if (!user)
  {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase)
  {
    return res.status(200).json({ connected: false });
  }

  const { data } = await supabase
    .from('oauth_tokens')
    .select('id, last_gmail_sync_at, gmail_sync_enabled')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .maybeSingle();

  return res.status(200).json({
    connected: Boolean(data),
    last_gmail_sync_at: data?.last_gmail_sync_at ?? null,
    gmail_sync_enabled: data?.gmail_sync_enabled ?? false,
  });
}
