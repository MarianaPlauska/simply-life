import crypto from 'crypto';

export function verifyWebhookSignature(bodyRaw, signatureHeader, secret)
{
  if (!secret || !signatureHeader) return false;

  const expected = crypto.createHmac('sha256', secret).update(bodyRaw).digest('hex');
  const provided = String(signatureHeader).replace(/^sha256=/i, '').trim();

  try
  {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  }
  catch
  {
    return false;
  }
}
