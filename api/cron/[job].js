// Roteador único - crons (limite Hobby: 12 serverless functions)

import gmailSync from '../_lib/handlers/cron/gmail-sync.js';
import pushBills from '../_lib/handlers/cron/push-bills.js';
import pushHealth from '../_lib/handlers/cron/push-health.js';
import daily from '../_lib/handlers/cron/daily.js';
import demoReset from '../_lib/handlers/cron/demo-reset.js';
import weeklyDigest from '../_lib/handlers/cron/weekly-digest.js';

const ROUTES = {
  daily,
  'gmail-sync': gmailSync,
  'push-bills': pushBills,
  'push-health': pushHealth,
  'demo-reset': demoReset,
  'weekly-digest': weeklyDigest,
};

function pickQuery(value)
{
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function handler(req, res)
{
  const job = pickQuery(req.query.job);
  const route = ROUTES[job];

  if (!route)
  {
    return res.status(404).json({ error: 'Cron não encontrado' });
  }

  return route(req, res);
}
