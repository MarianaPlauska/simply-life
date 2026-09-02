/**
 * Fan-out: Web Push (VAPID) + Expo Push a partir de push_subscriptions.
 */
import { sendWebPush, isExpiredSubscriptionError, isWebPushConfigured } from './webPush.js'
import { sendExpoPush, isExpoSubscriptionRow, isExpiredExpoError } from './expoPush.js'

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {Array<{ id?: number, endpoint: string, p256dh?: string, auth_key?: string, provider?: string }>} rows
 * @param {object} payload
 * @returns {Promise<{ sent: number, removed: number }>}
 */
export async function sendPushToSubscriptions(supabase, rows, payload)
{
  let sent = 0
  let removed = 0

  for (const row of rows || [])
  {
    try
    {
      if (isExpoSubscriptionRow(row))
      {
        await sendExpoPush(row.endpoint, payload)
        sent += 1
        continue
      }

      if (!isWebPushConfigured())
      {
        continue
      }

      await sendWebPush(row, payload)
      sent += 1
    }
    catch (err)
    {
      const expired = isExpoSubscriptionRow(row)
        ? isExpiredExpoError(err)
        : isExpiredSubscriptionError(err)

      if (expired && supabase)
      {
        if (row.id)
        {
          await supabase.from('push_subscriptions').delete().eq('id', row.id)
        }
        else
        {
          await supabase.from('push_subscriptions').delete().eq('endpoint', row.endpoint)
        }
        removed += 1
      }
    }
  }

  return { sent, removed }
}
