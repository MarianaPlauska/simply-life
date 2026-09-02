import crypto from 'crypto';

const TTL_MS = 24 * 60 * 60 * 1000;

function secret()
{
  return process.env.PUSH_ACTION_SECRET
    || process.env.CRON_SECRET
    || process.env.VAPID_PRIVATE_KEY
    || '';
}

export function signPushActionToken(payload)
{
  const key = secret();
  if (!key)
  {
    throw new Error('PUSH_ACTION_SECRET não configurado');
  }

  const body = { ...payload, exp: Date.now() + TTL_MS };
  const json = JSON.stringify(body);
  const sig = crypto.createHmac('sha256', key).update(json).digest('base64url');
  return `${Buffer.from(json, 'utf8').toString('base64url')}.${sig}`;
}

export function verifyPushActionToken(token)
{
  const key = secret();
  if (!key || !token || typeof token !== 'string')
  {
    return null;
  }

  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;

  const bodyB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let json;
  try
  {
    json = Buffer.from(bodyB64, 'base64url').toString('utf8');
  }
  catch
  {
    return null;
  }

  const expected = crypto.createHmac('sha256', key).update(json).digest('base64url');
  try
  {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
    {
      return null;
    }
  }
  catch
  {
    return null;
  }

  let payload;
  try
  {
    payload = JSON.parse(json);
  }
  catch
  {
    return null;
  }

  if (!payload?.exp || payload.exp < Date.now())
  {
    return null;
  }

  return payload;
}
