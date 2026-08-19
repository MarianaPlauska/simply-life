import { supabase } from './supabase'

/** Se a conta tem TOTP verificado e a sessão ainda é aal1, o login precisa do código. */
export async function getPendingTotpFactorId(): Promise<string | null>
{
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error || !data) return null
  if (data.currentLevel === 'aal2') return null
  if (data.nextLevel !== 'aal2') return null

  const { data: factors } = await supabase.auth.mfa.listFactors()
  const totp = (factors?.totp ?? []).find((f) => f.status === 'verified')
  return totp?.id ?? null
}

export async function verifyTotpCode(factorId: string, code: string): Promise<{ ok: true } | { ok: false; message: string }>
{
  const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId })
  if (chErr || !challenge)
  {
    return { ok: false, message: chErr?.message ?? 'Não foi possível iniciar o desafio 2FA' }
  }

  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: code.trim(),
  })

  if (error)
  {
    return { ok: false, message: 'Código 2FA inválido' }
  }

  return { ok: true }
}
