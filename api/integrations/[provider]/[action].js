// Roteador único — integrações Google/Gmail (limite Hobby: 12 serverless functions)
import googleStatus from '../../../_lib/handlers/integrations/google-status.js';
import googleUrl from '../../../_lib/handlers/integrations/google-url.js';
import googleCallback from '../../../_lib/handlers/integrations/google-callback.js';
import googleDisconnect from '../../../_lib/handlers/integrations/google-disconnect.js';
import gmailSync from '../../../_lib/handlers/integrations/gmail-sync.js';
import gmailImapSettings from '../../../_lib/handlers/integrations/gmail-imap-settings.js';
import gmailImapStatus from '../../../_lib/handlers/integrations/gmail-imap-status.js';
import gmailImapSync from '../../../_lib/handlers/integrations/gmail-imap-sync.js';

const ROUTES = {
  'google|status': googleStatus,
  'google|url': googleUrl,
  'google|callback': googleCallback,
  'google|disconnect': googleDisconnect,
  'gmail|sync': gmailSync,
  'gmail|imap-settings': gmailImapSettings,
  'gmail|imap-status': gmailImapStatus,
  'gmail|imap-sync': gmailImapSync,
};

function pickQuery(value)
{
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function handler(req, res)
{
  const provider = pickQuery(req.query.provider);
  const action = pickQuery(req.query.action);
  const route = ROUTES[`${provider}|${action}`];

  if (!route)
  {
    return res.status(404).json({ error: 'Rota de integração não encontrada' });
  }

  return route(req, res);
}
