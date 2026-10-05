import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import {
  CHAMA_PRIZE_RULES,
  CHAMA_WEEK_GOAL_DAYS,
  COLLECTION_THEMES,
  STARTER_ACHIEVEMENTS,
  collectionUnlockId,
  isUnlocked,
  unlockById,
  collectionProgress,
  currentChamaWeek,
  localTodayIso,
  prizeProgress,
  prizeRuleLine,
  type ChamaPrize,
  type ChamaPrizeRule,
  type CollectionThemeId,
} from '@simply-life/shared'
import { Screen, Text, Card, Chip, Field, PrimaryButton, PillTabs, Icon, type IconName } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { usePrefsStore } from '../src/store/prefsStore'
import { useDataStore } from '../src/store/dataStore'
import { actionIsos, useActivityStore, type LifeActionKind } from '../src/store/activityStore'
import { confirmDestructive } from '../src/lib/confirmDestructive'
import { guardSpend } from '../src/lib/spendGuard'
import { hapticRestDone } from '../src/lib/haptics'
import { gamificationLevel, useGamificationStore } from '../src/store/gamificationStore'
import { useRouter } from 'expo-router'

type Tab = 'colecao' | 'premios' | 'conquistas'

const KIND_FOR_RULE: Record<Exclude<ChamaPrizeRule, 'chama'>, LifeActionKind> = {
  agua: 'water',
  tarefas: 'task',
  foco: 'focus',
  humor: 'mood',
}

