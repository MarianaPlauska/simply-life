// GET /api/cron/push-bills — envia push de boletos ≤48h (Vercel Cron)
// Authorization: Bearer CRON_SECRET

import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import {
  buildUpcomingBillsServer,
  billsForPushWindow,
  billDeliveryKey,
  formatBillPushPayload,
} from '../_lib/financeUpcomingBillsServer.js';
import { sendWebPush, isWebPushConfigured, isExpiredSubscriptionError } from '../_lib/webPush.js';

export default async function handler(req, res)
{
  if (req.method !== 'GET' && req.method !== 'POST')
  {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || '';
  if (cronSecret && auth !== `Bearer ${cronSecret}`)
  {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!isWebPushConfigured())
  {
    return res.status(200).json({
      status: 'skipped',
      reason: 'VAPID não configurado',
    });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase)
  {
    return res.status(500).json({ error: 'Supabase não configurado' });
  }

  const { data: subs, error: subsErr } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth_key');

  if (subsErr)
  {
    return res.status(500).json({ error: subsErr.message });
  }

  const byUser = new Map();
  for (const row of subs || [])
  {
    if (!byUser.has(row.user_id))
    {
      byUser.set(row.user_id, []);
    }
    byUser.get(row.user_id).push(row);
  }

  const reference = new Date();
  const summary = [];

  for (const [userId, userSubs] of byUser.entries())
  {
    try
    {
      const [{ data: contasFixas }, { data: despesas }, { data: delivered }] = await Promise.all([
        supabase.from('fin_contas_fixas').select('*').eq('user_id', userId),
        supabase.from('despesas').select('id, descricao, valor, data_gasto, tipo, status_pagamento').eq('user_id', userId),
        supabase.from('push_bill_deliveries').select('bill_key').eq('user_id', userId),
      ]);

      const deliveredSet = new Set((delivered || []).map((d) => d.bill_key));
      const bills = billsForPushWindow(buildUpcomingBillsServer({
        contasFixas: contasFixas || [],
        despesas: despesas || [],
        reference,
      }));

      let sent = 0;
      let skipped = 0;

      for (const bill of bills)
      {
        const key = billDeliveryKey(bill.id, reference);
        if (deliveredSet.has(key))
        {
          skipped += 1;
          continue;
        }

        const payload = formatBillPushPayload(bill);
        let anyOk = false;

        for (const subRow of userSubs)
        {
          try
          {
            await sendWebPush(subRow, payload);
            anyOk = true;
          }
          catch (err)
          {
            if (isExpiredSubscriptionError(err))
            {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('id', subRow.id);
            }
          }
        }

        if (anyOk)
        {
          await supabase.from('push_bill_deliveries').upsert({
            user_id: userId,
            bill_key: key,
            sent_at: new Date().toISOString(),
          });
          sent += 1;
        }
      }

      summary.push({ user_id: userId, sent, skipped, bills: bills.length });
    }
    catch (err)
    {
      summary.push({
        user_id: userId,
        error: err?.message || 'push failed',
      });
    }
  }

  return res.status(200).json({
    status: 'ok',
    users: byUser.size,
    results: summary,
  });
}
