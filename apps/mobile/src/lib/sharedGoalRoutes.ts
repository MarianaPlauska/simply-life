import type { Href } from 'expo-router'

/** Rotas de Metas juntos e Círculo (cast: os tipos gerados do router podem estar atrás) */
export const METAS_HREF = '/metas' as Href
export const NOVA_META_HREF = '/metas/nova' as Href
export const AMIGOS_HREF = '/amigos' as Href

export function goalHref(goalId: string, opts?: { convidar?: boolean }): Href
{
  return `/metas/${goalId}${opts?.convidar ? '?convidar=1' : ''}` as Href
}

export function goalInviteHref(code: string): Href
{
  return `/meta/${code.toUpperCase()}` as Href
}
