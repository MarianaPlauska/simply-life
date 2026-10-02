import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import { localIsoDaysAgo, localTodayIso } from '@simply-life/shared'
import { useAuthStore } from '../store/authStore'
import { useActivityStore } from '../store/activityStore'
import { useDataStore } from '../store/dataStore'
import { gamificationLevel, useGamificationStore } from '../store/gamificationStore'
import { persistStorage, whenPersistReady } from '../lib/persistStorage'
import {
  ELO_SERVIDOR_JANELA_DIAS,
  fetchEloDias,
  pushEloDias,
  writePublicElo,
  type EloDiaRemoto,
} from '../lib/sync/eloDias'
import { ELO_SYNC_UID_KEY, restoreUserLocal, stashAndClearUserLocal } from '../lib/userLocalData'
import { useElo } from './useElo'

function localIsoOf(at: string | null | undefined): string | null
{
  if (!at) return null
  const d = new Date(at)
  return Number.isNaN(d.getTime()) ? null : localTodayIso(d)
}

/**
 * Mantém o elo igual em todos os aparelhos e visível para os amigos:
 * - ao entrar e ao voltar ao app: baixa os dias do servidor e junta (união);
 * - sobe os dias mexidos aqui (na primeira vez desta conta, sobe tudo);
 * - tarefas concluídas em outro lugar (site) entram pelo dia LOCAL de
 *   concluido_em, e humor pelo dia em que foi registrado (nunca o vencimento);
 * - grava o elo canônico na gamificação (streak_3) e no cartão público.
 * Convidado fica só local.
 */
export function useEloSync(): void
{
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const pendentes = useActivityStore((s) => s.pendentes)
  const tasks = useDataStore((s) => s.tasks)
  const humor = useDataStore((s) => s.humor)
  const totalXp = useGamificationStore((s) => s.totalXp)
  const elo = useElo()
  const real = Boolean(userId) && !isGuest
  const syncing = useRef(false)
  const lastCard = useRef<string>('')
  /** conta conferida (dados locais são dela): só então semeia tarefas e humor */
  const [donoOk, setDonoOk] = useState<string | null>(null)

  const sync = useCallback(async () =>
  {
    if (!real || !userId || syncing.current) return
    syncing.current = true
    try
    {
      await whenPersistReady()
      const dono = persistStorage.getItem(ELO_SYNC_UID_KEY)
      if (dono && dono !== userId)
      {
        // dados de outra conta que não saiu pelo "Sair" (sessão expirada): não herda
        stashAndClearUserLocal(dono)
      }
      await restoreUserLocal(userId)
      setDonoOk(userId)

      const remoto = await fetchEloDias()
      if (remoto) useActivityStore.getState().mergeRemote(remoto)

      const act = useActivityStore.getState()
      const desde = localIsoDaysAgo(ELO_SERVIDOR_JANELA_DIAS - 1)
      const primeira = persistStorage.getItem(ELO_SYNC_UID_KEY) !== userId
      const isos = primeira
        ? Object.keys(act.days).filter((iso) => (act.days[iso]?.actions.length ?? 0) > 0)
        : act.pendentes
      const rows: EloDiaRemoto[] = isos
        .filter((iso) => iso >= desde)
        .map((iso) => ({ dia: iso, acoes: act.days[iso]?.actions ?? [] }))
      if (remoto === null && !rows.length) return
      const ok = await pushEloDias(rows)
      if (ok)
      {
        act.clearPendentes(isos)
        persistStorage.setItem(ELO_SYNC_UID_KEY, userId)
      }
    }
    finally
    {
      syncing.current = false
    }
  }, [real, userId])

  // entrar na conta e voltar ao app
  useEffect(() =>
  {
    if (!real) return
    void sync()
    const sub = AppState.addEventListener('change', (state) =>
    {
      if (state === 'active') void sync()
    })
    return () => sub.remove()
  }, [real, sync])

  // dias mexidos aqui sobem alguns segundos depois (junta várias ações)
  useEffect(() =>
  {
    if (!real || !pendentes.length) return
    const t = setTimeout(() => void sync(), 4000)
    return () => clearTimeout(t)
  }, [real, pendentes, sync])

  // tarefas e humor vindos do servidor (inclusive feitos no site)
  useEffect(() =>
  {
    if (!real || donoOk !== userId) return
    const act = useActivityStore.getState()
    const feitas = (tasks ?? [])
      .filter((t) => t.status === 'done')
      .map((t) => localIsoOf(t.concluidoEm))
      .filter((iso): iso is string => Boolean(iso))
    if (feitas.length) act.seedDates(feitas, 'task')
    const humores = (humor ?? [])
      .map((h) => localIsoOf(h.created_at))
      .filter((iso): iso is string => Boolean(iso))
    if (humores.length) act.seedDates(humores, 'mood')
  }, [real, donoOk, userId, tasks, humor])

  // elo canônico na gamificação e recorde guardado
  useEffect(() =>
  {
    useGamificationStore.getState().setEloStreak(elo.atual)
    useActivityStore.getState().saveRecorde(elo.recorde)
  }, [elo.atual, elo.recorde])

  // cartão público: o que amigos e admin veem
  useEffect(() =>
  {
    if (!real || !userId) return
    const level = gamificationLevel(totalXp).level
    const key = `${userId}:${elo.atual}:${level}`
    if (key === lastCard.current) return
    const t = setTimeout(() =>
    {
      void writePublicElo(elo.atual, level).then((ok) =>
      {
        if (ok) lastCard.current = key
      })
    }, 3000)
    return () => clearTimeout(t)
  }, [real, userId, elo.atual, totalXp])
}
