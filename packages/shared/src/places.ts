/**
 * Lugar marcado pela pessoa. O aviso sai quando ela diz que chegou,
 * ou quando uma posição pontual (sem rastrear o dia inteiro) cai perto.
 * A tarefa guarda o lugar na anotação: #lugar:mercado
 */

export type SavedPlace = {
  id: string
  nome: string
  slug: string
  lat: number | null
  lng: number | null
}

const LUGAR_RE = /#lugar:([a-z0-9-]{1,40})/i

export function placeSlug(nome: string): string
{
  const slug = nome
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return slug || 'lugar'
}

export function parseTaskPlace(notas: string): string | null
{
  const match = LUGAR_RE.exec(notas || '')
  return match ? match[1].toLowerCase() : null
}

export function withTaskPlace(notas: string, slug: string): string
{
  const clean = (notas || '').replace(LUGAR_RE, '').replace(/\n{2,}/g, '\n').trim()
  const tag = `#lugar:${placeSlug(slug)}`
  return clean ? `${clean}\n${tag}` : tag
}

export function tasksForPlace<T extends { anotacao: string; status: string }>(tasks: T[], slug: string): T[]
{
  const want = placeSlug(slug)
  return tasks.filter((task) => task.status !== 'done' && parseTaskPlace(task.anotacao) === want)
}

/** Distância em metros. Usada só numa leitura pontual, não num rastreio contínuo. */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number
{
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const lat1 = a.lat * rad
  const lat2 = b.lat * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function nearbyPlace(places: SavedPlace[], here: { lat: number; lng: number }, radiusM = 180): SavedPlace | null
{
  let best: SavedPlace | null = null
  let bestM = radiusM
  for (const place of places)
  {
    if (place.lat == null || place.lng == null) continue
    const meters = distanceMeters(here, { lat: place.lat, lng: place.lng })
    if (meters <= bestM)
    {
      best = place
      bestM = meters
    }
  }
  return best
}
