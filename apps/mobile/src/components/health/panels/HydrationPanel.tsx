import { useState } from 'react'
import { View } from 'react-native'
import { Icon } from '../../../ui/Icon'
import { findHabit, habitPct, aguaMetaMl, aguaMlPorCopo } from '@simply-life/shared'
import { PrimaryButton, PressableScale, ProgressRing, Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useDataStore } from '../../../store/dataStore'
import { useAuthStore } from '../../../store/authStore'
import { WaterGoalEditor } from '../../dashboard/WaterGoalEditor'
import { useWebDesk } from '../../dashboard/web/webBox'

export function HydrationPanel()
{
  const { colors, elevation } = useTheme()
  const habits = useDataStore((s) => s.habits)
  const addWaterCup = useDataStore((s) => s.addWaterCup)
  const removeWaterCup = useDataStore((s) => s.removeWaterCup)
  const isGuest = useAuthStore((s) => s.isGuest)
  const desk = useWebDesk()
  const [edit, setEdit] = useState(false)

  const agua = findHabit(habits, 'agua')
  const ml = aguaMlPorCopo(agua)
  const pct = habitPct(agua)
  const atual = agua?.progressoAtual ?? 0
  const meta = agua?.metaDiaria ?? 10
  const litros = String(aguaMetaMl(agua) / 1000).replace('.', ',')

  const cups = (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
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
              height: 44,
              borderRadius: 999,
              backgroundColor: filled ? colors.healthMuted : colors.fill,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon
              name="water"
              size={18}
              color={filled ? colors.health : colors.inkFaint}
            />
          </PressableScale>
        )
      })}
    </View>
  )

  const actions = (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <PrimaryButton
          label="-1 copo"
          variant="secondary"
          onPress={() => void removeWaterCup(isGuest)}
          disabled={atual <= 0}
          style={desk ? { paddingHorizontal: 24, borderRadius: 999 } : { flex: 1, borderRadius: 999 }}
        />
        <PrimaryButton
          label={`+ Copo (${ml} ml)`}
          onPress={() => void addWaterCup(isGuest)}
          style={desk ? { paddingHorizontal: 24, borderRadius: 999 } : { flex: 1, borderRadius: 999 }}
        />
      </View>
      <PrimaryButton
        label={edit ? 'Fechar meta' : 'Editar ml e litros'}
        variant="link"
        onPress={() => setEdit((v) => !v)}
        style={{ alignSelf: 'flex-start' }}
      />
    </View>
  )

  return (
    <View
      style={
        desk
          ? { gap: 16 }
          : {
              borderRadius: 16,
              padding: 16,
              gap: 16,
              backgroundColor: colors.elevated,
              overflow: 'hidden',
              ...elevation.card,
            }
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <ProgressRing
          progress={pct}
          size={64}
          strokeWidth={7}
          color={colors.health}
          trackColor={colors.fill}
          centerLabel={`${pct}%`}
          labelColor={colors.ink}
        />
        <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <Text variant="caption" muted>
            Hidratação
          </Text>
          <Text variant="bodyStrong" style={{ fontSize: 18, lineHeight: 24 }}>
            {atual} de {meta} copos
          </Text>
          <Text variant="caption" muted>
            {ml} ml · meta de {litros} L
          </Text>
        </View>
      </View>

      <View
        style={{
          gap: 16,
          borderTopWidth: 1,
          borderTopColor: colors.hairline,
          paddingTop: 16,
        }}
      >
        {cups}
        {actions}
        {edit ? <WaterGoalEditor onClose={() => setEdit(false)} /> : null}
      </View>
    </View>
  )
}
