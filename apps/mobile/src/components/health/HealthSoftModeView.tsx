import { Linking, View, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { CALM_EXERCISES, humorDoDia, localTodayIso, moodColor, moodLabel } from '@simply-life/shared'
import { Text, PressableScale, PrimaryButton } from '../../ui'
import { Icon, type IconName } from '../../ui/Icon'
import { Panel } from '../../ui/Panel'
import { AxelSun } from '../AxelSun'
import { useWebDesk } from '../dashboard/web/webBox'
import { WebHoverable } from '../dashboard/web/WebHoverable'
import { webStyle } from '../dashboard/web/webStyle'
import { WEB_DISPLAY_FONT } from '../dashboard/web/webTypography'
import { useWorkspace } from '../../layout/useWorkspace'
import { MoodFaceRow } from '../MoodFace'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'
import { CrisisSupportCard } from './CrisisSupportCard'
import { HealthScreenSection } from './HealthScreenSection'
import { HealthAxelStrip } from './HealthAxelStrip'

type Props = {
  onGoApoio: () => void
  onGoDiario: () => void
}

/** Aba Hoje reduzida quando o humor do dia é 1 ou 2 — layout integrado. */
export function HealthSoftModeView({ onGoApoio, onGoDiario }: Props)
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const humor = useDataStore((s) => s.humor)
  const addHumor = useDataStore((s) => s.addHumor)
  const isGuest = useAuthStore((s) => s.isGuest)
  const humorHoje = humorDoDia(humor, localTodayIso()) ?? null
  const moodHeadline = humorHoje ? moodLabel(humorHoje.humor) : 'Como você está?'
  const desk = useWebDesk()

  if (desk)
  {
    return (
      <SoftModeDesk
        mood={humorHoje?.humor ?? null}
        onMood={(m) => void addHumor(m, undefined, isGuest)}
        onGoApoio={onGoApoio}
        onGoDiario={onGoDiario}
      />
    )
  }

  return (
    <View style={{ gap: space.md }}>
      <HealthAxelStrip message="Hoje pesa. Está tudo bem ir devagar. Só o que couber agora." />

      <HealthScreenSection dividerTop>
        <View style={{ gap: 4 }}>
          <Text variant="caption" muted>Check-in</Text>
          <Text variant="hero" style={{ fontSize: 28, letterSpacing: -0.8 }}>
            {moodHeadline}
          </Text>
          <Text variant="caption" muted>
            Pode atualizar se o sentimento mudar.
          </Text>
        </View>
        <MoodFaceRow
          value={humorHoje?.humor}
          onChange={(m) => void addHumor(m, undefined, isGuest)}
        />
        <PressableScale onPress={onGoDiario} accessibilityRole="button">
          <Text variant="caption" color={colors.axel} style={{ fontWeight: '600' }}>
            Abrir diário completo
          </Text>
        </PressableScale>
      </HealthScreenSection>

      <HealthScreenSection
        dividerTop
        title="Baixar o ritmo"
        subtitle="Um guia curto. Não precisa fazer os dois."
      >
        {CALM_EXERCISES.map((ex, index) =>
        {
          const last = index === CALM_EXERCISES.length - 1
          return (
            <PressableScale
              key={ex.id}
              onPress={() => router.push(ex.route as '/calm/box-breathing' | '/calm/grounding')}
            >
              <View
                style={{
                  gap: 6,
                  paddingVertical: 12,
                  borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
                  borderBottomColor: colors.hairline,
                }}
              >
                <Text variant="bodyStrong">{ex.title}</Text>
                <Text variant="caption" muted>
                  {ex.subtitle}
                </Text>
                <Text variant="caption" color={colors.axel}>
                  Cerca de {ex.durationMin} min
                </Text>
              </View>
            </PressableScale>
          )
        })}
      </HealthScreenSection>

      <HealthScreenSection dividerTop>
        <CrisisSupportCard compact />
        <PrimaryButton
          label="Ver apoio completo"
          variant="ghost"
          onPress={onGoApoio}
        />
      </HealthScreenSection>
    </View>
  )
}

// ícone pelo exercício (rota): respiração e volta ao corpo
const calmIcon = (route: string): IconName => (route.includes('grounding') ? 'body-outline' : 'leaf-outline')

/**
 * Modo suave no computador: duas colunas compactas e cores baixas (dia difícil não
 * pede tela gritando). Humor marcado por tinta e contorno, ações neutras.
 */
