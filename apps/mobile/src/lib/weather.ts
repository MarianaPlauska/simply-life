import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { Ionicons } from '@expo/vector-icons'

const CACHE_KEY = 'simply-life-weather-v1'
export const WEATHER_TTL_MS = 30 * 60 * 1000

type WeatherIcon = keyof typeof Ionicons.glyphMap

export type WeatherSnapshot = {
  tempC: number
  weatherCode: number
  label: string
  hint: string
  icon: WeatherIcon
  severe: boolean
  city?: string
  lat: number
  lon: number
  fetchedAt: string
  feelsLikeC?: number
  humidity?: number
  windKmh?: number
  precipMm?: number
  maxC?: number
  minC?: number
  hourly?: { hour: string; tempC: number }[]
}

type CacheBlob = {
  snapshot: WeatherSnapshot
}

async function readCacheRaw(): Promise<string | null>
{
  try
  {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined')
    {
      return localStorage.getItem(CACHE_KEY)
    }
    return await SecureStore.getItemAsync(CACHE_KEY)
  }
  catch
  {
    return null
  }
}

async function writeCacheRaw(value: string): Promise<void>
{
  try
  {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined')
    {
      localStorage.setItem(CACHE_KEY, value)
      return
    }
    await SecureStore.setItemAsync(CACHE_KEY, value)
  }
  catch
  {
    /* ignore */
  }
}

export function loadWeatherCache(): WeatherSnapshot | null
{
  try
  {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined')
    {
      const raw = localStorage.getItem(CACHE_KEY)
      if (!raw) return null
      return (JSON.parse(raw) as CacheBlob).snapshot ?? null
    }
  }
  catch
  {
    /* ignore */
  }
  return null
}

export async function loadWeatherCacheAsync(): Promise<WeatherSnapshot | null>
{
  try
  {
    const raw = await readCacheRaw()
    if (!raw) return null
    return (JSON.parse(raw) as CacheBlob).snapshot ?? null
  }
  catch
  {
    return null
  }
}

export function saveWeatherCache(snapshot: WeatherSnapshot): void
{
  void writeCacheRaw(JSON.stringify({ snapshot }))
}

export function isWeatherFresh(snapshot: WeatherSnapshot | null, ttl = WEATHER_TTL_MS): boolean
{
  if (!snapshot?.fetchedAt) return false
  const t = Date.parse(snapshot.fetchedAt)
  if (Number.isNaN(t)) return false
  return Date.now() - t < ttl
}

export function interpretWeatherCode(code: number): {
  label: string
  hint: string
  icon: WeatherIcon
  severe: boolean
}
{
  if (code === 0)
  {
    return { label: 'Céu limpo', hint: 'Dia aberto por aí', icon: 'sunny-outline', severe: false }
  }
  if (code <= 3)
  {
    return { label: 'Parcial', hint: 'Nuvens leves no céu', icon: 'partly-sunny-outline', severe: false }
  }
  if (code <= 48)
  {
    return { label: 'Nublado', hint: 'Céu fechado, sem pressa', icon: 'cloudy-outline', severe: false }
  }
  if (code <= 57)
  {
    return { label: 'Garoa', hint: 'Pode molhar um pouco', icon: 'rainy-outline', severe: false }
  }
  if (code <= 67)
  {
    return { label: 'Chuva', hint: 'Vai chover à tarde', icon: 'rainy-outline', severe: false }
  }
  if (code <= 77)
  {
    return { label: 'Neve', hint: 'Frio e branco lá fora', icon: 'snow-outline', severe: false }
  }
  if (code <= 82)
  {
    return { label: 'Pancadas', hint: 'Chuva em momentos', icon: 'rainy-outline', severe: false }
  }
  if (code <= 86)
  {
    return { label: 'Neve', hint: 'Flocos no ar', icon: 'snow-outline', severe: false }
  }
  if (code <= 99)
  {
    return {
      label: 'Tempestade',
      hint: 'Melhor ficar em casa um pouco',
      icon: 'thunderstorm-outline',
      severe: true,
    }
  }
  return { label: 'Clima', hint: 'Tempo estável', icon: 'partly-sunny-outline', severe: false }
}

