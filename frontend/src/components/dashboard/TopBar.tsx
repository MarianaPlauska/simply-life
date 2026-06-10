import { useEffect, useState } from 'react'
import { Cloud, Bell } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { AccessibilityQuickMenu } from './AccessibilityQuickMenu'
import { ORION_HEADER_ACTION, ORION_TEXT_PRIMARY, ORION_TEXT_SECONDARY } from '../../constants/orionSurfaces'

// TopBar — ações rápidas (acessibilidade primeiro), clima e notificações

export function TopBar()
{
  const notificacoes = useTaskStore((s) => s.notificacoes)
  const fetchNotificacoes = useTaskStore((s) => s.fetchNotificacoes)
  const [weather, setWeather] = useState<{ temp: string; city: string } | null>(null)

  useEffect(() =>
  {
    fetchNotificacoes()
  }, [fetchNotificacoes])

  useEffect(() =>
  {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (pos) =>
      {
        try
        {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&timezone=auto`,
          )
          const data = await res.json()
          const temp = Math.round(data?.current?.temperature_2m ?? 0)

          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
          )
          const geo = await geoRes.json()
          const city = geo?.address?.city || geo?.address?.town || geo?.address?.municipality || geo?.address?.state || 'Local'

          setWeather({ temp: `${temp}°C`, city })
        }
        catch
        {
          // clima opcional
        }
      },
      () => { /* geolocalização negada */ },
      { timeout: 4000, maximumAge: 600_000 },
    )
  }, [])

  const unread = notificacoes.filter((n) => !n.lida).length

  return (
    <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
      {weather && (
        <div className={`hidden sm:flex items-center gap-2 text-[12px] mr-1 ${ORION_TEXT_SECONDARY}`}>
          <Cloud className="w-3.5 h-3.5 text-zinc-500" />
          <span className={`font-medium ${ORION_TEXT_PRIMARY}`}>{weather.temp}</span>
          <span className="text-zinc-400">·</span>
          <span>{weather.city}</span>
        </div>
      )}

      <AccessibilityQuickMenu />

      <button
        type="button"
        className={`relative ${ORION_HEADER_ACTION}`}
        aria-label="Notificações"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_currentColor]" />
        )}
      </button>
    </div>
  )
}
