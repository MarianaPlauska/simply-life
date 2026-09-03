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

export async function fetchWeather(lat: number, lon: number, city?: string): Promise<WeatherSnapshot>
{
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Clima indisponível agora')
  const data = (await res.json()) as {
    current?: { temperature_2m?: number; weather_code?: number }
  }
  const tempC = Math.round(data.current?.temperature_2m ?? 0)
  const weatherCode = data.current?.weather_code ?? 0
  const meta = interpretWeatherCode(weatherCode)
  const snapshot: WeatherSnapshot = {
    tempC,
    weatherCode,
    label: meta.label,
    hint: meta.hint,
    icon: meta.icon,
    severe: meta.severe,
    city,
    lat,
    lon,
    fetchedAt: new Date().toISOString(),
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
