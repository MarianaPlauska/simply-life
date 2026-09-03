/** Soneca de lembretes push - evita reenvio até o prazo */

export async function isPushSnoozed(supabase, userId, snoozeKey, now = new Date())
{
  if (!snoozeKey) return false;

  const { data, error } = await supabase
    .from('push_snoozes')
    .select('snooze_until')
    .eq('user_id', userId)
    .eq('snooze_key', snoozeKey)
    .maybeSingle();

  if (error || !data?.snooze_until)
  {
    return false;
  }

  return new Date(data.snooze_until).getTime() > now.getTime();
}

export async function snoozePushReminder(supabase, userId, snoozeKey, minutes = 30)
{
  const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();

  await supabase.from('push_snoozes').upsert({
    user_id: userId,
    snooze_key: snoozeKey,
    snooze_until: until,
  });

  return until;
}
