import { persistStorage, whenPersistReady } from './persistStorage'
import { GAMIFICATION_LOCAL_KEYS, useGamificationStore } from '../store/gamificationStore'
import { ACTIVITY_LOCAL_KEYS, useActivityStore } from '../store/activityStore'

/**
 * Dados de gamificação e do elo são por conta, mas moram no aparelho.
 * No "Sair" de uma conta logada eles saem do aparelho, para a próxima conta
 * não herdar elo nem XP (nem mandar esse XP para as ligas dela).
 * Convidado que cria conta mantém tudo (o "Sair" do convidado não limpa).
 */

/** Conta dona dos dias já enviados ao servidor neste aparelho. */
export const ELO_SYNC_UID_KEY = 'simply_life_elo_sync_uid_v1'

const SNAP_PREFIX = 'simply_life_user_snapshot_v1:'

/**
 * Só números e ids, nada sensível (o histórico do Axel tem títulos de
 * tarefas e fica de fora). Voltam se a mesma conta entrar de novo aqui.
 * Os dias do elo voltam do servidor.
 */
const SNAP_KEYS = [
  'simply-life-xp-total',
  'simply-life-gold',
  'simply-life-achievements',
  'simply-life-shop-owned',
  'simply-life-xp-weeks',
  'simply-life-xp-weeks-area',
  'simply_life_elo_recorde_v1',
]

function snapKey(uid: string): string
{
  return `${SNAP_PREFIX}${uid.replace(/[^A-Za-z0-9-]/g, '')}`
}

/** Guarda o resumo da conta e limpa o aparelho. */
export function stashAndClearUserLocal(uid: string | null): void
{
  if (uid)
  {
    const snap: Record<string, string> = {}
    for (const key of SNAP_KEYS)
    {
      const v = persistStorage.getItem(key)
      if (v != null) snap[key] = v
    }
    if (Object.keys(snap).length) persistStorage.setItem(snapKey(uid), JSON.stringify(snap))
  }
  useGamificationStore.getState().reset()
  useActivityStore.getState().reset()
  persistStorage.removeItem(ELO_SYNC_UID_KEY)
  // garante que nenhuma chave por conta ficou para trás
  for (const key of [...GAMIFICATION_LOCAL_KEYS, ...ACTIVITY_LOCAL_KEYS]) persistStorage.removeItem(key)
}

/**
 * Ao entrar numa conta: se o aparelho está limpo e há um resumo guardado
 * desta conta, devolve. Nunca mistura com dados de outra pessoa.
 */
export async function restoreUserLocal(uid: string): Promise<void>
{
  await whenPersistReady()
  const key = snapKey(uid)
  const raw = persistStorage.getItem(key)
  if (!raw) return
  const gam = useGamificationStore.getState()
  const act = useActivityStore.getState()
  gam.hydrate()
  act.hydrate()
  const limpo = useGamificationStore.getState().totalXp <= 0
    && Object.keys(useActivityStore.getState().days).length === 0
  if (!limpo) return
  try
  {
    const snap = JSON.parse(raw) as Record<string, unknown>
    for (const k of SNAP_KEYS)
    {
      const v = snap[k]
      if (typeof v === 'string') persistStorage.setItem(k, v)
    }
  }
  catch
  {
    /* resumo inválido: segue do zero */
  }
  persistStorage.removeItem(key)
  useGamificationStore.getState().hydrate()
  useActivityStore.getState().hydrate()
}
