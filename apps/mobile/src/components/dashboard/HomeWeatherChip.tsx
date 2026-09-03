import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Pressable,
  Modal,
  TextInput,
  Platform,
  AppState,
  type AppStateStatus,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { Text, PrimaryButton, IconBadge } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import {
  fetchWeather,
  isWeatherFresh,
  loadWeatherCache,
  loadWeatherCacheAsync,
  searchCities,
  type GeoHit,
  type WeatherSnapshot,
} from '../../lib/weather'

export function HomeWeatherChip()
{
  const { colors, space } = useTheme()
  const [snap, setSnap] = useState<WeatherSnapshot | null>(() => loadWeatherCache())
  const [loading, setLoading] = useState(false)
  const [needCity, setNeedCity] = useState(false)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<GeoHit[]>([])
  const [error, setError] = useState('')

  const refreshFromCoords = useCallback(async (lat: number, lon: number, city?: string) =>
  {
    setLoading(true)
    setError('')
    try
    {
      const next = await fetchWeather(lat, lon, city)
      setSnap(next)
      setNeedCity(false)
    }
    catch
    {
      setError('Não deu pra atualizar agora. Mantemos o último clima.')
    }
    finally
    {
      setLoading(false)
    }
  }, [])

  const tryLocation = useCallback(async (force = false) =>
  {
    const cached = loadWeatherCache()
    if (!force && isWeatherFresh(cached))
    {
      setSnap(cached)
      return
    }

    // Web / sem permissão nativa - geoloc do browser se houver
    try
    {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation)
      {
        await new Promise<void>((resolve) =>
        {
          navigator.geolocation.getCurrentPosition(
            (pos) =>
            {
              void refreshFromCoords(pos.coords.latitude, pos.coords.longitude).then(() =>
                resolve(),
              )
            },
            () =>
            {
              setNeedCity(true)
              if (cached) setSnap(cached)
              resolve()
            },
            { enableHighAccuracy: false, timeout: 8000 },
          )
        })
        return
      }

      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted')
      {
        setNeedCity(true)
        if (cached) setSnap(cached)
        return
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      await refreshFromCoords(pos.coords.latitude, pos.coords.longitude)
    }
    catch
    {
      setNeedCity(true)
      if (cached) setSnap(cached)
    }
  }, [refreshFromCoords])

  useEffect(() =>
  {
    void loadWeatherCacheAsync().then((c) =>
    {
      if (c) setSnap(c)
    })
    void tryLocation(false)
  }, [tryLocation])

  useEffect(() =>
  {
    const onChange = (state: AppStateStatus) =>
    {
      if (state === 'active') void tryLocation(false)
    }
    const sub = AppState.addEventListener('change', onChange)
    return () => sub.remove()
  }, [tryLocation])

  useEffect(() =>
  {
    if (query.trim().length < 2)
    {
      setHits([])
      return
    }
    const t = setTimeout(() =>
    {
      void searchCities(query).then(setHits)
    }, 320)
    return () => clearTimeout(t)
  }, [query])

  const tint = snap?.severe ? colors.danger : colors.inkMuted
  const badgeColor = snap?.severe ? colors.danger : colors.axel

  return (
    <>
      <Pressable
        onPress={() => setNeedCity(true)}
        accessibilityLabel="Clima"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          minHeight: 44,
          paddingVertical: 6,
          paddingHorizontal: 4,
        }}
      >
        <IconBadge
          name={snap?.icon ?? 'partly-sunny-outline'}
          color={badgeColor}
          size={36}
          iconSize={18}
        />
        <View style={{ flex: 1, gap: 2 }}>
          {snap ? (
            <>
              <Text variant="bodyStrong" style={{ fontSize: 14, color: colors.ink }}>
                {snap.tempC}° · {snap.label}
                {snap.city ? ` · ${snap.city}` : ''}
              </Text>
              <Text variant="caption" style={{ color: tint }}>
                {loading ? 'Atualizando…' : snap.hint}
              </Text>
            </>
          ) : (
            <>
              <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                Clima
              </Text>
              <Text variant="caption" muted>
                {needCity ? 'Toque para escolher a cidade' : 'Buscando o tempo…'}
              </Text>
            </>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
      </Pressable>

      {error ? (
        <Text variant="caption" muted style={{ paddingHorizontal: 4 }}>
          {error}
        </Text>
      ) : null}

      <Modal
        visible={needCity}
        transparent
        animationType="slide"
        onRequestClose={() => setNeedCity(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setNeedCity(false)} />
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: space.lg,
              gap: space.md,
              maxHeight: '70%',
            }}
          >
            <Text variant="section">Onde você está?</Text>
            <Text variant="caption" muted>
              Localização é opcional. Se preferir, busque a cidade.
            </Text>
            <PrimaryButton
              label="Usar minha localização"
              variant="secondary"
              onPress={() => void tryLocation(true)}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar cidade…"
              placeholderTextColor={colors.inkFaint}
              style={{
                minHeight: 48,
                borderRadius: 14,
                paddingHorizontal: 14,
                fontSize: 15,
                color: colors.ink,
                backgroundColor: colors.elevated,
                borderWidth: 1,
                borderColor: colors.hairline,
              }}
            />
            {hits.map((h) => (
              <Pressable
                key={`${h.name}-${h.lat}-${h.lon}`}
                onPress={() =>
                {
                  void refreshFromCoords(h.lat, h.lon, h.name)
                }}
                style={{
                  minHeight: 48,
                  justifyContent: 'center',
                  borderBottomWidth: 1,
                  borderBottomColor: colors.hairline,
                }}
              >
                <Text variant="bodyStrong">
                  {h.name}
                  {h.admin1 ? `, ${h.admin1}` : ''}
                </Text>
                {h.country ? (
                  <Text variant="caption" muted>
                    {h.country}
                  </Text>
                ) : null}
              </Pressable>
            ))}
            <PrimaryButton label="Fechar" variant="ghost" onPress={() => setNeedCity(false)} />
          </View>
        </View>
      </Modal>
    </>
  )
}
