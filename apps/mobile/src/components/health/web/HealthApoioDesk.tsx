import { useEffect, useState } from 'react'
import { Linking, View } from 'react-native'
import { useRouter } from 'expo-router'
import { CALM_EXERCISES, TCC_JOURNEYS } from '@simply-life/shared'
import { chartColor } from '@simply-life/ui-tokens'
import { Text, PrimaryButton } from '../../../ui'
import { Icon } from '../../../ui/Icon'
import { Panel } from '../../../ui/Panel'
import { useTheme } from '../../../theme/ThemeProvider'
import { useWorkspace } from '../../../layout/useWorkspace'
import { usePrefsStore } from '../../../store/prefsStore'
import { loadRecentTccItems, type TccRecentItem } from '../../../lib/tccPersist'
import { WebHoverable } from '../../dashboard/web/WebHoverable'
import { webStyle } from '../../dashboard/web/webStyle'
import { DeskBlockHeader } from '../diary/DeskBlockHeader'
import { HealthNeuroFocusPanel } from '../HealthNeuroFocusPanel'
import { recentKindLabel, recentLabel } from './tccRecent'

const CALM_ICONS: Record<string, keyof typeof Icon.glyphMap> = {
  box_breathing: 'pulse',
  grounding_54321: 'leaf-outline',
}

const TCC_ICONS: Record<string, keyof typeof Icon.glyphMap> = {
  thought_record: 'create-outline',
  behavioral_activation: 'walk-outline',
  gradual_exposure: 'trending-up-outline',
}

/** Linha clicável de guia (ícone, título, explicação, duração): sem caixa própria dentro do painel. */
function GuideRow({ icon, tint, title, subtitle, meta, onPress }: {
  icon: keyof typeof Icon.glyphMap
  tint: string
  title: string
  subtitle: string
  meta: string
  onPress: () => void
})
{
  const { colors } = useTheme()
  return (
    <WebHoverable
      onPress={onPress}
      accessibilityLabel={title}
      style={(hovered) => webStyle({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: hovered ? colors.surface : 'transparent',
        cursor: 'pointer',
      })}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: `${tint}1F` }}>
        <Icon name={icon} size={20} color={tint} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text variant="body">{title}</Text>
        <Text variant="caption" muted>
          {subtitle}
        </Text>
      </View>
      <Text variant="caption" muted>
        {meta}
      </Text>
      <Icon name="chevron-forward" size={18} color={colors.inkFaint} />
    </WebHoverable>
  )
}

