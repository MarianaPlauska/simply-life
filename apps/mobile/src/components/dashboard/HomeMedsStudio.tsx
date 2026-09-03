import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  medsAdherencePct,
  medsTakenCount,
  medsWeekAdherencePct,
  sortMedsByTime,
} from '@simply-life/shared'
import { Text, PrimaryButton, CheckRow, ProgressRing } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { fetchMedsTakenLastDays } from '../../lib/sync/medicamentos'
import { ExpandableSection } from './ExpandableSection'

export function HomeMedsStudio()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [weekKeys, setWeekKeys] = useState<string[]>([])
  const medicamentos = useDataStore((s) => s.medicamentos) ?? []
  const toggleMedicamento = useDataStore((s) => s.toggleMedicamento)
  const isGuest = useAuthStore((s) => s.isGuest)
  const sorted = useMemo(() => sortMedsByTime(medicamentos), [medicamentos])
  const taken = medsTakenCount(sorted)
  const todayPct = medsAdherencePct(sorted)
  const weekPct = weekKeys.length > 0
    ? medsWeekAdherencePct(sorted.length, weekKeys)
    : todayPct

  useEffect(() =>
  {
    if (isGuest)
    {
      return
    }
    let live = true
    void fetchMedsTakenLastDays(7)
      .then((keys) =>
      {
        if (live)
        {
          setWeekKeys(keys)
        }
      })
      .catch(() =>
      {
        if (live)
        {
          setWeekKeys([])
        }
      })
    return () =>
    {
      live = false
    }
  }, [isGuest, taken])

  const subtitle = sorted.length === 0
    ? 'Nenhuma dose cadastrada'
    : `${taken}/${sorted.length} doses hoje`

  return (
    <ExpandableSection
      title="Remédios"
      subtitle={subtitle}
      pill={`${weekPct}%`}
      pillColor={weekPct >= 80 ? colors.health : colors.axel}
      accent={colors.health}
      expanded={open}
      onToggle={() => setOpen((v) => !v)}
      summary={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <ProgressRing
            progress={weekPct}
            size={56}
            strokeWidth={5}
            color={colors.health}
            centerLabel={`${weekPct}`}
          />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="title" color={colors.health} style={{ fontSize: 20 }}>
              {weekPct}% na semana
            </Text>
            <Text variant="caption" muted>
              {sorted.length === 0
                ? 'Cadastre doses em Cuidados'
                : weekKeys.length > 0
                  ? `${taken}/${sorted.length} tomadas hoje`
                  : `Com base nas doses de hoje (${todayPct}%)`}
            </Text>
          </View>
        </View>
      }
    >
      {sorted.length === 0 ? (
        <Text variant="body" muted>
          Sem remédios listados. Adicione em Saúde, na aba Cuidados.
        </Text>
      ) : (
        sorted.map((m, i) => (
          <CheckRow
            key={m.id}
            title={m.nome}
            subtitle={m.horario}
            done={m.tomado}
            onToggle={() => void toggleMedicamento(m.id, isGuest)}
            showSeparator={i < sorted.length - 1}
          />
        ))
      )}
      <PrimaryButton
        label="Abrir cuidados"
        variant="link"
        size="sm"
        onPress={() => router.push('/(tabs)/saude')}
      />
    </ExpandableSection>
  )
}
