/** Conta demo compartilhada — o e-mail público não é segredo; a senha vem do env. */

export function demoLoginEmail(): string
{
  const fromEnv = (import.meta.env.VITE_DEMO_EMAIL as string | undefined)?.trim()
  return (fromEnv || 'demo@simply-life.app').toLowerCase()
}

export function demoLoginPassword(): string
{
  return ((import.meta.env.VITE_DEMO_PASSWORD as string | undefined) || '').trim()
}

export function isDemoEmail(email?: string | null): boolean
{
  if (!email) return false
  return email.trim().toLowerCase() === demoLoginEmail()
}

export async function resetDemoWorkspaceOnLogin(accessToken: string): Promise<void>
{
  const res = await fetch('/api/demo-login-reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!res.ok)
  {
    const data = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(data.error || 'Não foi possível restaurar o workspace demo')
  }
}
