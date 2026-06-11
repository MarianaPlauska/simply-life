import { getSupabaseAdmin } from './supabaseAdmin.js';

/**
 * Resolve usuário Supabase a partir do Bearer token.
 */
export async function getUserFromBearer(req)
{
  const header = req.headers.authorization || req.headers.Authorization || '';
  if (!header.startsWith('Bearer '))
  {
    return null;
  }

  const token = header.slice(7).trim();
  const supabase = getSupabaseAdmin();
  if (!supabase)
  {
    return null;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user)
  {
    return null;
  }

  return data.user;
}

export function corsJson(res)
{
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
