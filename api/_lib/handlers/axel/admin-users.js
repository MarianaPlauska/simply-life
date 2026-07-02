// POST /api/axel/admin-users — exclusão de conta (somente admin)

import { getSupabaseAdmin } from '../../supabaseAdmin.js';
import { getUserFromBearer, corsJson } from '../../supabaseUser.js';

async function assertAdmin(admin, callerId)
{
  const { data, error } = await admin
    .from('user_public_cards')
    .select('is_admin')
    .eq('user_id', callerId)
    .maybeSingle();

  if (error || !data?.is_admin)
  {
    return false;
  }

  return true;
}

export default async function handler(req, res)
{
  corsJson(res, req);

  if (req.method === 'OPTIONS')
  {
    return res.status(204).end();
  }

  if (req.method !== 'POST')
  {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const caller = await getUserFromBearer(req);
  if (!caller)
  {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const admin = getSupabaseAdmin();
  if (!admin)
  {
    return res.status(503).json({ error: 'Serviço indisponível' });
  }

  if (!(await assertAdmin(admin, caller.id)))
  {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const action = req.body?.action;
  const targetUserId = req.body?.userId;

  if (!targetUserId || typeof targetUserId !== 'string')
  {
    return res.status(400).json({ error: 'userId obrigatório' });
  }

  if (targetUserId === caller.id)
  {
    return res.status(400).json({ error: 'Não é possível excluir a própria conta por aqui' });
  }

  if (action === 'delete')
  {
    const { error } = await admin.auth.admin.deleteUser(targetUserId);
    if (error)
    {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Ação inválida' });
}