function SoftModeDesk({
  mood,
  onMood,
  onGoApoio,
  onGoDiario,
}: {
  mood: number | null
  onMood: (m: number) => void
  onGoApoio: () => void
  onGoDiario: () => void
})
{
  const { colors } = useTheme()
  const router = useRouter()
  const { width } = useWorkspace()
  const wide = width >= 1100

  const softButton = (label: string, icon: IconName, onPress: () => void) => (
    <WebHoverable
      key={label}
      onPress={onPress}
      accessibilityLabel={label}
      style={(hovered) => webStyle({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 38,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.hairline,
        backgroundColor: hovered ? colors.surface : 'transparent',
        cursor: 'pointer',
      })}
    >
      <Icon name={icon} size={15} color={colors.ink} />
      <Text style={{ fontSize: 14, fontFamily: 'Lexend_500Medium', color: colors.ink }}>{label}</Text>
    </WebHoverable>
  )

  return (
    <View style={webStyle({ display: 'grid', gridTemplateColumns: wide ? 'minmax(0, 1.6fr) minmax(0, 1fr)' : 'minmax(0, 1fr)', gap: 16, alignItems: 'start' })}>
      <View style={{ gap: 16, minWidth: 0 }}>
        <Panel>
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <AxelSun size={40} mood="care" />
              <Text style={{ flex: 1, fontFamily: WEB_DISPLAY_FONT, fontSize: 19, lineHeight: 27, color: colors.ink }}>
                Hoje pesa. Está tudo bem ir devagar. Só o que couber agora.
              </Text>
            </View>
            <View style={{ gap: 10 }}>
              <Text variant="caption" muted>
                Check-in de hoje{mood != null ? `: ${moodLabel(mood)}. Pode mudar se o sentimento mudar.` : ''}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[1, 2, 3, 4, 5].map((m) =>
                {
                  const on = mood === m
                  const c = moodColor(m)
                  return (
                    <WebHoverable
                      key={m}
                      onPress={() => onMood(m)}
                      accessibilityLabel={moodLabel(m)}
                      style={(hovered) => webStyle({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        height: 36,
                        paddingHorizontal: 14,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: on ? c : colors.hairline,
                        backgroundColor: on ? `${c}1F` : hovered ? colors.surface : 'transparent',
                        cursor: 'pointer',
                      })}
                    >
                      <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: c }} />
                      <Text style={{ fontSize: 14, fontFamily: on ? 'Lexend_600SemiBold' : 'Lexend_400Regular', color: colors.ink }}>{moodLabel(m)}</Text>
                    </WebHoverable>
                  )
                })}
              </View>
              <WebHoverable onPress={onGoDiario} accessibilityLabel="Abrir diário completo" style={webStyle({ alignSelf: 'flex-start', cursor: 'pointer' })}>
                <Text variant="caption" style={{ color: colors.inkMuted, textDecorationLine: 'underline' }}>Abrir diário completo</Text>
              </WebHoverable>
            </View>
          </View>
        </Panel>

        <Panel>
          <View style={{ gap: 12 }}>
            <View style={{ gap: 4 }}>
              <Text variant="bodyStrong" style={{ fontSize: 16 }}>Baixar o ritmo</Text>
              <Text variant="caption" muted>Um guia curto. Não precisa fazer os dois.</Text>
            </View>
            <View style={webStyle({ display: 'grid', gridTemplateColumns: wide ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)', gap: 12 })}>
              {CALM_EXERCISES.map((ex) => (
                <WebHoverable
                  key={ex.id}
                  onPress={() => router.push(ex.route as '/calm/box-breathing' | '/calm/grounding')}
                  accessibilityLabel={ex.title}
                  style={(hovered) => webStyle({
                    flexDirection: 'row',
                    gap: 12,
                    padding: 14,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: hovered ? colors.hairlineStrong : colors.hairline,
                    cursor: 'pointer',
                  })}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={calmIcon(ex.route)} size={16} color={colors.inkMuted} />
                  </View>
                  <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                    <Text variant="bodyStrong" style={{ fontSize: 14 }}>{ex.title}</Text>
                    <Text variant="caption" muted numberOfLines={2}>{ex.subtitle}</Text>
                    <Text variant="caption" muted>Cerca de {ex.durationMin} min</Text>
                  </View>
                </WebHoverable>
              ))}
            </View>
          </View>
        </Panel>
      </View>

      <Panel>
        <View style={{ gap: 10 }}>
          <View style={{ gap: 2 }}>
            <Text variant="bodyStrong" style={{ fontSize: 16 }}>Apoio emocional 24h</Text>
            <Text variant="caption" muted>CVV, Centro de Valorização da Vida</Text>
          </View>
          <Text variant="caption" muted style={{ lineHeight: 20 }}>
            Se o momento está difícil, você pode ligar gratuitamente para o CVV (188). O SunFy organiza a
            rotina; não substitui atendimento profissional nem emergência médica (SAMU 192).
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {softButton('Ligar 188', 'call-outline', () => void Linking.openURL('tel:188').catch(() => {}))}
            {softButton('Site do CVV', 'globe-outline', () => void Linking.openURL('https://www.cvv.org.br'))}
          </View>
          <WebHoverable onPress={onGoApoio} accessibilityLabel="Ver apoio completo" style={webStyle({ alignSelf: 'flex-start', paddingTop: 4, cursor: 'pointer' })}>
            <Text variant="caption" style={{ color: colors.inkMuted, textDecorationLine: 'underline' }}>Ver apoio completo</Text>
          </WebHoverable>
        </View>
      </Panel>
    </View>
  )
}
