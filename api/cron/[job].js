// Roteador único — crons (limite Hobby: 12 serverless functions)

import gmailSync from '../_lib/handlers/cron/gmail-sync.js';
import pushBills from '../_lib/handlers/cron/push-bills.js';

const ROUTES = {
  'gmail-sync': gmailSync,
  'push-bills': pushBills,
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
