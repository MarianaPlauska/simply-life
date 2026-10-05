import { getSupabaseAdmin } from './supabaseAdmin.js';
import { applyCors } from './cors.js';

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

  // Duas etapas valem no servidor, não só no app: quem tem fator TOTP
  // verificado precisa de sessão aal2. Senha sozinha não passa daqui.
  if (hasVerifiedFactor(data.user) && tokenAal(token) !== 'aal2')
  {
    return null;
  }

  return data.user;
}

/** Nível de autenticação do JWT (aal1 = só senha, aal2 = com a segunda etapa). */
export function tokenAal(token)
{
  try
  {
    const payload = token.split('.')[1] || '';
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(json).aal || 'aal1';
  }
  catch
  {
    return 'aal1';
  }
}

/**
 * Segundos desde o último login de verdade (senha, OAuth ou TOTP), pelo amr
 * do JWT. Renovar o token não conta: só entrar de novo. Infinity se não houver.
 */
export function secondsSinceLastAuth(token)
{
  try
  {
    const payload = token.split('.')[1] || '';
    const json = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    const stamps = (Array.isArray(json.amr) ? json.amr : []).map((m) => Number(m?.timestamp)).filter(Number.isFinite);
    if (stamps.length === 0) return Infinity;
    return Math.floor(Date.now() / 1000) - Math.max(...stamps);
  }
  catch
  {
    return Infinity;
  }
}

export function hasVerifiedFactor(user)
{
  return Array.isArray(user?.factors) && user.factors.some((f) => f?.status === 'verified');
}

export function corsJson(res, req)
{
  applyCors(req, res, {
    methods: 'GET, POST, DELETE, OPTIONS',
    headers: 'Content-Type, Authorization',
  });
}
