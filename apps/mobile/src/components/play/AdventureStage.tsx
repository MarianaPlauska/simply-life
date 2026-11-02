import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { axelForm, axelFormLabel, axelFormNext, localTodayIso } from '@simply-life/shared'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { usePlayStore } from '../../store/playStore'
import { useNeuroStore } from '../../store/neuroStore'
import { useDataStore } from '../../store/dataStore'
import { AxelFaceSun } from './AxelFaceSun'
import { HabitQuest } from './HabitQuest'
import { gamificationLevel, useGamificationStore } from '../../store/gamificationStore'

/** Caminho do dia. O peso afina quando ela registra. Sem monstro e sem perda. */
export function AdventureStage()
{
  const { colors } = useTheme()
  const energy = usePlayStore((s) => s.energy)
  const totalXp = useGamificationStore((s) => s.totalXp)
  const { level } = gamificationLevel(totalXp)
  const quiet = useNeuroStore((s) => s.quietCelebrations)
  const humor = useDataStore((s) => s.humor) ?? []
  const tasks = useDataStore((s) => s.tasks) ?? []
  const habits = useDataStore((s) => s.habits) ?? []
  const today = localTodayIso()
  const hour = new Date().getHours()
  const mood = humor.some((h) => (h.data || '').slice(0, 10) === today)
  const water = (habits.find((h) => h.tipo === 'agua')?.progressoAtual ?? 0) > 0
  const task = tasks.some((t) => t.status === 'done' && (t.concluidoEm || '').slice(0, 10) === today)
  const steps = [mood, water, task].filter(Boolean).length
  const [shift, setShift] = useState(0)
  const prev = useRef(energy)

  useEffect(() =>
  {
    if (energy <= prev.current || quiet)
    {
      prev.current = energy
      return
    }
    prev.current = energy
    setShift(12)
    const timer = setTimeout(() => setShift(0), 280)
    return () => clearTimeout(timer)
  }, [energy, quiet])

  const mist = Math.max(0, (100 - energy) / 100) * 0.45

  return (
    <View accessibilityLabel="Palco do AXEL" style={{ width: '100%', alignSelf: 'stretch', gap: 8 }}>
      <View style={{ height: 150, justifyContent: 'flex-end' }}>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 24,
            backgroundColor: colors.brandDeep,
            opacity: mist,
            borderRadius: 12,
          }}
        />
        <View style={{ marginLeft: 12 + steps * 36 + shift, marginBottom: 4 }}>
          <AxelFaceSun size={84} />
        </View>
        <View style={{ height: 4, borderRadius: 99, backgroundColor: colors.hairline, overflow: 'hidden' }}>
          <View style={{ width: `${(steps / 3) * 100}%`, height: '100%', backgroundColor: colors.axelFill }} />
        </View>
      </View>
      <Text variant="caption" muted>
        Forma: {axelFormLabel(axelForm(level))}. {axelFormNext(level)} {hour >= 22 && energy < 100 ? 'O AXEL está cansado. Amanhã a energia volta.' : 'Cada registro anda um passo.'}
      </Text>
      <HabitQuest />
    </View>
  )
}
