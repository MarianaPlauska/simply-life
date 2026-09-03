import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import {
  findHabit,
  habitPct,
  medsTakenCount,
  AGUA_META_COPOS,
} from '@simply-life/shared'
import {
  Text,
  PrimaryButton,
  ProgressRing,
  PressableScale,
  StatusPill,
} from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'
import { ExpandableSection } from './ExpandableSection'

/** ml por copo - alinhado a apps de hidratação (2 L / 10 copos) */
const ML_PER_CUP = 200

/**
 * Saúde + Água na Home - estilo studio de hidratação (anel, copos, KPIs).
 * Cores: health (água) + AXEL só no acento de expandir.
 */
export function HomeHealthStudio()
{
  const { colors, space, radius } = useTheme()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const habits = useDataStore((s) => s.habits)
  const medicamentos = useDataStore((s) => s.medicamentos) ?? []
  const humor = useDataStore((s) => s.humor) ?? []
  const addWaterCup = useDataStore((s) => s.addWaterCup)
  const isGuest = useAuthStore((s) => s.isGuest)

  const agua = findHabit(habits, 'agua')
  const proteina = findHabit(habits, 'proteina')
  const treino = findHabit(habits, 'treino')
  const meta = agua?.metaDiaria ?? AGUA_META_COPOS
  const atual = agua?.progressoAtual ?? 0
  const pct = habitPct(agua)
  const mlAtual = atual * ML_PER_CUP
  const mlMeta = meta * ML_PER_CUP
  const medsDone = medsTakenCount(medicamentos)
  const medsTotal = medicamentos.length
  const humorHoje = useMemo(() =>
  {
    const today = new Date().toISOString().slice(0, 10)
    const row = humor.find((h) => (h.data || '').slice(0, 10) === today) ?? humor[0]
    return row?.humor ?? null
  }, [humor])

  const kpis = [
    {
      id: 'agua',
      label: 'Água',
      value: `${mlAtual} ml`,
      hint: `meta ${mlMeta} ml`,
      color: colors.health,
      progress: pct,
    },
    {
      id: 'proteina',
      label: 'Proteína',
      value: proteina ? `${proteina.progressoAtual}g` : '-',
      hint: proteina ? `${habitPct(proteina)}%` : 'sem meta',
      color: colors.finance,
      progress: proteina ? habitPct(proteina) : 0,
    },
    {
      id: 'treino',
      label: 'Treino',
      value: treino?.progressoAtual ? 'Feito' : 'Pendente',
      hint: 'sessão',
      color: colors.axel,
      progress: treino?.progressoAtual ? 100 : 0,
    },
    {
      id: 'meds',
      label: 'Doses',
      value: medsTotal ? `${medsDone}/${medsTotal}` : '-',
      hint: 'medicamentos',
      color: colors.attention,
      progress: medsTotal ? Math.round((medsDone / medsTotal) * 100) : 0,
    },
  ]

  return (
    <ExpandableSection
      title="Saúde & água"
      subtitle={`${mlAtual} / ${mlMeta} ml · humor ${humorHoje ?? '-'}`}
      pill={`${pct}%`}
      pillColor={colors.health}
      accent={colors.health}
      expanded={open}
      onToggle={() => setOpen((v) => !v)}
      summary={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <ProgressRing progress={pct} size={56} strokeWidth={5} color={colors.health} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="title" color={colors.health} style={{ fontSize: 22 }}>
              {mlAtual} ml
            </Text>
            <Text variant="caption" muted>
              {atual}/{meta} copos · toque para o studio
            </Text>
          </View>
          <PrimaryButton
            label="+ Copo"
            size="sm"
            onPress={() => void addWaterCup(isGuest)}
            style={{ borderRadius: 999 }}
          />
        </View>
      }
    >
      {/* KPIs estilo dashboard clínico */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {kpis.map((k) => (
          <View
            key={k.id}
            style={{
              flexGrow: 1,
              flexBasis: '46%',
              minWidth: 140,
              gap: 8,
              padding: space.md,
              borderRadius: 16,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.hairline,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="caption" muted>
                {k.label}
              </Text>
              <ProgressRing
                progress={k.progress}
                size={28}
                strokeWidth={3}
                color={k.color}
                showLabel={false}
              />
            </View>
            <Text variant="bodyStrong" color={k.color} style={{ fontSize: 18 }}>
              {k.value}
            </Text>
            <Text variant="micro" muted>
              {k.hint}
            </Text>
          </View>
        ))}
      </View>

      {/* Studio de hidratação - grade de copos */}
      <View
        style={{
          gap: space.md,
          padding: space.md,
          borderRadius: 18,
          backgroundColor: colors.healthMuted,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="section" style={{ fontSize: 15 }}>
            Copos de hoje
          </Text>
          <StatusPill label={`${atual} de ${meta}`} color={colors.health} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Array.from({ length: meta }).map((_, i) =>
          {
            const filled = i < atual
            return (
              <PressableScale
                key={`cup-${i}`}
                onPress={() =>
                {
                  if (!filled) void addWaterCup(isGuest)
                }}
                accessibilityLabel={filled ? `Copo ${i + 1} ok` : `Registrar copo ${i + 1}`}
                style={{
                  width: 44,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: filled ? colors.health : colors.elevated,
                  borderWidth: 1,
                  borderColor: filled ? colors.health : colors.hairline,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="water"
                  size={20}
                  color={filled ? colors.canvas : colors.inkFaint}
                />
              </PressableScale>
            )
          })}
        </View>
        <View
          style={{
            height: 8,
            borderRadius: radius.pill,
            backgroundColor: colors.elevated,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${pct}%`,
              height: '100%',
              backgroundColor: colors.health,
              borderRadius: radius.pill,
            }}
          />
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <PrimaryButton
          label="Abrir Saúde"
          size="sm"
          variant="secondary"
          onPress={() => router.push('/(tabs)/saude')}
          style={{ borderRadius: 999 }}
        />
        <PrimaryButton
          label="+ 1 copo"
          size="sm"
          onPress={() => void addWaterCup(isGuest)}
          style={{ borderRadius: 999 }}
        />
      </View>
    </ExpandableSection>
  )
}
