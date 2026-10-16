import { useMemo } from 'react'
import { View } from 'react-native'
import { humorDoDia, moodLabel } from '@simply-life/shared'
import { Text } from '../../../ui'
import { Panel } from '../../../ui/Panel'
import { useTheme } from '../../../theme/ThemeProvider'
import { useWorkspace } from '../../../layout/useWorkspace'
import { useDataStore } from '../../../store/dataStore'
import { useAuthStore } from '../../../store/authStore'
import { useModules } from '../../../hooks/useModules'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'
import { WEB_DISPLAY_FONT } from '../../dashboard/web/webTypography'
import { HealthAxelStrip } from '../HealthAxelStrip'
import { DeskBlockHeader } from '../diary/DeskBlockHeader'
import { MoodChipRow } from './MoodChipRow'
import { CareStatusList, useCareStatus } from './CareStatusList'
import type { CuidadosTab } from '../healthNav'

type Props = {
  onGoCuidados: (tab: CuidadosTab) => void
  onGoApoio: () => void
  onGoDiario: () => void
}

/** Saúde → Hoje no computador: check-in e AXEL lado a lado, cuidados numa faixa clicável. */
export function HealthTodayDesk({ onGoCuidados, onGoApoio, onGoDiario }: Props)
{
  const { colors } = useTheme()
  const { width } = useWorkspace()
  const wideGrid = width >= 1280
  const span2 = webStyle({ gridColumn: wideGrid ? 'span 2' : undefined })
  const spanAll = webStyle({ gridColumn: wideGrid ? 'span 3' : undefined })
  const modules = useModules()
  const humor = useDataStore((s) => s.humor)
  const lastAxelCare = useDataStore((s) => s.lastAxelCare)
  const addHumor = useDataStore((s) => s.addHumor)
  const isGuest = useAuthStore((s) => s.isGuest)
  const hoje = useMemo(() => humorDoDia(humor), [humor])
  const care = useCareStatus()
  const pending = care.filter((c) => !c.done).length

  const link = (label: string, onPress: () => void) => (
    <WebHoverable onPress={onPress} style={webStyle({ cursor: 'pointer', alignSelf: 'flex-start' })}>
      {(hovered) => (
        <Text variant="caption" style={{ color: colors.axel, textDecorationLine: hovered ? 'underline' : 'none' }}>
          {label}
        </Text>
      )}
    </WebHoverable>
  )

  return (
    <View style={webStyle({ display: 'grid', gridTemplateColumns: wideGrid ? 'repeat(3, minmax(0, 1fr))' : 'minmax(0, 1fr)', gap: 16, alignItems: 'start' })}>
      {modules.on('mood') ? (
        <Panel style={span2}>
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <View style={{ gap: 4, flex: 1, minWidth: 0 }}>
                <Text variant="caption" muted>
                  {hoje ? 'Humor de hoje' : 'Check-in rápido'}
                </Text>
                <Text style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 26, lineHeight: 34, letterSpacing: -0.3, color: colors.ink }}>
                  {hoje ? moodLabel(hoje.humor) : 'Como você está?'}
                </Text>
              </View>
              {link('Abrir diário completo', onGoDiario)}
            </View>
            <MoodChipRow value={hoje?.humor} onChange={(m) => void addHumor(m, undefined, isGuest)} />
          </View>
        </Panel>
      ) : null}

      <Panel style={modules.on('mood') ? undefined : span2}>
        <View style={{ gap: 16 }}>
          <HealthAxelStrip message={lastAxelCare || 'Sem pressa. Um passo de cada vez já conta.'} />
          {modules.on('support')
            ? link('Precisa de apoio? CVV, TCC e foco na aba Apoio', onGoApoio)
            : (
              <Text variant="caption" muted>
                Em sofrimento intenso, ligue para o CVV: 188, de graça, 24 horas.
              </Text>
            )}
        </View>
      </Panel>

      {care.length ? (
        <Panel style={spanAll}>
          <View style={{ gap: 16 }}>
            <DeskBlockHeader
              title="Cuidados de hoje"
              subtitle={pending ? `${pending} ${pending === 1 ? 'ainda aberto' : 'ainda abertos'}, só o que fizer sentido` : 'Você já registrou o essencial hoje'}
              action={{ label: 'Ver todos os cuidados', onPress: () => onGoCuidados(care[0].id) }}
            />
            <CareStatusList layout="row" onPick={onGoCuidados} />
          </View>
        </Panel>
      ) : null}
    </View>
  )
}
