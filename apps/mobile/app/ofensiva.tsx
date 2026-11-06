import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Modal } from '../src/ui/Modal'
import { Redirect, useRouter } from 'expo-router'
import { Icon } from '../src/ui/Icon'
import {
  buildStreakWeek,
  CHAMA_WEEK_GOAL_DAYS,
  ELO_ACAO_LABEL,
  isEloAcao,
} from '@simply-life/shared'
import { Screen, Text, PillTabs, PrimaryButton } from '../src/ui'
import { safeBack } from '../src/lib/safeBack'
import { StreakWeekRow } from '../src/components/streak/StreakWeekRow'
import { EloHeatmap } from '../src/components/streak/EloHeatmap'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAccents } from '../src/theme/useAccents'
import { useAuthStore } from '../src/store/authStore'
import { actionIsos, openIsos, useActivityStore } from '../src/store/activityStore'
import { useElo } from '../src/hooks/useElo'
import { METAS_HREF } from '../src/lib/sharedGoalRoutes'
import { PersonalDivisionCard } from '../src/components/rewards/TrilhaCards'

type Tab = 'semana' | 'historico'

export default function OfensivaScreen()
{
  const { colors, space } = useTheme()
  const accents = useAccents()
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const days = useActivityStore((s) => s.days)
  const hydrate = useActivityStore((s) => s.hydrate)
  const markOpen = useActivityStore((s) => s.markOpen)
  const elo = useElo()

  const [tab, setTab] = useState<Tab>('semana')
  const [help, setHelp] = useState(false)

  useEffect(() =>
  {
    hydrate()
    markOpen()
  }, [hydrate, markOpen])

  // Tarefas entram pelo dia local da conclusão (useEloSync), nunca pelo vencimento.

  const actions = useMemo(() => actionIsos(days), [days])
  const opens = useMemo(() => openIsos(days), [days])
  const rests = useMemo(
    () => Object.keys(elo.dias).filter((iso) => elo.dias[iso] === 'descanso'),
    [elo.dias],
  )
  const week = useMemo(() => buildStreakWeek(actions, opens, new Date(), rests), [actions, opens, rests])

  const recent = useMemo(() =>
  {
    return [...actions]
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 14)
      .map((iso) => ({ iso, kinds: (days[iso]?.actions ?? []).filter(isEloAcao) }))
  }, [actions, days])

  const semana = elo.cumpridosNaSemana
  // sem cobrança: o texto só descreve o que já aconteceu
  const hojeTexto = elo.cumpridoHoje
    ? 'Hoje já tem algo seu guardado. O resto do dia é livre.'
    : 'Hoje está livre. Se fizer algo por você, aparece aqui. Se não der, tudo bem.'

  if (!userId) return <Redirect href="/login" />

  const row = (pressed: boolean) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    minHeight: 64,
    paddingVertical: 12,
    backgroundColor: pressed ? colors.fill : 'transparent',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  })

  return (
    <Screen scroll tabBarInset={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginHorizontal: -10 }}>
        <Pressable
          onPress={() => safeBack(router, '/(tabs)')}
          accessibilityLabel="Voltar"
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => setHelp(true)}
          accessibilityLabel="Como funciona"
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="help-circle" size={22} color={colors.ink} />
        </Pressable>
      </View>
      <Text variant="hero" style={{ fontSize: 32, letterSpacing: -0.8, marginBottom: 8 }}>
        Seus dias
      </Text>
      <Text variant="body" muted style={{ marginBottom: 16 }}>
        Aqui ficam guardados os dias em que você fez algo por você. Não é meta, não é nota, e nada se perde se você parar um tempo.
      </Text>

      <PillTabs
        tabs={[
          { id: 'semana', label: 'Semana' },
          { id: 'historico', label: 'Histórico' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'semana' ? (
        <View style={{ gap: 24, paddingTop: 12 }}>
          <StreakWeekRow cells={week} />

          <View style={{ gap: 4 }}>
            <Text variant="hero" style={{ fontSize: 44, letterSpacing: -1.5, lineHeight: 50 }}>
              {semana}
            </Text>
            <Text variant="bodyStrong">
              {semana === 1 ? 'dia com algo seu nesta semana' : 'dias com algo seu nesta semana'}
            </Text>
            <Text variant="caption" muted style={{ marginTop: 4 }}>
              {hojeTexto}
            </Text>
          </View>

          <EloHeatmap semanas={26} />
        </View>
      ) : (
        <View style={{ paddingTop: 12 }}>
          <Text variant="caption" muted style={{ marginBottom: 12 }}>
            Tudo conta: tarefa ou rotina, foco, humor, água, refeição, gasto ou anotação.
          </Text>
          {recent.length === 0 ? (
            <Text variant="body" muted>
              Ainda não tem dias aqui. Quando você registrar algo, ele aparece, no seu tempo.
            </Text>
          ) : (
            recent.map((r) => (
              <View key={r.iso} style={row(false)}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    backgroundColor: `${accents.data}26`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="leaf" size={16} color={accents.data} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">
                    {new Date(`${r.iso}T12:00:00`).toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                  <Text variant="caption" muted numberOfLines={1}>
                    {r.kinds.map((k) => ELO_ACAO_LABEL[k]).join(' · ')}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      <View style={{ marginTop: space.xl }}>
        <PersonalDivisionCard />
      </View>

      <View style={{ marginTop: space.lg }}>
        <Pressable
          onPress={() => router.push('/colecao' as never)}
          accessibilityRole="button"
          accessibilityLabel="Álbum e prêmios"
          style={({ pressed }) => row(pressed)}
        >
          <Icon name="gift" size={22} color={colors.ink} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Álbum e prêmios</Text>
            <Text variant="caption" muted>
              Semanas com {CHAMA_WEEK_GOAL_DAYS} dias de registro viram peças da sua coleção.
            </Text>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.inkMuted} />
        </Pressable>

        <Pressable
          onPress={() => router.push(METAS_HREF)}
          accessibilityRole="button"
          accessibilityLabel="Metas juntos"
          style={({ pressed }) => ({ ...row(pressed), borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline })}
        >
          <Icon name="people" size={22} color={colors.ink} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Metas juntos</Text>
            <Text variant="caption" muted>
              Com amigos, sem ver o número de ninguém.
            </Text>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.inkMuted} />
        </Pressable>
      </View>

      <Modal visible={help} transparent animationType="fade" onRequestClose={() => setHelp(false)}>
        <Pressable
          onPress={() => setHelp(false)}
          style={{
            flex: 1,
            backgroundColor: colors.overlay,
            justifyContent: 'center',
            padding: space.lg,
          }}
        >
          <Pressable
            onPress={() => undefined}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: space.lg,
              gap: 12,
            }}
          >
            <Text variant="section">Como funciona</Text>
            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 12 }}>
              <Text variant="body" muted>
                Um dia entra aqui quando você faz alguma coisa por você: conclui uma tarefa, marca uma rotina, termina um foco, registra humor, água, refeição ou gasto, ou escreve uma anotação.
              </Text>
              <Text variant="body" muted>
                Dias sem registro não são falta. Descansar faz parte, e nada do que você já guardou se perde.
              </Text>
              <Text variant="body" muted>
                No mapa de dias, a cor mais forte mostra quanto do que você planejou foi feito. Sem plano, mostra quantos tipos de registro o dia teve. O ponto marca descanso.
              </Text>
              <Text variant="body" muted>
                Seus dias vão junto com a conta para qualquer aparelho.
              </Text>
            </ScrollView>
            <PrimaryButton label="Entendi" onPress={() => setHelp(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  )
}
