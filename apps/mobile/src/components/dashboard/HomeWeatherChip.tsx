import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Pressable,
  Modal,
  TextInput,
  Platform,
  AppState,
  ScrollView,
  type AppStateStatus,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { Text, PrimaryButton, IconBadge, Card } from '../../ui'
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

type Props = { compact?: boolean }

export function HomeWeatherChip({ compact = false }: Props)
{
  const { colors, mode } = useTheme()
  const [snap, setSnap] = useState<WeatherSnapshot | null>(() => loadWeatherCache())
  const [loading, setLoading] = useState(false)
  /** true = falta cidade; o sheet só abre com pickerOpen */
  const [needCity, setNeedCity] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [sheet, setSheet] = useState<'pick' | 'detail'>('pick')
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
      setSheet('detail')
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
              setError('Ative a localização ou busque a cidade.')
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
        setError('Permissão de localização recusada. Busque a cidade.')
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
      setError('Não foi possível usar o GPS. Busque a cidade.')
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

  const openPicker = () =>
  {
    setSheet(snap ? 'detail' : 'pick')
    setPickerOpen(true)
  }

  const hours = snap?.hourly?.slice(0, 8) ?? []
  const peak = hours.length ? Math.max(...hours.map((h) => h.tempC), snap?.tempC ?? 1) : 1
  const barIdle = mode === 'dark' ? '#2C2C2E' : colors.hairline

  return (
    <>
      {compact ? (
        <Pressable
          onPress={openPicker}
          accessibilityLabel="Clima"
          style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name={snap?.icon ?? 'partly-sunny-outline'} size={22} color={badgeColor} />
        </Pressable>
      ) : (
      <Card tone="elevated" style={{ gap: 14, padding: 18 }}>
        <Pressable
          onPress={openPicker}
          accessibilityLabel="Clima"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            minHeight: 44,
          }}
        >
          <IconBadge
            name={snap?.icon ?? 'partly-sunny-outline'}
            color={badgeColor}
            size={40}
            iconSize={20}
          />
          <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
            {snap ? (
              <>
                <Text variant="bodyStrong" numberOfLines={1} style={{ fontSize: 16 }}>
                  {snap.tempC}° · {snap.label}
                </Text>
                <Text variant="caption" numberOfLines={1} style={{ color: tint }}>
                  {loading ? 'Atualizando…' : snap.hint}
                  {snap.city ? ` · ${snap.city}` : ''}
                </Text>
              </>
            ) : (
              <>
                <Text variant="bodyStrong" style={{ fontSize: 16 }}>
                  Clima
                </Text>
                <Text variant="caption" muted numberOfLines={1}>
                  {needCity ? 'Toque para escolher a cidade' : 'Buscando o tempo…'}
                </Text>
              </>
            )}
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
        </Pressable>

        {hours.length > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 36 }}>
            {hours.map((h, i) =>
            {
              const ht = 8 + Math.round((h.tempC / peak) * 28)
              return (
                <View
                  key={`${h.hour}-${i}`}
                  style={{
                    flex: 1,
                    height: ht,
                    borderRadius: 8,
                    backgroundColor: i === 0 ? colors.axel : barIdle,
                  }}
                />
              )
            })}
          </View>
        ) : null}

        {error ? (
          <Text variant="caption" muted>
            {error}
          </Text>
        ) : null}
      </Card>
      )}

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setPickerOpen(false)} />
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 20,
              maxHeight: '82%',
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 8 }}>
              {sheet === 'detail' && snap ? (
                <>
                  <Text variant="caption" muted>
                    {snap.city ?? 'Agora'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
                    <Text variant="hero" style={{ fontSize: 48, lineHeight: 52, letterSpacing: -1.5 }}>
                      {snap.tempC}°
                    </Text>
                    <View style={{ paddingBottom: 8, gap: 2, flex: 1 }}>
                      <Text variant="bodyStrong">{snap.label}</Text>
                      <Text variant="caption" muted>
                        {loading ? 'Atualizando…' : snap.hint}
                      </Text>
                    </View>
                    <Ionicons name={snap.icon} size={28} color={badgeColor} />
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {[
                      snap.feelsLikeC != null ? `Sensação ${snap.feelsLikeC}°` : null,
                      snap.maxC != null && snap.minC != null ? `Máx ${snap.maxC}° · Mín ${snap.minC}°` : null,
                      snap.humidity != null ? `Umidade ${snap.humidity}%` : null,
                      snap.windKmh != null ? `Vento ${snap.windKmh} km/h` : null,
                      snap.precipMm ? `Chuva ${snap.precipMm} mm` : null,
                    ]
                      .filter(Boolean)
                      .map((label) => (
                        <View
                          key={label as string}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 999,
                            backgroundColor: colors.elevated,
                          }}
                        >
                          <Text variant="caption">{label}</Text>
                        </View>
                      ))}
                  </View>
                  {(snap.hourly?.length ?? 0) > 0 ? (
                    <View style={{ gap: 8 }}>
                      <Text variant="caption" muted>
                        Próximas horas
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 72 }}>
                        {snap.hourly!.map((h) =>
                        {
                          const peak = Math.max(...snap.hourly!.map((x) => x.tempC), snap.tempC)
                          const bar = Math.max(10, Math.round(((h.tempC + 5) / (peak + 8)) * 48))
                          return (
                            <View key={h.hour} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                              <Text variant="micro" muted>
                                {h.tempC}°
                              </Text>
                              <View
                                style={{
                                  width: '70%',
                                  height: bar,
                                  borderRadius: 8,
                                  backgroundColor: colors.axelMuted,
                                }}
                              />
                              <Text variant="micro" muted>
                                {h.hour}
                              </Text>
                            </View>
                          )
                        })}
                      </View>
                    </View>
                  ) : null}
                  {error ? (
                    <Text variant="caption" color={colors.danger}>
                      {error}
                    </Text>
                  ) : null}
                  <PrimaryButton
                    label="Outra cidade"
                    variant="secondary"
                    onPress={() => setSheet('pick')}
                  />
                  <PrimaryButton
                    label={loading ? 'Buscando…' : 'Atualizar localização'}
                    variant="ghost"
                    onPress={() => void tryLocation(true)}
                  />
                  <PrimaryButton label="Fechar" variant="dismiss" onPress={() => setPickerOpen(false)} />
                </>
              ) : (
                <>
                  <Text variant="section">Onde você está?</Text>
                  <Text variant="caption" muted>
                    Usamos Open-Meteo. Toque em localização ou busque a cidade.
                  </Text>
                  {error ? (
                    <Text variant="caption" color={colors.danger}>
                      {error}
                    </Text>
                  ) : null}
                  <PrimaryButton
                    label={loading ? 'Buscando…' : 'Usar minha localização'}
                    onPress={() => void tryLocation(true)}
                  />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Buscar cidade…"
                    placeholderTextColor={colors.inkFaint}
                    style={{
                      minHeight: 48,
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      fontSize: 15,
                      color: colors.ink,
                      backgroundColor: colors.elevated,
                    }}
                  />
                  {hits.map((h) => (
                    <Pressable
                      key={`${h.name}-${h.lat}-${h.lon}`}
                      onPress={() =>
                      {
                        void refreshFromCoords(h.lat, h.lon, h.name)
                      }}
                      style={{ minHeight: 48, justifyContent: 'center' }}
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
                  <PrimaryButton label="Fechar" variant="dismiss" onPress={() => setPickerOpen(false)} />
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  )
}