/**
 * Open-Meteo não tem reverse geocoding (o /v1/reverse devolve 404 sem CORS).
 * BigDataCloud é o endpoint de cliente, pensado para o browser.
 */
export async function reverseGeocodeCity(lat: number, lon: number): Promise<string | undefined>
{
  try
  {
    const url =
      `https://api.bigdatacloud.net/data/reverse-geocode-client` +
      `?latitude=${lat}&longitude=${lon}&localityLanguage=pt`
    const res = await fetch(url)
    if (!res.ok) return undefined
    const data = (await res.json()) as {
      city?: string
      locality?: string
    }
    const name = (data.city || data.locality || '').trim()
    return name || undefined
  }
  catch
  {
    return undefined
  }
}

export async function fetchWeather(lat: number, lon: number, city?: string): Promise<WeatherSnapshot>
{
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code,relative_humidity_2m,apparent_temperature,wind_speed_10m,precipitation` +
    `&hourly=temperature_2m` +
    `&daily=temperature_2m_max,temperature_2m_min` +
    `&forecast_days=1&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Clima indisponível agora')
  const data = (await res.json()) as {
    current?: {
      temperature_2m?: number
      weather_code?: number
      relative_humidity_2m?: number
      apparent_temperature?: number
      wind_speed_10m?: number
      precipitation?: number
    }
    hourly?: { time?: string[]; temperature_2m?: number[] }
    daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] }
  }
  const tempC = Math.round(data.current?.temperature_2m ?? 0)
  const weatherCode = data.current?.weather_code ?? 0
  const meta = interpretWeatherCode(weatherCode)
  const now = Date.now()
  const hourly: { hour: string; tempC: number }[] = []
  const times = data.hourly?.time ?? []
  const temps = data.hourly?.temperature_2m ?? []
  for (let i = 0; i < times.length && hourly.length < 8; i++)
  {
    const t = Date.parse(times[i])
    if (Number.isNaN(t) || t < now - 30 * 60 * 1000) continue
    hourly.push({
      hour: times[i].slice(11, 13) + 'h',
      tempC: Math.round(temps[i] ?? tempC),
    })
  }
  const resolvedCity = city ?? (await reverseGeocodeCity(lat, lon))
  const snapshot: WeatherSnapshot = {
    tempC,
    weatherCode,
    label: meta.label,
    hint: meta.hint,
    icon: meta.icon,
    severe: meta.severe,
    city: resolvedCity,
    lat,
    lon,
    fetchedAt: new Date().toISOString(),
    feelsLikeC: Math.round(data.current?.apparent_temperature ?? tempC),
    humidity: Math.round(data.current?.relative_humidity_2m ?? 0),
    windKmh: Math.round(data.current?.wind_speed_10m ?? 0),
    precipMm: Math.round((data.current?.precipitation ?? 0) * 10) / 10,
    maxC: Math.round(data.daily?.temperature_2m_max?.[0] ?? tempC),
    minC: Math.round(data.daily?.temperature_2m_min?.[0] ?? tempC),
    hourly,
  }
  saveWeatherCache(snapshot)
  return snapshot
}

export type GeoHit = {
  name: string
  country?: string
  admin1?: string
  lat: number
  lon: number
}

export async function searchCities(query: string): Promise<GeoHit[]>
{
  const q = query.trim()
  if (q.length < 2) return []
  const url =
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}` +
    `&count=6&language=pt&format=json`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = (await res.json()) as {
    results?: Array<{
      name: string
      country?: string
      admin1?: string
      latitude: number
      longitude: number
    }>
  }
  return (data.results ?? []).map((r) => ({
    name: r.name,
    country: r.country,
    admin1: r.admin1,
    lat: r.latitude,
    lon: r.longitude,
  }))
}
