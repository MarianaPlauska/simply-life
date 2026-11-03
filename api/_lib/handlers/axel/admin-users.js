// POST /api/axel/admin-users - exclusão de conta (somente admin)

import { getSupabaseAdmin } from '../../supabaseAdmin.js';
import { explainBearer, corsJson } from '../../supabaseUser.js';

const FOUNDER_ADMIN_EMAILS = new Set([
  'marianaplauska.c@gmail.com',
  'marianaplauska.cf@gmail.com',
]);

async function assertAdmin(admin, caller)
{
  const email = String(caller.email || '').toLowerCase();
  if (FOUNDER_ADMIN_EMAILS.has(email))
  {
    return true;
  }

  const { data, error } = await admin
    .from('user_public_cards')
    .select('is_admin')
    .eq('user_id', caller.id)
    .maybeSingle();

  if (error || !data?.is_admin)
  {
    return false;
  }

  return true;
}

async function listDirectory(admin)
{
  const users = [];
  let page = 1;
  while (page <= 20)
  {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error)
    {
      return { error: error.message };
    }
    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < 200) break;
    page += 1;
  }

  const ids = users.map((u) => u.id);
  const cardsById = new Map();
  if (ids.length)
  {
    const { data: cards } = await admin
      .from('user_public_cards')
      .select('user_id, display_name, axel_calls_you, is_admin, streak_count, level, last_seen_at')
      .in('user_id', ids);
    for (const card of cards ?? [])
    {
      cardsById.set(card.user_id, card);
    }
  }

  return {
    users: users.map((u) =>
    {
      const card = cardsById.get(u.id);
      return {
        user_id: u.id,
        email: u.email ?? null,
        display_name: card?.display_name ?? '',
        axel_calls_you: card?.axel_calls_you ?? '',
        is_admin: Boolean(card?.is_admin) || FOUNDER_ADMIN_EMAILS.has(String(u.email || '').toLowerCase()),
        streak_count: card?.streak_count ?? 0,
        level: card?.level ?? 1,
        last_seen_at: card?.last_seen_at ?? null,
        last_sign_in_at: u.last_sign_in_at ?? null,
        created_at: u.created_at ?? null,
      };
    }),
  };
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

  const auth = await explainBearer(req);
  if (!auth.user)
  {
    const status = auth.error === 'Serviço indisponível' ? 503 : 401;
    return res.status(status).json({ error: auth.error || 'Não autenticado' });
  }
  const caller = auth.user;

  const admin = getSupabaseAdmin();
  if (!admin)
  {
    return res.status(503).json({ error: 'Serviço indisponível' });
  }

  if (!(await assertAdmin(admin, caller)))
  {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const action = req.body?.action;

  if (action === 'list')
  {
    const listed = await listDirectory(admin);
    if (listed.error)
    {
      return res.status(400).json({ error: listed.error });
    }
    return res.status(200).json({ users: listed.users });
  }

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
