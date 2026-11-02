import { useEffect, useState } from 'react'
import { axelFace, axelForm, humorDoDia, localTodayIso } from '@simply-life/shared'
import { AxelSun } from '../AxelSun'
import { useDataStore } from '../../store/dataStore'
import { usePlayStore } from '../../store/playStore'
import { usePrefsStore } from '../../store/prefsStore'
import { gamificationLevel, useGamificationStore } from '../../store/gamificationStore'

/** O girassol com a cara do dia e o acessório equipado. */
export function AxelFaceSun({ size = 40 }: { size?: number })
{
  const humor = useDataStore((s) => s.humor) ?? []
  const tasks = useDataStore((s) => s.tasks) ?? []
  const habits = useDataStore((s) => s.habits) ?? []
  const party = usePlayStore((s) => s.party)
  const accessory = usePrefsStore((s) => s.prefs.axel_accessory)
  const totalXp = useGamificationStore((s) => s.totalXp)
  const { level } = gamificationLevel(totalXp)
  const [hour, setHour] = useState(() => new Date().getHours())
  useEffect(() =>
  {
    const id = setInterval(() => setHour(new Date().getHours()), 60_000)
    return () => clearInterval(id)
  }, [])
  const today = localTodayIso()
  const moodLevel = humorDoDia(humor)?.humor ?? null
  const loggedToday = humor.some((h) => (h.data || '').slice(0, 10) === today)
    || tasks.some((t) => t.status === 'done' && (t.concluidoEm || '').slice(0, 10) === today)
    || (habits.find((h) => h.tipo === 'agua')?.progressoAtual ?? 0) > 0
  const mood = axelFace({
    hour,
    moodLevel,
    loggedToday,
    celebrating: Boolean(party),
  })
  return <AxelSun size={size} mood={mood} accessory={accessory} form={axelForm(level)} />
}
