// Push — medicamentos na janela + lembrete de bem-estar (humor do dia)

import { getSupabaseAdmin } from '../../supabaseAdmin.js';
import { sendWebPush, isWebPushConfigured, isExpiredSubscriptionError } from '../../webPush.js';
import {
  buildDosesHoje,
  proximaDosePendente,
  mensagemGentilDose,
  doseDeliveryKey,
} from '../../medicamentosScheduleServer.js';

function localTodayIso(now = new Date())
{
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function diasEntre(hoje, alvo)
{
  const a = new Date(`${hoje}T12:00:00`);
  const b = new Date(`${alvo}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

const CONSULTA_PUSH_DIAS = [7, 3, 1, 0];

function mensagemConsultaPush(nome, consulta, dias)
{
  if (dias === 0) return `Consulta hoje para renovar ${nome}.`;
  if (dias === 1) return `Amanhã: consulta para renovar ${nome}.`;
  return `Em ${dias} dias (${consulta}): renovar receita de ${nome}.`;
}

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
    return res.status(200).json({ status: 'skipped', reason: 'VAPID não configurado' });
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

  const now = new Date();
  const today = localTodayIso(now);
  const summary = [];

  for (const [userId, userSubs] of byUser.entries())
  {
    try
    {
      let medSent = 0;
      let wellbeingSent = 0;
      let consultaSent = 0;

      const [{ data: medicamentos }, { data: tomadas }, { data: medDelivered }] = await Promise.all([
        supabase.from('medicamentos').select('*').eq('user_id', userId),
        supabase.from('medicamento_tomadas').select('*').eq('user_id', userId),
        supabase.from('push_medication_deliveries').select('dose_key').eq('user_id', userId),
      ]);

      const medDeliveredSet = new Set((medDelivered || []).map((d) => d.dose_key));
      const doses = buildDosesHoje(medicamentos || [], tomadas || [], now);
      const pendente = proximaDosePendente(doses);

      if (pendente)
      {
        const doseKey = doseDeliveryKey(pendente.medicamentoId, pendente.horario, today);
        if (!medDeliveredSet.has(doseKey))
        {
          const payload = {
            title: 'AXEL · Medicamento',
            body: mensagemGentilDose(pendente),
            url: '/saude#medicamentos',
            tag: `med-${doseKey}`,
          };
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
                await supabase.from('push_subscriptions').delete().eq('id', subRow.id);
              }
            }
          }
          if (anyOk)
          {
            await supabase.from('push_medication_deliveries').upsert({
              user_id: userId,
              dose_key: doseKey,
              sent_at: now.toISOString(),
            });
            medSent += 1;
          }
        }
      }

      for (const med of medicamentos || [])
      {
        const cfg = typeof med.config === 'object' && med.config !== null ? med.config : {};
        const consulta = cfg.consulta_renovacao;
        if (!consulta) continue;

        const dias = diasEntre(today, consulta);
        if (!CONSULTA_PUSH_DIAS.includes(dias)) continue;

        const consultaKey = `consulta:${med.id}:${consulta}:d${dias}`;
        if (medDeliveredSet.has(consultaKey)) continue;

        const payload = {
          title: 'AXEL · Consulta médica',
          body: mensagemConsultaPush(med.nome, consulta, dias),
          url: '/kanban',
          tag: consultaKey,
        };

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
              await supabase.from('push_subscriptions').delete().eq('id', subRow.id);
            }
          }
        }

        if (anyOk)
        {
          await supabase.from('push_medication_deliveries').upsert({
            user_id: userId,
            dose_key: consultaKey,
            sent_at: now.toISOString(),
          });
          consultaSent += 1;
        }
      }

      const hour = now.getHours();
      if (hour >= 9 && hour <= 20)
      {
        const [{ data: humorHoje }, { data: prefsRow }, { data: wbDelivered }] = await Promise.all([
          supabase.from('diario_humor').select('id').eq('user_id', userId).gte('criado_em', `${today}T00:00:00`),
          supabase.from('user_workspace_prefs').select('prefs').eq('user_id', userId).maybeSingle(),
          supabase.from('push_wellbeing_deliveries').select('nudge_key').eq('user_id', userId),
        ]);

        const prefs = prefsRow?.prefs ?? {};
        const hiddenUntil = prefs.wellbeing_dashboard_hidden_until;
        const snoozed = hiddenUntil && Date.now() < new Date(hiddenUntil).getTime();
        const nudgeKey = `mood-checkin:${today}`;
        const wbSet = new Set((wbDelivered || []).map((d) => d.nudge_key));

        if (!humorHoje?.length && !snoozed && !wbSet.has(nudgeKey))
        {
          const payload = {
            title: 'AXEL · Bem-estar',
            body: 'Como você está hoje? Um toque no humor já ajuda.',
            url: '/#dashboard-wellbeing',
            tag: nudgeKey,
          };
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
                await supabase.from('push_subscriptions').delete().eq('id', subRow.id);
              }
            }
          }
          if (anyOk)
          {
            await supabase.from('push_wellbeing_deliveries').upsert({
              user_id: userId,
              nudge_key: nudgeKey,
              sent_at: now.toISOString(),
            });
            wellbeingSent += 1;
          }
        }
      }

      summary.push({ user_id: userId, medSent, consultaSent, wellbeingSent });
    }
    catch (err)
    {
      summary.push({ user_id: userId, error: err?.message || 'push failed' });
    }
  }

  return res.status(200).json({
    status: 'ok',
    users: byUser.size,
    results: summary,
  });
}
