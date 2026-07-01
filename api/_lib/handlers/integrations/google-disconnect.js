// DELETE /api/integrations/google/disconnect

import { getSupabaseAdmin } from '../../supabaseAdmin.js';
import { corsJson, getUserFromBearer } from '../../supabaseUser.js';

export default async function handler(req, res)
{
  corsJson(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE' && req.method !== 'POST')
  {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getUserFromBearer(req);
  if (!user)
  {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase)
  {
    return res.status(500).json({ error: 'Supabase não configurado' });
  }

  await supabase
    .from('oauth_tokens')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', 'google');

  return res.status(200).json({ connected: false });
}
