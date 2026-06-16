import webpush from 'web-push';

export function getVapidPublicKey()
{
  return process.env.VAPID_PUBLIC_KEY || '';
}

export function isWebPushConfigured()
{
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function ensureConfigured()
{
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:support@simply.life';

  if (!publicKey || !privateKey)
  {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

/**
 * Envia push Web para uma subscription salva no Supabase.
 */
export async function sendWebPush(subscriptionRow, payload)
{
  if (!ensureConfigured())
  {
    throw new Error('VAPID não configurado');
  }

  const subscription = {
    endpoint: subscriptionRow.endpoint,
    keys: {
      p256dh: subscriptionRow.p256dh,
      auth: subscriptionRow.auth_key,
    },
  };

  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);

  return webpush.sendNotification(subscription, body);
}

/** Remove subscription inválida (410 Gone) */
export function isExpiredSubscriptionError(err)
{
  return err?.statusCode === 410 || err?.statusCode === 404;
}
