import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { Modal } from '../src/ui/Modal'
import { Redirect, useRouter } from 'expo-router'
import { Icon } from '../src/ui/Icon'
import {
  buildStreakWeek,
  CHAMA_WEEK_GOAL_DAYS,
  ELO_ACAO_LABEL,
  isEloAcao,
  nextStreakMilestone,
} from '@simply-life/shared'
import { Screen, Text, PillTabs, PrimaryButton } from '../src/ui'
import { StreakWeekRow } from '../src/components/streak/StreakWeekRow'
import { EloHeatmap } from '../src/components/streak/EloHeatmap'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAccents } from '../src/theme/useAccents'
import { useAuthStore } from '../src/store/authStore'
import { actionIsos, openIsos, useActivityStore } from '../src/store/activityStore'
import { useElo } from '../src/hooks/useElo'
import { METAS_HREF } from '../src/lib/sharedGoalRoutes'
import { PersonalDivisionCard } from '../src/components/rewards/TrilhaCards'

type Tab = 'sequencia' | 'ativos'

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

  const [tab, setTab] = useState<Tab>('sequencia')
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
  const next = nextStreakMilestone(elo.atual)
  const barPct = next ? Math.min(100, Math.round((elo.atual / next) * 100)) : 100

  const recent = useMemo(() =>
  {
    return [...actions]
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 14)
      .map((iso) => ({ iso, kinds: (days[iso]?.actions ?? []).filter(isEloAcao) }))
  }, [actions, days])

  const hojeTitulo = elo.cumpridoHoje ? 'Hoje está cumprido.' : 'Hoje ainda está aberto.'
  const hojeTexto = elo.cumpridoHoje
    ? 'Volte amanhã, ou continue no seu ritmo agora.'
    : elo.emRisco
      ? 'O descanso desta semana já foi usado. Uma ação pequena hoje segura o elo.'
      : 'Uma ação pequena já cumpre o dia. Se não der, o descanso da semana cobre, sem castigo.'

  if (!userId) return <Redirect href="/login" />

  return (
    <Screen scroll tabBarInset={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Voltar"
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.elevated,
          }}
        >
          <Icon name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => setHelp(true)}
          accessibilityLabel="Como funciona"
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.elevated,
          }}
        >
          <Icon name="help" size={18} color={colors.ink} />
        </Pressable>
      </View>
      <Text variant="hero" style={{ fontSize: 32, letterSpacing: -0.8, marginBottom: 12 }}>
        Elo
      </Text>

      <PillTabs
        tabs={[
          { id: 'sequencia', label: 'Sequência' },
          { id: 'ativos', label: 'Dias cumpridos' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'sequencia' ? (
        <View style={{ gap: 28, paddingTop: 8, alignItems: 'center' }}>
          <StreakWeekRow cells={week} />

          <View style={{ alignItems: 'center', gap: 6 }}>
            <Icon name="flame" size={88} color={colors.axel} />
            <Text
              variant="hero"
              style={{
                marginTop: -36,
                fontSize: 56,
                letterSpacing: -2,
                lineHeight: 60,
              }}
            >
              {elo.atual}
            </Text>
            <Text variant="caption" muted>
              {elo.atual === 1 ? 'dia cumprido seguido' : 'dias cumpridos seguidos'}
            </Text>
            <Text variant="bodyStrong" style={{ marginTop: 8 }}>
              Recorde pessoal: {elo.recorde}
            </Text>
            <Text variant="caption" muted style={{ textAlign: 'center' }}>
              {elo.descansoUsadoNestaSemana
                ? 'Descanso desta semana já usado'
                : 'Descanso desta semana disponível'}
            </Text>
          </View>

          <View style={{ alignSelf: 'stretch' }}>
            <EloHeatmap semanas={26} />
          </View>

          <View style={{ alignSelf: 'stretch', gap: 12 }}>
            <View
              style={{
                height: 10,
                borderRadius: 999,
                backgroundColor: colors.hairline,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${barPct}%`,
                  height: '100%',
                  backgroundColor: accents.data,
                  borderRadius: 999,
                }}
              />
            </View>
            <Text variant="caption" muted>
              {next
                ? `Próximo marco: ${next} dias`
                : 'Você passou de todos os marcos desta trilha.'}
            </Text>
          </View>

          <View style={{ alignSelf: 'stretch', gap: 8 }}>
            <Text variant="bodyStrong">{hojeTitulo}</Text>
            <Text variant="caption" muted>
              {hojeTexto}
            </Text>
          </View>

          <PrimaryButton
            label="Executar uma tarefa"
            onPress={() => router.push('/(tabs)/kanban')}
            style={{ alignSelf: 'stretch' }}
          />
        </View>
      ) : (
        <View style={{ gap: 16, paddingTop: 12 }}>
          <Text variant="caption" muted>
            Dias com pelo menos uma ação: tarefa ou rotina, foco terminado, humor, água, refeição, gasto ou anotação.
          </Text>
          {recent.length === 0 ? (
            <Text variant="body">Nenhum dia cumprido ainda. Uma ação pequena já acende o fogo.</Text>
          ) : (
            recent.map((row) => (
              <View
                key={row.iso}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                  minHeight: 52,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  backgroundColor: colors.elevated,
                }}
              >
                <Icon name="flame" size={18} color={colors.axel} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">
                    {new Date(`${row.iso}T12:00:00`).toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                  <Text variant="caption" muted numberOfLines={1}>
                    {row.kinds.map((k) => ELO_ACAO_LABEL[k]).join(' · ')}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      <View style={{ marginTop: space.lg }}>
        <PersonalDivisionCard />
      </View>

      <Pressable
        onPress={() => router.push('/colecao' as never)}
        accessibilityRole="button"
        accessibilityLabel="Álbum e prêmios"
        style={({ pressed }) => ({
          marginTop: space.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          padding: space.md,
          borderRadius: 20,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.cardRim,
          opacity: pressed ? 0.88 : 1,
        })}
      >
        <Icon name="gift-outline" size={22} color={colors.ink} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">Álbum e prêmios</Text>
          <Text variant="caption" muted>
            Cada semana com {CHAMA_WEEK_GOAL_DAYS} dias de registro vira uma peça e conta para o prêmio que você escolheu.
          </Text>
        </View>
        <Icon name="chevron-forward" size={18} color={colors.inkMuted} />
      </Pressable>

      <Pressable
        onPress={() => router.push(METAS_HREF)}
        accessibilityRole="button"
        accessibilityLabel="Metas juntos"
        style={({ pressed }) => ({
          marginTop: space.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          padding: space.md,
          borderRadius: 20,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.cardRim,
          opacity: pressed ? 0.88 : 1,
        })}
      >
        <Icon name="people-outline" size={22} color={colors.ink} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">Metas juntos</Text>
          <Text variant="caption" muted>
            Semana vale mais que dia. Com amigos, sem ver o número de ninguém.
          </Text>
        </View>
        <Icon name="chevron-forward" size={18} color={colors.inkMuted} />
      </Pressable>

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
            <Text variant="section">Como conta</Text>
            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 12 }}>
              <Text variant="body" muted>
                Um dia fica cumprido quando você faz pelo menos uma coisa de verdade: concluir uma tarefa, marcar uma rotina, terminar um foco, registrar humor, água, refeição ou gasto, ou escrever uma anotação. Só abrir o app não cumpre o dia.
              </Text>
              <Text variant="body" muted>
                Descanso sem castigo: em cada semana, de segunda a domingo, o primeiro dia sem registro vira descanso e não quebra o elo. Se faltar mais um dia na mesma semana, o elo recomeça do zero, e tudo bem.
              </Text>
              <Text variant="body" muted>
                Hoje fica em aberto até a meia-noite e nunca quebra o elo antes disso. O elo conta os dias cumpridos; o descanso segura a sequência, mas não soma.
              </Text>
              <Text variant="body" muted>
                O recorde fica guardado para sempre, e os seus dias vão junto com a conta para qualquer aparelho.
              </Text>
              <Text variant="body" muted>
                No mapa de dias, a cor mais forte mostra quanto do que você planejou foi feito, e os essenciais pesam mais. Sem plano, conta quantos tipos de registro o dia teve. O ponto marca o descanso.
              </Text>
              <Text variant="body" muted>
                Semana fechada: {CHAMA_WEEK_GOAL_DAYS} dias com registro entre segunda e domingo. Cada semana fechada adiciona uma peça à sua coleção e conta para os seus prêmios.
              </Text>
            </ScrollView>
            <PrimaryButton label="Entendi" onPress={() => setHelp(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  )
}
