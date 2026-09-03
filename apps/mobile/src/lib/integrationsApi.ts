import { apiFetch } from './apiBase'
import { supabase, supabaseConfigured } from './supabase'
import type { AuthedJsonFetch } from '@simply-life/shared'

export async function authedApi(): Promise<AuthedJsonFetch>
{
  return async (path, init) =>
  {
    let token: string | null = null
    if (supabaseConfigured)
    {
      const { data } = await supabase.auth.getSession()
      token = data.session?.access_token ?? null
    }
    const res = await apiFetch(path, {
      method: init?.method,
      token,
      body: init?.body,
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    return { ok: res.ok, json }
  }
}
