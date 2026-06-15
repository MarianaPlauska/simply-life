// GET /api/integrations/google/url — URL de autorização OAuth Google

import { buildGoogleAuthUrl } from '../../googleOAuth.js';
import { corsJson, getUserFromBearer } from '../../supabaseUser.js';

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

  try
  {
    const { url, state } = buildGoogleAuthUrl(user.id);
    return res.status(200).json({ url, state });
  }
  catch (err)
  {
    return res.status(500).json({ error: err?.message || 'Erro ao gerar URL' });
  }
}
