// POST /api/integrations/google/callback — troca code por tokens e persiste

import { getSupabaseAdmin } from '../../supabaseAdmin.js';
import {
  exchangeCodeForTokens,
  parseOAuthState,
  upsertGoogleTokens,
} from '../../googleOAuth.js';
import { corsJson, getUserFromBearer } from '../../supabaseUser.js';

export default async function handler(req, res)
{
  corsJson(res, req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getUserFromBearer(req);
  if (!user)
  {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const { code, state } = req.body || {};
  if (!code)
  {
    return res.status(400).json({ error: 'code obrigatório' });
  }

  const stateUserId = parseOAuthState(state);
  if (stateUserId && stateUserId !== user.id)
  {
    return res.status(403).json({ error: 'State OAuth inválido' });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase)
  {
    return res.status(500).json({ error: 'Supabase não configurado' });
  }

  try
  {
    const tokens = await exchangeCodeForTokens(code);
    await upsertGoogleTokens(supabase, user.id, tokens);
    return res.status(200).json({ connected: true });
  }
  catch (err)
  {
    console.error('[google/callback]', err);
    return res.status(500).json({ error: err?.message || 'Falha no callback Google' });
  }
}
