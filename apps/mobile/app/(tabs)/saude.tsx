import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Screen, PillTabs } from '../../src/ui'
import { useDataStore } from '../../src/store/dataStore'
import { useAuthStore } from '../../src/store/authStore'
import { ScreenIntro } from '../../src/components/dashboard/ScreenIntro'
import { TabShell } from '../../src/components/dashboard/TabShell'
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
  const params = useLocalSearchParams<{ section?: string; care?: string }>()
  const [section, setSection] = useState<HealthSection>('diario')
  const [cuidadosTab, setCuidadosTab] = useState<CuidadosTab>('hidratacao')
  const humor = useDataStore((s) => s.humor)
  const loading = useDataStore((s) => s.loading)
  const refreshAll = useDataStore((s) => s.refreshAll)
  const isGuest = useAuthStore((s) => s.isGuest)

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
  const goDiario = () => setSection('diario')

  return (
    <Screen
      scroll
      refreshing={loading}
      onRefresh={() => void refreshAll({ isGuest })}
    >
      <TabShell>
        <ScreenIntro
          title="Saúde"
          subtitle="Check-in, cuidados e apoio no seu ritmo."
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
            <HealthTodayTab
              onGoCuidados={goCuidados}
              onGoApoio={goApoio}
              onGoDiario={goDiario}
            />
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