/** Saúde → Apoio no computador: CVV ao lado das ações de agora; TCC e registros abertos, sem bloco recolhido. */
export function HealthApoioDesk()
{
  const { colors, chart } = useTheme()
  const { width } = useWorkspace()
  const router = useRouter()
  const wideGrid = width >= 1280
  const span2 = webStyle({ gridColumn: wideGrid ? 'span 2' : undefined })
  const minutes = usePrefsStore((s) => s.prefs.pomodoro_focus) || 25
  const [recent, setRecent] = useState<TccRecentItem[]>([])
  const [loading, setLoading] = useState(true)
  const teal = chartColor(chart, 'teal')

  useEffect(() =>
  {
    let alive = true
    void loadRecentTccItems(8).then((items) =>
    {
      if (!alive) return
      setRecent(items)
      setLoading(false)
    })
    return () =>
    {
      alive = false
    }
  }, [])

  return (
    <View style={webStyle({ display: 'grid', gridTemplateColumns: wideGrid ? 'repeat(3, minmax(0, 1fr))' : 'minmax(0, 1fr)', gap: 16, alignItems: 'start' })}>
      {/* CVV primeiro na leitura em uma coluna; na grade fica à direita das ações */}
      <Panel style={webStyle({ gridColumn: wideGrid ? '3' : undefined, gridRow: wideGrid ? '1' : undefined })}>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="heart-outline" size={18} color={colors.danger} />
            <Text variant="section" style={{ fontSize: 18, lineHeight: 26 }}>
              Apoio emocional 24h
            </Text>
          </View>
          <Text variant="caption" muted>
            Se o momento está difícil, ligue de graça para o CVV (188) ou use o chat em cvv.org.br. Em risco imediato à vida, procure o SAMU (192).
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <PrimaryButton label="Ligar 188" icon="call-outline" size="sm" onPress={() => void Linking.openURL('tel:188').catch(() => undefined)} />
            <PrimaryButton label="Site do CVV" icon="globe-outline" size="sm" variant="secondary" onPress={() => void Linking.openURL('https://www.cvv.org.br')} />
          </View>
        </View>
      </Panel>

      <Panel style={webStyle({ gridColumn: wideGrid ? '1 / span 2' : undefined, gridRow: wideGrid ? '1' : undefined })}>
        <View style={{ gap: 8 }}>
          <DeskBlockHeader title="Acalmar agora" subtitle="Escolha um guia. Não é prova, é só um apoio curto." />
          <View style={{ marginHorizontal: -12 }}>
            {CALM_EXERCISES.map((ex) => (
              <GuideRow
                key={ex.id}
                icon={CALM_ICONS[ex.id] ?? 'leaf-outline'}
                tint={teal}
                title={ex.title}
                subtitle={ex.subtitle}
                meta={`${ex.durationMin} min`}
                onPress={() => router.push(ex.route as '/calm/box-breathing' | '/calm/grounding')}
              />
            ))}
          </View>
        </View>
      </Panel>

      <Panel style={span2}>
        <View style={{ gap: 8 }}>
          <DeskBlockHeader title="Exercícios de TCC" subtitle="Jornadas curtas e opcionais. Organizam o pensamento, não substituem psicoterapia nem diagnóstico." />
          <View style={{ marginHorizontal: -12 }}>
            {TCC_JOURNEYS.map((j) => (
              <GuideRow
                key={j.id}
                icon={TCC_ICONS[j.id] ?? 'create-outline'}
                tint={colors.health}
                title={j.title}
                subtitle={j.subtitle}
                meta={`${j.durationMin} min, ${j.steps} passos`}
                onPress={() => router.push(j.route as '/tcc/thought-record' | '/tcc/behavioral-activation' | '/tcc/gradual-exposure')}
              />
            ))}
          </View>
        </View>
        {/* sem registros: só uma linha aqui, em vez de um painel vazio */}
        {!loading && recent.length === 0 ? (
          <Text variant="caption" muted>
            Nenhum exercício concluído ainda. Comece por registro de pensamento ou ativação comportamental.
          </Text>
        ) : null}
      </Panel>
      <Panel>
        <View style={{ gap: 12 }}>
          <DeskBlockHeader title="Sessão de foco" subtitle={`${minutes} min. Uma tarefa por vez, só timer.`} />
          <Text variant="caption" muted>
            Serve para começar quando a cabeça não encaixa sozinha. Pode ligar a uma tarefa do Kanban.
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <PrimaryButton label={`Começar ${minutes} min`} icon="timer-outline" size="sm" onPress={() => router.push('/foco')} />
          </View>
        </View>
        <HealthNeuroFocusPanel bare />
      </Panel>

      {recent.length > 0 ? (
        <Panel style={webStyle({ gridColumn: wideGrid ? 'span 3' : undefined })}>
          <View style={{ gap: 8 }}>
            <DeskBlockHeader title="Registros recentes" subtitle="Últimos exercícios concluídos" />
            {recent.map((row, i) => (
              <View
                key={`${row.kind}-${row.entry.id}`}
                style={{ flexDirection: 'row', alignItems: 'baseline', gap: 16, paddingVertical: 10, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.hairline }}
              >
                <Text variant="caption" muted style={{ width: 150 }}>
                  {new Date(row.entry.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text variant="caption" color={colors.health} style={{ width: 96 }}>
                  {recentKindLabel(row)}
                </Text>
                <Text variant="body" numberOfLines={1} style={{ flex: 1, minWidth: 0 }}>
                  {recentLabel(row)}
                </Text>
              </View>
            ))}
          </View>
        </Panel>
      ) : null}
    </View>
  )
}
