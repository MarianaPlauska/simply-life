// Push - avisos do Meu Mundo para quem usa pelo site (iPhone na tela de início).
// O app Android agenda os próprios avisos no aparelho; aqui só vai para inscrições web.
// Precisa ser chamado a cada 5 min (pg_cron no Supabase ou cron-job.org); a Vercel Hobby só roda 1x/dia.

import { getSupabaseAdmin } from '../../supabaseAdmin.js';
import { sendPushToSubscriptions } from '../../sendPushFanout.js';

const TZ = 'America/Sao_Paulo';
// janela de tolerância: o agendador pode atrasar alguns minutos
const WINDOW_MIN = 10;
const DAY_MS = 86_400_000;

function localParts(now)
{
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now).map((p) => [p.type, p.value]),
  );
  return { iso: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

function isoToUtc(iso)
{
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function addDays(iso, n)
{
  return new Date(isoToUtc(iso) + n * DAY_MS).toISOString().slice(0, 10);
}

function dow(iso)
{
  return new Date(isoToUtc(iso)).getUTCDay();
}

function monday(iso)
{
  const d = dow(iso);
  return addDays(iso, d === 0 ? -6 : 1 - d);
}

// Espelha blocoOccursOn (packages/shared/src/meuMundo.ts)
function occursOn(b, dia)
{
  const inicio = String(b.data_inicio).slice(0, 10);
  if (dia < inicio) return false;
  if (b.repete_ate && dia > String(b.repete_ate).slice(0, 10)) return false;
  if (b.repete === 'nao') return dia === inicio;
  if (b.repete === 'diario') return true;
  const dias = b.dias_semana?.length ? b.dias_semana : [dow(inicio)];
  if (!dias.includes(dow(dia))) return false;
  const weeks = Math.round((isoToUtc(monday(dia)) - isoToUtc(monday(inicio))) / (7 * DAY_MS));
  return weeks % Math.max(1, b.intervalo_semanas || 1) === 0;
}

function hhmm(min)
{
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

/** Avisos que caem entre (agora - janela) e agora, em minutos absolutos do dia de hoje/ontem. */
export function dueAlerts(blocos, marcas, now)
{
  const { iso: today, minutes: nowMin } = localParts(now);
  const yesterday = addDays(today, -1);
  const marcaBy = new Map(marcas.map((m) => [`${m.bloco_id}|${String(m.dia).slice(0, 10)}`, m]));
  const out = [];
  // ontem também, para avisos de 23h55 com o cron já depois da meia-noite
  for (const [dia, offset] of [[yesterday, -1440], [today, 0]])
  {
    for (const b of blocos)
    {
      if (!occursOn(b, dia)) continue;
      const marca = marcaBy.get(`${b.id}|${dia}`);
      if (marca?.status) continue;
      const inicio = marca?.hora_minutos ?? b.hora_minutos;
      if (inicio == null) continue;
      const fim = inicio + (b.duracao_minutos || 30);
      const candidates = [];
      if (b.aviso_minutos != null)
      {
        candidates.push({
          at: inicio - b.aviso_minutos,
          kind: 'a',
          title: b.aviso_minutos === 0 ? `Agora: ${b.titulo}` : `Daqui a ${b.aviso_minutos} min: ${b.titulo}`,
          body: `${hhmm(inicio)} às ${hhmm(fim % 1440)}`,
        });
      }
      if (b.aviso_fim)
      {
        candidates.push({
          at: fim,
          kind: 'f',
          title: `E aí, deu para fazer ${b.titulo}?`,
          body: 'Toque para marcar. Se não deu, tudo bem, a gente encaixa de novo.',
        });
      }
      for (const c of candidates)
      {
        const rel = c.at + offset;
        if (rel <= nowMin && rel > nowMin - WINDOW_MIN)
        {
          out.push({ ...c, key: `${b.id}:${dia}:${c.kind}`, dia });
        }
      }
    }
  }
  return out;
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

  const supabase = getSupabaseAdmin();
  if (!supabase)
  {
    return res.status(500).json({ error: 'Supabase não configurado' });
  }

  const { data: subs, error: subsErr } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth_key, provider')
    .neq('provider', 'expo');
  if (subsErr)
  {
    return res.status(500).json({ error: subsErr.message });
  }

  const byUser = new Map();
  for (const row of subs || [])
  {
    if (!byUser.has(row.user_id)) byUser.set(row.user_id, []);
    byUser.get(row.user_id).push(row);
  }

  const now = new Date();
  let sent = 0;
  for (const [userId, userSubs] of byUser.entries())
  {
    try
    {
      const { data: blocos } = await supabase
        .from('blocos')
        .select('*')
        .eq('user_id', userId)
        .is('deletado_em', null)
        .not('hora_minutos', 'is', null);
      if (!blocos?.length) continue;
      const { data: marcas } = await supabase
        .from('bloco_marcas')
        .select('bloco_id, dia, status, hora_minutos')
        .eq('user_id', userId)
        .gte('dia', addDays(localParts(now).iso, -1));
      const alerts = dueAlerts(blocos, marcas || [], now);
      if (!alerts.length) continue;

      const { data: done } = await supabase
        .from('bloco_avisos_enviados')
        .select('chave')
        .eq('user_id', userId)
        .in('chave', alerts.map((a) => a.key));
      const doneSet = new Set((done || []).map((d) => d.chave));

      for (const a of alerts)
      {
        if (doneSet.has(a.key)) continue;
        // marca antes de enviar: dois agendadores ao mesmo tempo não mandam em dobro
        const { error: claimErr } = await supabase
          .from('bloco_avisos_enviados')
          .insert({ user_id: userId, chave: a.key, sent_at: now.toISOString() });
        if (claimErr) continue;
        const fanout = await sendPushToSubscriptions(supabase, userSubs, {
          title: a.title,
          body: a.body,
          url: `/kanban?hub=mundo&dia=${a.dia}`,
          tag: `mundo-${a.key}`,
        });
        sent += fanout.sent;
      }
    }
    catch (err)
    {
      console.warn('[push-blocos]', userId, err?.message);
    }
  }

  return res.status(200).json({ ok: true, sent });
}
