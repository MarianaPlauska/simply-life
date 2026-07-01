import crypto from 'crypto';

/** SHA-256 do secret — mesmo algoritmo da migration 037 */
export function hashWebhookSecret(plain)
{
  return crypto.createHash('sha256').update(String(plain)).digest('hex');
}

export function verifyWebhookBearer(plain, storedHash)
{
  if (!plain || !storedHash) return false;

  const computed = hashWebhookSecret(plain);

  try
  {
    return crypto.timingSafeEqual(
      Buffer.from(computed, 'utf8'),
      Buffer.from(storedHash, 'utf8'),
    );
  }
  catch
  {
    return false;
  }
}

/** Bearer do webhook — nunca persiste em log */
export function extractWebhookBearer(req)
{
  const auth = req.headers.authorization || req.headers.Authorization || '';
  if (auth.startsWith('Bearer '))
  {
    return auth.slice(7).trim();
  }

  const legacy = req.headers['x-webhook-secret'];
  if (legacy)
  {
    return String(legacy).trim();
  }

  return null;
}
