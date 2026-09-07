import { useState } from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { findHabit, habitPct, aguaMlPorCopo } from '@simply-life/shared'
import {
  Card,
  SectionHeader,
  PrimaryButton,
  PressableScale,
  IconBadge,
  StatusPill,
} from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useDataStore } from '../../../store/dataStore'
import { useAuthStore } from '../../../store/authStore'
import { WaterGoalEditor } from '../../dashboard/WaterGoalEditor'

export function HydrationPanel()
{
  const { colors, space } = useTheme()
  const habits = useDataStore((s) => s.habits)
  const addWaterCup = useDataStore((s) => s.addWaterCup)
  const removeWaterCup = useDataStore((s) => s.removeWaterCup)
  const isGuest = useAuthStore((s) => s.isGuest)
  const agua = findHabit(habits, 'agua')
  const pillBtn = { borderRadius: 999 as const }
  const [edit, setEdit] = useState(false)
  const ml = aguaMlPorCopo(agua)

  const pct = habitPct(agua)
  const atual = agua?.progressoAtual ?? 0
  const meta = agua?.metaDiaria ?? 10

  return (
    <Card tone="elevated" style={{ gap: space.md, borderRadius: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <IconBadge name="water" color={colors.health} size={44} iconSize={22} />
        <View style={{ flex: 1, gap: 6 }}>
          <SectionHeader title="Hidratação" subtitle={`${atual}/${meta} copos · ${ml} ml`} />
          <StatusPill label={`${pct}% da meta`} color={colors.health} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {Array.from({ length: meta }).map((_, i) =>
        {
          const filled = i < atual
          return (
            <PressableScale
              key={i}
              accessibilityLabel={filled ? `Remover até o copo ${i + 1}` : `Registrar copo ${i + 1}`}
              onPress={() =>
              {
                if (filled)
                {
                  if (i === atual - 1) void removeWaterCup(isGuest)
                }
                else if (i === atual)
                {
                  void addWaterCup(isGuest)
                }
              }}
              style={{
                width: 44,
                height: 48,
                borderRadius: 14,
                backgroundColor: filled ? colors.healthMuted : colors.surface,
                borderWidth: 1,
                borderColor: filled ? colors.health : colors.hairline,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="water"
                size={20}
                color={filled ? colors.health : colors.inkFaint}
              />
            </PressableScale>
          )
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <PrimaryButton
          label="− Copo"
          variant="secondary"
          onPress={() => void removeWaterCup(isGuest)}
          disabled={atual <= 0}
          style={[pillBtn, { flex: 1 }]}
        />
        <PrimaryButton
          label={`+ Copo (${ml} ml)`}
          onPress={() => void addWaterCup(isGuest)}
          style={[pillBtn, { flex: 1 }]}
        />
      </View>
      <PrimaryButton
        label={edit ? 'Fechar meta' : 'Editar ml e litros'}
        variant="ghost"
        onPress={() => setEdit((v) => !v)}
        style={pillBtn}
      />
      {edit ? <WaterGoalEditor /> : null}
    </Card>
  )
}
