import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  aggregateHumorByDay,
  buildMoodDistribution,
  buildCurrentMonthCalendar,
  weeklyMoodReview,
  isSoftMoodDay,
  AGUA_META_COPOS,
  type HumorRegistro,
} from '@simply-life/shared'
import { Text } from '../../ui'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'
import { usePrefsStore } from '../../store/prefsStore'
import { useBodyWeekStore } from '../../store/bodyWeekStore'
import { MoodGoalAlertCard } from '../dashboard/MoodGoalAlertCard'
import { HealthDiaryStudio } from './diary/HealthDiaryStudio'
import { DiaryDaySummary } from './diary/DiaryDaySummary'

const DAILY_PROMPTS = [
  'O que pesou mais hoje?',
  'O que te deu energia hoje?',
  'Uma coisa que você faria diferente?',
  'Pelo que você é grata(o) hoje?',
  'O que te tirou do sério hoje?',
  'O que você adiou e ainda pesa?',
  'Um momento bom que quase passou despercebido?',
]

function promptOfDay(): string
{
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
  )
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length]
}

function humorIso(h: HumorRegistro): string
{
  return (h.data || '').slice(0, 10)
}

export function HealthDiaryTab()
{
  const router = useRouter()
  const humor = useDataStore((s) => s.humor)
  const addHumor = useDataStore((s) => s.addHumor)
  const waterWeekDays = useDataStore((s) => s.waterWeekDays)
  const sleepHours = useBodyWeekStore((s) => s.sleepHours)
  const isGuest = useAuthStore((s) => s.isGuest)
  const lifeGoal = usePrefsStore((s) => s.prefs.life_goal)
  const [nota, setNota] = useState('')

  const slices = useMemo(() => buildMoodDistribution(humor), [humor])
  const agregados = useMemo(() => aggregateHumorByDay(humor), [humor])
  const cells = useMemo(() => buildCurrentMonthCalendar(agregados), [agregados])
  const total = humor.length
  const dia = new Date().toISOString().slice(0, 10)
  const last = useMemo(
    () => humor.find((h) => humorIso(h) === dia) ?? null,
    [humor, dia],
  )
  const week = useMemo(() => weeklyMoodReview(humor), [humor])
  const comNota = useMemo(
    () =>
      [...humor]
        .filter((h) => humorIso(h) && (h.nota || '').trim())
        .slice(0, 12),
    [humor],
  )
  const trend = useMemo(() => agregados.slice(-30), [agregados])
  const prompt = useMemo(() => promptOfDay(), [])

  const habitCorrelation = useMemo(() =>
  {
    const humorByDate = new Map(
      humor
        .map((h) => [humorIso(h), h.humor] as const)
        .filter(([iso]) => Boolean(iso)),
    )
    const split = (days: Record<string, number>, meta: number) =>
    {
      const good: number[] = []
      const bad: number[] = []
      for (const [iso, value] of Object.entries(days))
      {
        const m = humorByDate.get(iso)
        if (m == null) continue
        if (value >= meta) good.push(m)
        else bad.push(m)
      }
      const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null)
      return { good: avg(good), bad: avg(bad), goodCount: good.length, badCount: bad.length }
    }
    const sleep = split(sleepHours, 7)
    const water = split(waterWeekDays, Math.round(AGUA_META_COPOS * 0.7))
    const hasSleep = sleep.good != null && sleep.bad != null
    const hasWater = water.good != null && water.bad != null
    if (!hasSleep && !hasWater) return null
    return { sleep, water }
  }, [humor, sleepHours, waterWeekDays])

  const saveNote = () =>
  {
    if (!last) return
    void addHumor(last.humor, nota.trim() || undefined, isGuest)
    setNota('')
  }

  const softMode = isSoftMoodDay(humor)

  const alertSlot = softMode ? (
    <View style={{ gap: 6 }}>
      <Text variant="bodyStrong">Modo suave ativo na aba Hoje</Text>
      <Text variant="caption" muted>
        Menos metas, mais espaço. Cuidados e apoio continuam nas outras abas.
      </Text>
    </View>
  ) : undefined

  return (
    <View style={{ gap: 12 }}>
      <MoodGoalAlertCard humor={humor} goal={lifeGoal} inline />
      <HealthDiaryStudio
        alertSlot={alertSlot}
        daySlot={<DiaryDaySummary />}
        last={last}
        prompt={prompt}
        nota={nota}
        onNotaChange={setNota}
        onMood={(m) => void addHumor(m, nota.trim() || undefined, isGuest)}
        onSaveNote={saveNote}
        onOpenNotes={() => router.push('/anotacoes')}
        total={total}
        slices={slices}
        trend={trend}
        week={week}
        cells={cells}
        comNota={comNota}
        habits={habitCorrelation}
      />
    </View>
  )
}
