import { useEffect, useState, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Icon } from '../../ui/Icon'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import {
  fetchWeather,
  isWeatherFresh,
  loadWeatherCache,
  loadWeatherCacheAsync,
  type WeatherSnapshot,
} from '../../lib/weather'
import { SunsetGlyph } from './SunsetGlyph'
import { RangeTick } from './RangeTick'

type Props = {
  title?: string
}

function formatToday(): string
{
  return new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')
}

function visibilityPct(snap: WeatherSnapshot | null): number
{
  if (!snap) return 68
  if (snap.severe) return 28
  const code = snap.weatherCode
  if (code === 0) return 92
  if (code <= 3) return 78
  if (code <= 48) return 52
  if (code <= 67) return 44
  return 36
}

function conditionRatio(snap: WeatherSnapshot | null): number
{
  if (!snap) return 0.45
  if (snap.severe) return 0.88
  const code = snap.weatherCode
  if (code === 0) return 0.18
  if (code <= 3) return 0.4
  if (code <= 48) return 0.62
  return 0.8
}

/** Céu em degradê + engrenagem + meteorologia, no recorte da referência. */
export function SettingsHero({ title = 'Configurações' }: Props)
{
  const { colors, radius } = useTheme()
  const router = useRouter()
  const [snap, setSnap] = useState<WeatherSnapshot | null>(() => loadWeatherCache())
  // Faixa de destaque (petróleo no escuro, tinta suave no claro); coral só em detalhes pequenos
  const sky = [colors.heroBgDeep, colors.heroBg] as const
  const panel = colors.elevated
  const glyph = colors.ink
  const vis = visibilityPct(snap)
  const humidity = snap?.humidity ?? 0
  const temp = snap?.tempC ?? 0
  const wind = snap?.windKmh ?? 0

  useEffect(() =>
  {
    void (async () =>
    {
      const cached = await loadWeatherCacheAsync()
      if (cached) setSnap(cached)
      if (cached && !isWeatherFresh(cached))
      {
        try
        {
          setSnap(await fetchWeather(cached.lat, cached.lon, cached.city))
        }
        catch
        {
          /* mantém o último clima */
        }
      }
    })()
  }, [])

  return (
    <View style={{ gap: 0, marginBottom: 12 }}>
      <View style={{ borderRadius: radius.card, overflow: 'hidden' }}>
        <LinearGradient
          colors={[...sky]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={{ minHeight: 156, padding: 20, paddingBottom: 48 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${colors.heroMuted}29`,
                }}
              >
                <Icon name="chevron-back" size={22} color={colors.heroInk} />
              </Pressable>
              <View style={{ gap: 8, paddingTop: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colors.axelFill }} />
                <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colors.heroMuted }} />
                <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colors.heroInk }} />
              </View>
            </View>
            <View
              accessibilityRole="header"
              accessibilityLabel={title}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                minHeight: 44,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: `${colors.heroMuted}1F`,
              }}
            >
              <Icon name="settings" size={16} color={colors.heroInk} />
              <Text variant="bodyStrong" style={{ color: colors.heroInk }}>
                {title}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View
        style={{
          marginTop: -40,
          marginHorizontal: 8,
          borderRadius: 20,
          backgroundColor: panel,
          paddingHorizontal: 18,
          paddingTop: 16,
          paddingBottom: 14,
          gap: 16,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ gap: 4, flex: 1, minWidth: 0, paddingRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text
                variant="micro"
                muted
                style={{ letterSpacing: 1.4, textTransform: 'uppercase', fontSize: 11 }}
              >
                Céu de hoje
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: colors.axel }} />
                <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: colors.attention }} />
                <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: colors.tasks }} />
              </View>
            </View>
            <Text variant="caption" muted numberOfLines={1}>
              {snap?.label ?? 'Meteorologia'}
              {snap?.city ? ` · ${snap.city}` : ''}
            </Text>
          </View>
          <Text variant="caption" muted>
            {formatToday()}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
            <Text variant="hero" style={{ fontSize: 44, lineHeight: 48, letterSpacing: -1.6 }}>
              {snap ? `${snap.tempC}` : '--'}
            </Text>
            <Text variant="caption" muted style={{ paddingBottom: 8 }}>
              {snap ? '°C' : 'clima'}
            </Text>
          </View>
          <SunsetGlyph size={56} color={glyph} />
        </View>

        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ flex: 1, gap: 16 }}>
            <MeterLine
              label="Condição"
              value={snap?.label ?? '--'}
              tick={<RangeTick ratio={conditionRatio(snap)} colors={[colors.health, colors.danger]} />}
            />
            <MeterLine
              label="Vento"
              value={snap ? `${wind} km/h` : '--'}
              tick={<RangeTick ratio={Math.min(1, wind / 40)} colors={[colors.tasksMuted, colors.tasks]} />}
            />
          </View>
          <View style={{ flex: 1, gap: 16 }}>
            <MeterLine
              label="Temperatura"
              value={snap ? `${temp}°` : '--'}
              tick={<RangeTick ratio={Math.max(0.08, Math.min(0.94, (temp + 5) / 45))} colors={[colors.tasks, colors.attention]} />}
            />
            <MeterLine
              label="Umidade"
              value={snap ? `${humidity}%` : '--'}
              tick={<RangeTick ratio={humidity / 100} colors={[colors.tasksMuted, colors.tasks]} />}
            />
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text
            variant="micro"
            muted
            style={{ letterSpacing: 1.1, textTransform: 'uppercase', fontSize: 11 }}
          >
            % visibilidade
          </Text>
          <View
            style={{
              height: 32,
              borderRadius: 999,
              overflow: 'hidden',
              backgroundColor: colors.hairline,
              justifyContent: 'center',
            }}
          >
            <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${vis}%` }}>
              <LinearGradient
                colors={[colors.tasksMuted, colors.tasks]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ flex: 1 }}
              />
            </View>
            <Text variant="micro" style={{ fontSize: 11, color: colors.ink, paddingLeft: 14 }}>
              {vis}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}

function MeterLine({
  label,
  value,
  tick,
}: {
  label: string
  value: string
  tick: ReactNode
})
{
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text variant="micro" muted style={{ letterSpacing: 0.7, textTransform: 'uppercase', fontSize: 11 }}>
          {label}
        </Text>
        <Text variant="bodyStrong" style={{ fontSize: 15 }} numberOfLines={1}>
          {value}
        </Text>
      </View>
      {tick}
    </View>
  )
}