function newId(): string
{
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function money(v: number): string
{
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Barra simples: enche conforme as semanas fecham. */
function Bar({ pct }: { pct: number })
{
  const { colors } = useTheme()
  return (
    <View style={{ height: 8, borderRadius: 999, backgroundColor: colors.hairline, overflow: 'hidden' }}>
      <View
        style={{
          width: `${Math.round(Math.max(0, Math.min(1, pct)) * 100)}%`,
          height: '100%',
          borderRadius: 999,
          backgroundColor: colors.axelFill,
        }}
      />
    </View>
  )
}

/** Álbum e prêmios da Chama: regras fixas, sem sorteio e sem nada a perder. */
export default function ColecaoScreen()
{
  const { colors, space, radius } = useTheme()
  const isGuest = useAuthStore((s) => s.isGuest)
  const prefs = usePrefsStore((s) => s.prefs)
  const patchPrefs = usePrefsStore((s) => s.patch)
  const addFinanceGoal = useDataStore((s) => s.addFinanceGoal)
  const addExpenseFromText = useDataStore((s) => s.addExpenseFromText)
  const days = useActivityStore((s) => s.days)
  const hydrateActivity = useActivityStore((s) => s.hydrate)
  const [tab, setTab] = useState<Tab>('colecao')
  const unlocked = useGamificationStore((s) => s.unlocked)
  const owned = useGamificationStore((s) => s.owned)
  const totalXp = useGamificationStore((s) => s.totalXp)
  const router = useRouter()
  const level = gamificationLevel(totalXp).level
  /** tema liberado pelo nível, comprado, ou já em uso antes dos desbloqueios */
  const themeOpen = (id: CollectionThemeId) =>
  {
    const u = unlockById(collectionUnlockId(id))
    return !u || isUnlocked(u, level, owned) || prefs.chama_colecao?.tema === id
  }
  const [msg, setMsg] = useState<string | null>(null)

  // formulário de prêmio
  const [titulo, setTitulo] = useState('')
  const [regra, setRegra] = useState<ChamaPrizeRule>('chama')
  const [semanas, setSemanas] = useState(3)
  const [valor, setValor] = useState('')

  useEffect(() =>
  {
    hydrateActivity()
  }, [hydrateActivity])

  const active = useMemo(() => actionIsos(days), [days])
  const byKind = useMemo(() =>
  {
    const out: Partial<Record<Exclude<ChamaPrizeRule, 'chama'>, string[]>> = {}
    for (const [rule, kind] of Object.entries(KIND_FOR_RULE) as [Exclude<ChamaPrizeRule, 'chama'>, LifeActionKind][])
    {
      out[rule] = Object.entries(days)
        .filter(([, d]) => d.actions.includes(kind))
        .map(([iso]) => iso)
    }
    return out
  }, [days])

  const week = currentChamaWeek(active)
  const colecao = prefs.chama_colecao ?? null
  const progress = colecao ? collectionProgress(colecao, active) : null
  const premios = prefs.chama_premios ?? []

  const pickTheme = (id: CollectionThemeId) =>
  {
    const go = () => void patchPrefs({ chama_colecao: { tema: id, desde: localTodayIso() } })
    if (colecao && progress && progress.earned > 0 && !progress.complete)
    {
      confirmDestructive(
        'Trocar de coleção',
        'A nova coleção começa do zero nesta semana. As peças da coleção atual não ficam salvas.',
        go,
        'Trocar',
      )
      return
    }
    go()
  }

  const savePrize = () =>
  {
    const t = titulo.trim()
    if (!t) return
    const v = Number(valor.replace(/\./g, '').replace(',', '.'))
    const prize: ChamaPrize = {
      id: newId(),
      titulo: t,
      regra,
      semanas,
      valor: Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null,
      desde: localTodayIso(),
      resgatadoEm: null,
    }
    void patchPrefs({ chama_premios: [...premios, prize] })
    setTitulo('')
    setValor('')
    setMsg(null)
  }

  const updatePrize = (id: string, patch: Partial<ChamaPrize>) =>
    void patchPrefs({ chama_premios: premios.map((p) => (p.id === id ? { ...p, ...patch } : p)) })

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Álbum e prêmios" subtitle="Cada semana fechada vira uma peça e conta para os seus prêmios" />

      <View style={{ gap: space.md }}>
        <Card style={{ gap: space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="flame" size={22} color={colors.axel} />
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              {week.closed
                ? 'Semana fechada'
                : `Esta semana: ${week.days} de ${week.goal} dias`}
            </Text>
          </View>
          <Bar pct={week.days / week.goal} />
          <Text variant="caption" muted>
            A semana vai de segunda a domingo e fecha com {CHAMA_WEEK_GOAL_DAYS} dias de registro. Semana que não fecha só não soma, nada é tirado.
          </Text>
        </Card>

        <PillTabs
          tabs={[
            { id: 'colecao', label: 'Coleção' },
            { id: 'premios', label: 'Prêmios' },
            { id: 'conquistas', label: 'Conquistas' },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 'conquistas' ? (
          <Card style={{ gap: space.md }}>
            <View style={{ gap: 2 }}>
              <Text variant="section">Todas as conquistas</Text>
              <Text variant="caption" muted>
                A lista é fixa e fica sempre aqui. Nada aparece de surpresa: você sabe antes o que precisa fazer.
              </Text>
            </View>
            {STARTER_ACHIEVEMENTS.map((a, i) =>
            {
              const got = unlocked.includes(a.id)
              return (
                <View
                  key={a.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 8,
                    borderBottomWidth: i === STARTER_ACHIEVEMENTS.length - 1 ? 0 : 1,
                    borderBottomColor: colors.hairline,
                  }}
                >
                  <Icon name={got ? 'medal' : 'medal-outline'} size={22} color={got ? colors.axel : colors.inkFaint} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong">{a.title}</Text>
                    <Text variant="caption" muted>
                      {got ? 'Conquistada' : `Como ganhar: ${a.description.replace(/\.$/, '').toLowerCase()}`}
                    </Text>
                  </View>
                  <Text variant="caption" muted>
                    +{a.xpReward} XP
                  </Text>
                </View>
              )
            })}
          </Card>
        ) : null}

        {tab === 'colecao' ? (
          <>
            <Card style={{ gap: space.sm }}>
              <Text variant="section">Como funciona</Text>
              <Text variant="body" muted>
                É um álbum de figurinhas da sua constância. Você escolhe um tema, e cada semana fechada cola a próxima figurinha no álbum.
              </Text>
              <Text variant="body" muted>
                Cada tema tem 12 figurinhas, sempre na mesma ordem. A próxima aparece com borda tracejada, então você sabe o que vem antes de ganhar.
              </Text>
              <Text variant="body" muted>
                Exemplo: no tema Jardim, a 1ª semana fechada dá a Semente, a 2ª o Broto, e assim até o Jardim completo.
              </Text>
            </Card>
            {progress ? (
              <Card style={{ gap: space.md }}>
                <View style={{ gap: 2 }}>
                  <Text variant="section">{progress.theme.label}</Text>
                  <Text variant="caption" muted>
                    {progress.complete
                      ? 'Coleção completa. Escolha outra quando quiser.'
                      : `${progress.earned} de ${progress.total} peças · próxima: ${progress.next?.name}`}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {progress.theme.pieces.map((piece, i) =>
                  {
                    const got = i < progress.earned
                    const isNext = i === progress.earned
                    return (
                      <View
                        key={piece.name}
                        accessibilityLabel={`${piece.name}, ${got ? 'conquistada' : isNext ? 'próxima' : 'ainda não'}`}
                        style={{
                          width: 72,
                          alignItems: 'center',
                          gap: 6,
                          paddingVertical: 10,
                          borderRadius: radius.control,
                          backgroundColor: got ? colors.axelMuted : colors.surface,
                          borderWidth: 1,
                          borderColor: isNext ? colors.axel : colors.hairline,
                          borderStyle: isNext ? 'dashed' : 'solid',
                        }}
                      >
                        <Icon
                          name={piece.icon as IconName}
                          size={24}
                          color={got ? colors.axel : colors.inkFaint}
                        />
                        <Text
                          variant="micro"
                          muted={!got}
                          numberOfLines={2}
                          style={{ textAlign: 'center', paddingHorizontal: 4 }}
                        >
                          {got || isNext ? piece.name : `Semana ${i + 1}`}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              </Card>
            ) : null}

            <Text variant="caption" muted>
              {progress ? 'Trocar de tema' : 'Escolha um tema. As peças vêm sempre na mesma ordem, você vê qual é a próxima.'}
            </Text>
            {COLLECTION_THEMES.map((t) => (
              <Card
                key={t.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  borderColor: colecao?.tema === t.id ? colors.axel : undefined,
                }}
              >
                <Icon name={t.pieces[1]!.icon as IconName} size={22} color={colors.brand} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{t.label}</Text>
                  <Text variant="caption" muted>
                    {t.hint} {t.pieces.length} peças.
                  </Text>
                </View>
                {colecao?.tema === t.id ? (
                  <Text variant="caption" style={{ color: colors.axel, fontWeight: '600' }}>
                    Atual
                  </Text>
                ) : themeOpen(t.id) ? (
                  <PrimaryButton label="Escolher" variant="link" size="sm" onPress={() => pickTheme(t.id)} />
                ) : (
                  <PrimaryButton
                    label={`Nível ${unlockById(collectionUnlockId(t.id))?.level ?? 1}`}
                    variant="link"
                    size="sm"
                    icon="lock-closed-outline"
                    onPress={() => router.push('/desbloqueios' as never)}
                  />
                )}
              </Card>
            ))}
          </>
        ) : null}

        {tab === 'premios' ? (
          <>
            {premios.length === 0 ? (
              <Text variant="caption" muted>
                Escolha algo que você quer de verdade. Exemplo: 3 semanas bebendo água, compro o livro.
              </Text>
            ) : null}

            {premios.map((p) =>
            {
              const pr = prizeProgress(p, active, byKind)
              const done = Boolean(p.resgatadoEm)
              return (
                <Card key={p.id} style={{ gap: space.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <Icon name={done ? 'checkmark-circle' : pr.unlocked ? 'gift' : 'gift-outline'} size={22} color={pr.unlocked ? colors.axel : colors.brand} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong">{p.titulo}</Text>
                      <Text variant="caption" muted>
                        {prizeRuleLine(p)}
                        {p.valor ? ` · ${money(p.valor)}` : ''}
                      </Text>
                    </View>
                  </View>
                  {!done ? (
                    <>
                      <Bar pct={pr.pct} />
                      <Text variant="caption" muted>
                        {pr.unlocked
                          ? 'Liberado. Aproveite, você chegou lá.'
                          : `${pr.done} de ${p.semanas} semana${p.semanas === 1 ? '' : 's'}`}
                      </Text>
                    </>
                  ) : (
                    <Text variant="caption" muted>
                      Resgatado em {new Date(p.resgatadoEm!).toLocaleDateString('pt-BR')}
                    </Text>
                  )}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
                    {pr.unlocked && !done ? (
                      <PrimaryButton
                        label="Resgatar"
                        size="sm"
                        icon="gift-outline"
                        onPress={() =>
                        {
                          hapticRestDone()
                          updatePrize(p.id, { resgatadoEm: new Date().toISOString() })
                        }}
                      />
                    ) : null}
                    {done && p.valor ? (
                      <PrimaryButton
                        label="Lançar o gasto"
                        variant="secondary"
                        size="sm"
                        onPress={async () =>
                        {
                          if (!(await guardSpend({ launches: [{ valor: p.valor!, data: localTodayIso() }] }))) return
                          const r = await addExpenseFromText('', isGuest, {
                            tipo: 'despesa',
                            lido: { titulo: `Prêmio: ${p.titulo}`, valor: p.valor! },
                          })
                          setMsg(r.ok ? 'Gasto lançado no Financeiro.' : r.error ?? 'Não deu para lançar agora')
                        }}
                      />
                    ) : null}
                    {!done && p.valor && !p.metaFinanceiraId ? (
                      <PrimaryButton
                        label="Juntar no Financeiro"
                        variant="link"
                        size="sm"
                        onPress={() =>
                        {
                          addFinanceGoal(`Prêmio: ${p.titulo}`, p.valor!)
                          updatePrize(p.id, { metaFinanceiraId: -1 })
                          setMsg('Criamos uma meta no Financeiro para juntar o valor.')
                        }}
                      />
                    ) : null}
                    <PrimaryButton
                      label="Apagar"
                      variant="link"
                      size="sm"
                      onPress={() =>
                        confirmDestructive('Apagar prêmio', 'O prêmio sai da lista. Suas semanas continuam contando.', () =>
                          void patchPrefs({ chama_premios: premios.filter((x) => x.id !== p.id) }))}
                    />
                  </View>
                </Card>
              )
            })}

            {msg ? (
              <Text variant="caption" style={{ color: colors.brand }}>
                {msg}
              </Text>
            ) : null}

            <Card style={{ gap: space.md }}>
              <Text variant="section">Novo prêmio</Text>
              <Field label="O prêmio" value={titulo} onChangeText={setTitulo} placeholder="Comprar o livro, cinema, um passeio" />
              <View style={{ gap: 12 }}>
                <Text variant="caption" muted>
                  O que conta
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {CHAMA_PRIZE_RULES.map((r) => (
                    <Chip key={r.id} label={r.label} active={regra === r.id} onPress={() => setRegra(r.id)} />
                  ))}
                </View>
              </View>
              <View style={{ gap: 12 }}>
                <Text variant="caption" muted>
                  Quantas semanas fechadas
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {[1, 2, 3, 4, 6, 8].map((n) => (
                    <Chip key={n} label={String(n)} active={semanas === n} onPress={() => setSemanas(n)} />
                  ))}
                </View>
              </View>
              <Field
                label="Quanto custa (opcional)"
                value={valor}
                onChangeText={setValor}
                keyboardType="decimal-pad"
                placeholder="80,00"
              />
              <Text variant="caption" muted>
                {prizeRuleLine({ regra, semanas })}. Conta a partir desta semana.
              </Text>
              <PrimaryButton label="Salvar prêmio" disabled={!titulo.trim()} onPress={savePrize} />
            </Card>
          </>
        ) : null}
      </View>
    </Screen>
  )
}
