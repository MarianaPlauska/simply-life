/**
 * MFA TOTP - helpers portáveis (Supabase Auth).
 * O client supabase é injetado para não acoplar ao PWA.
 */

export type MfaClient = {
  auth: {
    mfa: {
      getAuthenticatorAssuranceLevel: () => Promise<{
        data: { currentLevel: string; nextLevel: string } | null
        error: { message: string } | null
      }>
      listFactors: () => Promise<{
        data: { totp?: Array<{ id: string; status: string }> } | null
      }>
      challenge: (args: { factorId: string }) => Promise<{
        data: { id: string } | null
        error: { message: string } | null
      }>
      verify: (args: {
        factorId: string
        challengeId: string
        code: string
      }) => Promise<{ error: { message: string } | null }>
    }
  }
}

/** Se a conta tem TOTP verificado e a sessão ainda é aal1, o login precisa do código. */
export async function getPendingTotpFactorId(client: MfaClient): Promise<string | null>
{
  const { data, error } = await client.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error || !data) return null
  if (data.currentLevel === 'aal2') return null
  if (data.nextLevel !== 'aal2') return null

  const { data: factors } = await client.auth.mfa.listFactors()
  const totp = (factors?.totp ?? []).find((f) => f.status === 'verified')
  return totp?.id ?? null
}

export async function verifyTotpCode(
  client: MfaClient,
  factorId: string,
  code: string,
): Promise<{ ok: true } | { ok: false; message: string }>
{
  const { data: challenge, error: chErr } = await client.auth.mfa.challenge({ factorId })
  if (chErr || !challenge)
  {
    return { ok: false, message: chErr?.message ?? 'Não foi possível iniciar o desafio 2FA' }
  }

  const { error } = await client.auth.mfa.verify({
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

export type TotpFactor = {
  id: string
  friendly_name?: string
  status: string
}

export type MfaEnrollClient = MfaClient & {
  auth: MfaClient['auth'] & {
    mfa: MfaClient['auth']['mfa'] & {
      enroll: (args: {
        factorType: 'totp'
        friendlyName?: string
      }) => Promise<{
        data: {
          id: string
          totp?: { qr_code?: string; secret?: string }
        } | null
        error: { message: string } | null
      }>
      unenroll: (args: { factorId: string }) => Promise<{
        error: { message: string } | null
      }>
      listFactors: () => Promise<{
        data: { totp?: TotpFactor[] } | null
      }>
    }
  }
}

export async function listVerifiedTotpFactors(
  client: MfaEnrollClient,
): Promise<TotpFactor[]>
{
  const { data } = await client.auth.mfa.listFactors()
  return (data?.totp ?? []).filter((f) => f.status === 'verified')
}
