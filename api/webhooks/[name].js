// Roteador único — webhooks (limite Hobby: 12 serverless functions)
import ingest from '../_lib/handlers/webhooks/ingest.js';
import m2mIngest from '../_lib/handlers/webhooks/m2m-ingest.js';

const ROUTES = {
  ingest,
  m2m: m2mIngest,
};

function pickQuery(value)
{
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function handler(req, res)
{
  const name = pickQuery(req.query.name);
  const route = ROUTES[name];

  if (!route)
  {
    return res.status(404).json({ error: 'Webhook não encontrado' });
  }

  return route(req, res);
}
