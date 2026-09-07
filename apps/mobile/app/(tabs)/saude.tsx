import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { findHabit, habitPct, formatSleepHours } from '@simply-life/shared'
import { Screen, PillTabs } from '../../src/ui'
import { useDataStore } from '../../src/store/dataStore'
import { useAuthStore } from '../../src/store/authStore'
import { ScreenIntro } from '../../src/components/dashboard/ScreenIntro'
import { MetricCards } from '../../src/components/dashboard/MetricCards'
import { TabShell } from '../../src/components/dashboard/TabShell'
import { useTheme } from '../../src/theme/ThemeProvider'
import { HealthTodayTab } from '../../src/components/health/HealthTodayTab'
import { HealthCuidadosTab } from '../../src/components/health/HealthCuidadosTab'
import { HealthDiaryTab } from '../../src/components/health/HealthDiaryTab'
import { HealthApoioTab } from '../../src/components/health/HealthApoioTab'
import {
  HEALTH_MAIN_TABS,
  type HealthSection,
  type CuidadosTab,
} from '../../src/components/health/healthNav'

export default function SaudeScreen()
{
  const { colors } = useTheme()
  const params = useLocalSearchParams<{ section?: string; care?: string }>()
  const [section, setSection] = useState<HealthSection>('hoje')
  const [cuidadosTab, setCuidadosTab] = useState<CuidadosTab>('hidratacao')
  const humor = useDataStore((s) => s.humor)
  const habits = useDataStore((s) => s.habits)
  const loading = useDataStore((s) => s.loading)
  const refreshAll = useDataStore((s) => s.refreshAll)
  const isGuest = useAuthStore((s) => s.isGuest)

  const agua = findHabit(habits, 'agua')
  const proteina = findHabit(habits, 'proteina')
  const sono = findHabit(habits, 'sono')
  const last7 = humor.slice(-7)
  const moodAvg = last7.length
    ? last7.reduce((acc, h) => acc + h.humor, 0) / last7.length / 5
    : 0
  const vitality = Math.round(
    ((moodAvg + habitPct(agua) / 100 + habitPct(proteina) / 100 + habitPct(sono) / 100) / 4) * 100,
  )

  useEffect(() =>
  {
    if (
      params.section === 'cuidados'
      || params.section === 'hoje'
      || params.section === 'diario'
      || params.section === 'apoio'
    )
    {
      setSection(params.section)
    }
    const care = params.care as CuidadosTab | undefined
    if (care === 'hidratacao' || care === 'alimentacao' || care === 'academia' || care === 'medicamentos' || care === 'sono')
    {
      setCuidadosTab(care)
      setSection('cuidados')
    }
  }, [params.section, params.care])

  const goCuidados = (tab: CuidadosTab) =>
  {
    setCuidadosTab(tab)
    setSection('cuidados')
  }

  const goApoio = () => setSection('apoio')

  return (
    <Screen
      scroll
      refreshing={loading}
      onRefresh={() => void refreshAll({ isGuest })}
    >
      <TabShell>
        <ScreenIntro title="Saúde" subtitle="Hoje, cuidados, diário e apoio — no seu ritmo." />

        <MetricCards
          items={[
            {
              label: 'Vitalidade',
              value: `${vitality}%`,
              color: colors.health,
              hint: 'Humor · água · proteína · sono',
            },
            {
              label: 'Água hoje',
              value: agua ? `${agua.progressoAtual}` : '-',
              color: colors.health,
              hint: `de ${agua?.metaDiaria ?? 10} copos`,
            },
            {
              label: 'Sono',
              value: sono && sono.progressoAtual > 0 ? formatSleepHours(sono.progressoAtual) : '—',
              color: '#C4A574',
              hint: sono ? `meta ${sono.metaDiaria}h` : 'registre a noite',
            },
          ]}
        />

        <PillTabs
          tabs={HEALTH_MAIN_TABS.map((t) => ({
            ...t,
            count: t.id === 'diario' ? humor.length : undefined,
          }))}
          value={section}
          onChange={setSection}
        />

        <View>
          {section === 'hoje' && (
            <HealthTodayTab onGoCuidados={goCuidados} onGoApoio={goApoio} />
          )}
          {section === 'cuidados' && (
            <HealthCuidadosTab tab={cuidadosTab} onChange={setCuidadosTab} />
          )}
          {section === 'diario' && <HealthDiaryTab />}
          {section === 'apoio' && <HealthApoioTab />}
        </View>
      </TabShell>
    </Screen>
  )
}
