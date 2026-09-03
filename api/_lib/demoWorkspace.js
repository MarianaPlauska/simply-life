/**
 * Conta demo compartilhada - nunca misturar com user_id de produção.
 */

export function demoEmailFromEnv()
{
  return (process.env.DEMO_EMAIL || process.env.VITE_DEMO_EMAIL || 'demo@simply-life.app')
    .trim()
    .toLowerCase()
}

export function isAllowedDemoUser(user)
{
  if (!user) return false
  const email = (user.email || '').trim().toLowerCase()
  if (email && email === demoEmailFromEnv()) return true
  const allowedId = (process.env.DEMO_USER_ID || '').trim()
  return Boolean(allowedId && user.id === allowedId)
}

export async function resetDemoWorkspace(supabase, userId)
{
  const { data, error } = await supabase.rpc('reset_demo_workspace', {
    p_user_id: userId,
  })
  if (error)
  {
    throw new Error(error.message)
  }
  return data
}

export async function resetConfiguredDemoAccount(supabase)
{
  const allowedId = (process.env.DEMO_USER_ID || '').trim()
  if (allowedId)
  {
    return resetDemoWorkspace(supabase, allowedId)
  }

  const { data: row, error } = await supabase
    .from('app_demo_account')
    .select('user_id')
    .limit(1)
    .maybeSingle()

  if (error || !row?.user_id)
  {
    return { skipped: true, reason: 'demo account not provisioned' }
  }

  return resetDemoWorkspace(supabase, row.user_id)
}
