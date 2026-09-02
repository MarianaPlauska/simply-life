/** Contratos leves para sync mobile ↔ Supabase (sem depender do client) */

export type SyncResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }
