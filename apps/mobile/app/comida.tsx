import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  FOOD_MEAL_DEFAULT_MINUTES,
  FOOD_MEAL_LABELS,
  FOOD_MEAL_TYPES,
  FOOD_TREND_LABELS,
  OFF_ATTRIBUTION,
  OFF_SOURCE,
  addDaysIso,
  applyFoodKcal,
  foodFrequency,
  foodFrequencyPhrase,
  foodKcalOfDay,
  foodMealTypeFromTime,
  foodMealsPerType,
  foodNutrientAverages,
  formatGrams,
  formatKcal,
  itemWantsAiKcal,
  localTodayIso,
  parseFoodLog,
  type FoodItem,
  type FoodKcalCandidate,
  type FoodMealType,
  type FoodTrend,
} from '@simply-life/shared'
import { Screen, Card, Text, PrimaryButton, Field } from '../src/ui'
import { Icon } from '../src/ui/Icon'
import { StackHeader } from '../src/components/layout/StackHeader'
import { SelectChip } from '../src/components/CaptureTaskForm'
import { SettingsToggleRow } from '../src/components/settings/SettingsToggleRow'
import { FoodSpendCard } from '../src/components/food/FoodSpendCard'
import { BarcodeSheet } from '../src/components/food/BarcodeSheet'
import { FoodSourceLine, KcalChip, KcalEditSheet, type KcalEditValues } from '../src/components/food/KcalChip'
import { estimateKcalWithAi } from '../src/lib/foodKcalApi'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAccents } from '../src/theme/useAccents'
import { useAuthStore } from '../src/store/authStore'
import { useDataStore } from '../src/store/dataStore'
import { useFoodLogStore } from '../src/store/foodLogStore'
import { confirmDestructive } from '../src/lib/confirmDestructive'
import { safeBack } from '../src/lib/safeBack'

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

function hhmm(min: number): string
{
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
}

function dayLabel(iso: string, today: string): string
{
  if (iso === today) return 'hoje'
  if (iso === addDaysIso(today, -1)) return 'ontem'
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
}

function itemName(it: FoodItem): string
{
  return it.quantidade ? `${it.quantidade} ${it.nome}` : it.nome
}

/** chave do pedido à IA: o mesmo item com outra quantidade é outra estimativa */
function aiKey(it: FoodItem): string
{
  return `${it.key}|${it.quantidade ?? ''}`
}

/** "120" → 120 · "" → null (meta opcional) */
function readMeta(input: string): number | null
{
  const n = Number(input.replace(/\D/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Comida: registro por texto, frequência do mês e quanto custou. Sem contar pontos. */
export default function ComidaScreen()
{
  const { colors, space, radius } = useTheme()
  const accents = useAccents()
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const source = useDataStore((s) => s.source)
  const refreshAll = useDataStore((s) => s.refreshAll)
  const hydrate = useFoodLogStore((s) => s.hydrate)
  const meals = useFoodLogStore((s) => s.meals)
  const prefs = useFoodLogStore((s) => s.prefs)
  const setPrefs = useFoodLogStore((s) => s.setPrefs)
  const addMeal = useFoodLogStore((s) => s.addMeal)
  const removeMeal = useFoodLogStore((s) => s.removeMeal)
  const loaded = useFoodLogStore((s) => s.loaded)
  const personal = useFoodLogStore((s) => s.personal)
  const rememberKcal = useFoodLogStore((s) => s.rememberKcal)
  const setItemKcal = useFoodLogStore((s) => s.setItemKcal)
  const fillMissingKcal = useFoodLogStore((s) => s.fillMissingKcal)
  const syncMealProtein = useFoodLogStore((s) => s.syncMealProtein)
  const proteinHabit = useDataStore((s) => s.habits.find((h) => h.tipo === 'proteina'))
  const proteinHabitId = proteinHabit?.id
  const proteinHabitGoal = proteinHabit && proteinHabit.metaDiaria > 0 ? proteinHabit.metaDiaria : null

  const [text, setText] = useState('')
  const [tipoOverride, setTipoOverride] = useState<FoodMealType | null>(null)
  const [removed, setRemoved] = useState<Set<string>>(new Set())
  const [extra, setExtra] = useState<FoodItem[]>([])
  const [scanOpen, setScanOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [metaInput, setMetaInput] = useState(prefs.metaKcal ? String(prefs.metaKcal) : '')
  const [metaProtInput, setMetaProtInput] = useState(prefs.metaProteina ? String(prefs.metaProteina) : '')
  const [metaAcucarInput, setMetaAcucarInput] = useState(prefs.metaAcucar ? String(prefs.metaAcucar) : '')
  const [avgWindow, setAvgWindow] = useState<7 | 30>(7)
  /** estimativas da IA na revisão, por item e quantidade */
  const [aiByKey, setAiByKey] = useState<Record<string, FoodKcalCandidate | null>>({})
  /** o que a pessoa digitou na revisão, por item (kcal, proteína e açúcar juntos) */
  const [manualKcal, setManualKcal] = useState<Record<string, KcalEditValues>>({})
  /** item sendo corrigido: na revisão (draftKey) ou já salvo (mealId + índice) */
  const [editing, setEditing] = useState<{ item: FoodItem; draftKey?: string; mealId?: string; index?: number } | null>(null)
  const aiAsked = useRef<Set<string>>(new Set())

  useEffect(() =>
  {
    void hydrate({ userId: userId ?? null, isGuest })
    if (source === 'idle') void refreshAll({ isGuest })
  }, [hydrate, userId, isGuest, source, refreshAll])

  useEffect(() =>
  {
    setMetaInput(prefs.metaKcal ? String(prefs.metaKcal) : '')
  }, [prefs.metaKcal])

  useEffect(() =>
  {
    setMetaProtInput(prefs.metaProteina ? String(prefs.metaProteina) : '')
  }, [prefs.metaProteina])

  useEffect(() =>
  {
    setMetaAcucarInput(prefs.metaAcucar ? String(prefs.metaAcucar) : '')
  }, [prefs.metaAcucar])

  // proteína das refeições entra no hábito quando ele já carregou (idempotente)
  useEffect(() =>
  {
    if (loaded && proteinHabitId && prefs.mostrarCalorias) void syncMealProtein()
  }, [loaded, proteinHabitId, prefs.mostrarCalorias, syncMealProtein])

  const today = localTodayIso()
  const month = today.slice(0, 7)
  const showKcal = prefs.mostrarCalorias

  const parsed = useMemo(() => (text.trim() ? parseFoodLog(text) : null), [text])
  const previewItems = useMemo(() =>
  {
    const base = (parsed?.itens ?? []).filter((i) => !removed.has(i.key))
    const keys = new Set(base.map((i) => i.key))
    return [...base, ...extra.filter((i) => !keys.has(i.key))]
  }, [parsed, removed, extra])
  const tipo: FoodMealType = tipoOverride ?? parsed?.tipo ?? foodMealTypeFromTime(new Date().getHours() * 60 + new Date().getMinutes())
  const data = parsed?.data ?? today

  /** itens da revisão já com caloria: digitado > pessoal > código de barras > IA > tabela local */
  const reviewItems = useMemo(() =>
  {
    if (!showKcal) return previewItems
    const withManual = previewItems.map((it) =>
    {
      const m = manualKcal[it.key]
      return m ? { ...it, kcal: m.kcal, proteina: m.proteina, acucar: m.acucar, fonte: 'manual', fontes: null } : it
    })
    return applyFoodKcal(withManual, { personal, ai: withManual.map((it) => aiByKey[aiKey(it)] ?? null) })
  }, [showKcal, previewItems, manualKcal, personal, aiByKey])

  // pede à IA o que ainda está só na tabela local, depois de uma pausa na digitação
  useEffect(() =>
  {
    if (!showKcal || isGuest) return
    const want = reviewItems.filter((it) => itemWantsAiKcal(it) && !aiAsked.current.has(aiKey(it)))
    if (!want.length) return
    const timer = setTimeout(() =>
    {
      want.forEach((it) => aiAsked.current.add(aiKey(it)))
      void estimateKcalWithAi(want, tipo, { isGuest }).then((res) =>
      {
        setAiByKey((cur) =>
        {
          const next = { ...cur }
          want.forEach((it, i) =>
          {
            next[aiKey(it)] = res[i]
          })
          return next
        })
      })
    }, 900)
    return () => clearTimeout(timer)
  }, [showKcal, isGuest, reviewItems, tipo])

  // itens já salvos sem caloria: estimativa em segundo plano, só com a opção ligada
  useEffect(() =>
  {
    if (showKcal && loaded) void fillMissingKcal({ isGuest })
  }, [showKcal, loaded, isGuest, meals.length, fillMissingKcal])

  useEffect(() =>
  {
    setRemoved(new Set())
  }, [text])

  const resetDraft = () =>
  {
    setText('')
    setTipoOverride(null)
    setRemoved(new Set())
    setExtra([])
    setManualKcal({})
  }

  const save = async () =>
  {
    if (!previewItems.length || saving) return
    setSaving(true)
    const horaMin = parsed && (parsed.horaDita || !tipoOverride || tipoOverride === parsed.tipo)
      ? parsed.horaMinutos
      : FOOD_MEAL_DEFAULT_MINUTES[tipo]
    const itens: FoodItem[] = reviewItems
    await addMeal({ data, hora: hhmm(horaMin), tipo, texto: text.trim() || previewItems.map((i) => i.nome).join(', '), itens })
    for (const it of itens)
    {
      if (it.fonte === 'manual' && typeof it.kcal === 'number')
      {
        void rememberKcal(it.key, it.kcal, it.quantidade ?? it.porcao ?? null, { proteina: it.proteina ?? null, acucar: it.acucar ?? null })
      }
    }
    setSaving(false)
    setSavedMsg(`${FOOD_MEAL_LABELS[tipo]} registrado`)
    resetDraft()
    setTimeout(() => setSavedMsg(null), 2500)
  }

  const todayMeals = meals.filter((m) => m.data === today)
  const freq = useMemo(() => foodFrequency(meals, month), [meals, month])
  const perType = useMemo(() => foodMealsPerType(meals, month), [meals, month])
  const kcalToday = useMemo(() => foodKcalOfDay(meals, today), [meals, today])
  const usesOff = (
    todayMeals.some((m) => m.itens.some((i) => i.fonte === OFF_SOURCE))
    || previewItems.some((i) => i.fonte === OFF_SOURCE)
  )
  const approx = kcalToday.estimadas > 0 ? '≈ ' : ''
  const kcalTotalLabel = `${approx}${formatKcal(kcalToday.total)}`
  const metaProteina = prefs.metaProteina ?? proteinHabitGoal
  const todayTotals = [
    kcalToday.comKcal > 0
      ? prefs.metaKcal ? `${kcalTotalLabel} de ${formatKcal(prefs.metaKcal)}` : kcalTotalLabel
      : null,
    kcalToday.comProteina > 0
      ? `${approx}${formatGrams(kcalToday.proteina)} de proteína${metaProteina ? ` de ${formatGrams(metaProteina)}` : ''}`
      : null,
    kcalToday.comAcucar > 0
      ? `${approx}${formatGrams(kcalToday.acucar)} de açúcar${prefs.metaAcucar ? `, limite ${formatGrams(prefs.metaAcucar)}` : ''}`
      : null,
  ].filter((x): x is string => Boolean(x))
  const averages = useMemo(() => foodNutrientAverages(meals, today, avgWindow), [meals, today, avgWindow])
  const avgRows = [
    { key: 'kcal', label: 'Calorias', color: accents.data, avg: averages.kcal, fmt: (v: number) => formatKcal(v) },
    { key: 'prot', label: 'Proteína', color: accents.data2, avg: averages.proteina, fmt: formatGrams },
    { key: 'acucar', label: 'Açúcar', color: accents.data3, avg: averages.acucar, fmt: formatGrams },
  ]

  const trendChip = (t: FoodTrend) => (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.brandMuted }}>
      <Text variant="micro" color={colors.brand}>{FOOD_TREND_LABELS[t]}</Text>
    </View>
  )

  const saveMeta = () =>
  {
    void setPrefs({ metaKcal: readMeta(metaInput) })
  }
  const saveMetaProt = () =>
  {
    void setPrefs({ metaProteina: readMeta(metaProtInput) })
  }
  const saveMetaAcucar = () =>
  {
    void setPrefs({ metaAcucar: readMeta(metaAcucarInput) })
  }

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Comida" subtitle="O que você comeu e quanto custou, do seu jeito" />
      <View style={{ gap: space.md }}>
        {/* registro rápido */}
        <Card tone="elevated" style={{ gap: space.sm }}>
          <Text variant="section">O que você comeu?</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.sm,
              borderRadius: radius.control,
              borderWidth: 1,
              borderColor: colors.hairline,
              backgroundColor: colors.surface,
              paddingLeft: 14,
              paddingRight: 6,
            }}
          >
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="almocei arroz, feijão e frango"
              placeholderTextColor={colors.inkFaint}
              returnKeyType="done"
              onSubmitEditing={() => void save()}
              accessibilityLabel="O que você comeu"
              style={{ flex: 1, minHeight: 48, color: colors.ink, fontFamily: 'Lexend_400Regular', fontSize: 15 }}
            />
            <Pressable
              onPress={() => setScanOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Ler código de barras"
              hitSlop={6}
              style={{ padding: 12, borderRadius: radius.control }}
            >
              <Icon name="barcode-outline" size={22} color={colors.brand} />
            </Pressable>
          </View>

          {parsed || extra.length ? (
            <View style={{ gap: space.sm }}>
              <Text variant="caption" muted>
                {`Entendi assim · ${dayLabel(data, today)}${parsed?.horaDita ? ` às ${hhmm(parsed.horaMinutos)}` : ''}${parsed?.tipoInferido && !tipoOverride ? ' · refeição pelo horário' : ''}`}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {FOOD_MEAL_TYPES.map((t) => (
                  <SelectChip key={t} label={FOOD_MEAL_LABELS[t]} active={tipo === t} onPress={() => setTipoOverride(t)} />
                ))}
              </View>
              {reviewItems.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {reviewItems.map((it) => (
                    <View
                      key={it.key}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        paddingLeft: 12,
                        paddingRight: 6,
                        paddingVertical: 6,
                        borderRadius: 12,
                        backgroundColor: colors.brandMuted,
                      }}
                    >
                      <Text variant="caption" color={colors.ink}>{itemName(it)}</Text>
                      {showKcal ? <KcalChip item={it} onPress={() => setEditing({ item: it, draftKey: it.key })} /> : null}
                      <Pressable
                        onPress={() =>
                        {
                          if (extra.some((e) => e.key === it.key)) setExtra(extra.filter((e) => e.key !== it.key))
                          else setRemoved(new Set([...removed, it.key]))
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Tirar ${it.nome}`}
                        hitSlop={8}
                      >
                        <Icon name="close" size={14} color={colors.inkMuted} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <Text variant="caption" muted>Escreva o que teve na refeição, separado por vírgula.</Text>
              )}
              {showKcal && reviewItems.some((i) => typeof i.kcal === 'number') ? (
                <Text variant="micro" muted>Toque no número para ajustar. Valores com ≈ são estimativas.</Text>
              ) : null}
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton label="Salvar refeição" loading={saving} disabled={!previewItems.length} onPress={() => void save()} />
                </View>
                <PrimaryButton label="Limpar" variant="ghost" onPress={resetDraft} />
              </View>
            </View>
          ) : (
            <Text variant="caption" muted>
              Exemplos: "café da manhã: pão com ovo e café", "lanche pão de queijo", "jantei sopa às 20h".
            </Text>
          )}
          {savedMsg ? <Text variant="caption" color={colors.health}>{savedMsg}</Text> : null}
        </Card>

        {/* hoje */}
        <Card tone="elevated" style={{ gap: space.sm }}>
          <Text variant="section">Hoje</Text>
          {showKcal && todayTotals.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {todayTotals.map((t) => (
                <View key={t} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.hairline }}>
                  <Text variant="micro">{t}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {todayMeals.length === 0 ? (
            <Text variant="body" muted>Nada registrado ainda hoje. Quando quiser, é só escrever acima.</Text>
          ) : (
            todayMeals.map((m) => (
              <View key={m.id} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text variant="bodyStrong">{`${FOOD_MEAL_LABELS[m.tipo]}${m.hora ? ` · ${m.hora}` : ''}`}</Text>
                  {showKcal ? (
                    <View style={{ gap: 6, marginTop: 2 }}>
                      {m.itens.map((it, index) => (
                        <View key={`${it.key}-${index}`} style={{ gap: 2 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                            <Text variant="caption" muted style={{ flex: 1 }}>{itemName(it)}</Text>
                            <KcalChip item={it} onPress={() => setEditing({ item: it, mealId: m.id, index })} />
                          </View>
                          <FoodSourceLine item={it} />
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text variant="caption" muted>{m.itens.map(itemName).join(', ')}</Text>
                  )}
                </View>
                <Pressable
                  onPress={() => confirmDestructive('Apagar refeição?', `${FOOD_MEAL_LABELS[m.tipo]} de hoje sai do registro.`, () => void removeMeal(m.id), 'Apagar')}
                  accessibilityRole="button"
                  accessibilityLabel={`Apagar ${FOOD_MEAL_LABELS[m.tipo]}`}
                  hitSlop={8}
                  style={{ padding: 13 }}
                >
                  <Icon name="trash-outline" size={18} color={colors.inkMuted} />
                </Pressable>
              </View>
            ))
          )}
          {showKcal && kcalToday.comKcal > 0 ? (
            <Text variant="micro" muted>
              {`${kcalToday.estimadas > 0 ? 'Valores com ≈ são estimativas, só para ter uma ideia. ' : ''}Toque em um número para ajustar; o app lembra na próxima vez.${kcalToday.semKcal > 0 ? ' Itens sem número não entram na soma.' : ''}`}
            </Text>
          ) : null}
        </Card>

        {/* médias, só com os números ligados */}
        {showKcal ? (
          <Card tone="elevated" style={{ gap: space.sm }}>
            <Text variant="section">Médias</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <SelectChip label="7 dias" active={avgWindow === 7} onPress={() => setAvgWindow(7)} />
              <SelectChip label="30 dias" active={avgWindow === 30} onPress={() => setAvgWindow(30)} />
            </View>
            {averages.diasComRefeicao === 0 || averages.kcal.dias === 0 ? (
              <Text variant="body" muted>
                {`Quando houver refeições com números nos últimos ${avgWindow} dias, a média por dia aparece aqui.`}
              </Text>
            ) : (
              <>
                {avgRows.map((r) => (
                  <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 32 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: r.color }} />
                    <Text variant="body" style={{ flex: 1 }}>{`${r.label} por dia`}</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text variant="bodyStrong">
                        {r.avg.media != null ? `${averages.temEstimativa ? '≈ ' : ''}${r.fmt(r.avg.media)}` : 'sem dado'}
                      </Text>
                      {r.avg.media != null && r.avg.dias < averages.diasComRefeicao ? (
                        <Text variant="micro" muted>{`em ${r.avg.dias} ${r.avg.dias === 1 ? 'dia' : 'dias'} com o dado`}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
                <Text variant="micro" muted>
                  {`Média de ${averages.diasComRefeicao} ${averages.diasComRefeicao === 1 ? 'dia' : 'dias'} com refeição registrada nos últimos ${avgWindow}. Dias sem registro não entram na conta.`}
                </Text>
              </>
            )}
          </Card>
        ) : null}

        {/* frequência do mês */}
        <Card tone="elevated" style={{ gap: space.sm }}>
          <Text variant="section">{`Em ${MONTHS[Number(month.slice(5, 7)) - 1]}`}</Text>
          {freq.length === 0 ? (
            <Text variant="body" muted>Conforme você registra, aparece aqui o que mais se repete no mês.</Text>
          ) : (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {FOOD_MEAL_TYPES.filter((t) => perType[t] > 0).map((t) => (
                  <View key={t} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.hairline }}>
                    <Text variant="micro">{`${FOOD_MEAL_LABELS[t]} · ${perType[t]}`}</Text>
                  </View>
                ))}
              </View>
              {(showAll ? freq : freq.slice(0, 8)).map((r) => (
                <View key={r.key} style={{ gap: 6, paddingVertical: 2 }}>
                  <Text variant="body">{foodFrequencyPhrase(r)}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    {trendChip(r.tendencia)}
                    {r.refeicaoMaisComum ? (
                      <Text variant="micro" muted>{`mais no ${FOOD_MEAL_LABELS[r.refeicaoMaisComum].toLowerCase()}`}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
              {freq.length > 8 ? (
                <PrimaryButton
                  label={showAll ? 'Mostrar menos' : `Ver todos (${freq.length})`}
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowAll(!showAll)}
                />
              ) : null}
            </>
          )}
        </Card>

        {/* dinheiro */}
        <Card tone="elevated" style={{ gap: space.sm }}>
          <Text variant="section">Quanto custou</Text>
          <Text variant="caption" muted>Gastos do extrato deste mês agrupados pelo item.</Text>
          <FoodSpendCard embedded limit={8} />
        </Card>

        {/* calorias */}
        <SettingsToggleRow
          icon="flame-outline"
          title="Mostrar calorias e nutrientes"
          subtitle="Desligado por padrão. Calorias, proteína e açúcar por item; estimativas aparecem com ≈ e você pode ajustar."
          value={prefs.mostrarCalorias}
          onValueChange={(v) => void setPrefs({ mostrarCalorias: v })}
        />
        {prefs.mostrarCalorias ? (
          <Card tone="inset" style={{ gap: space.sm }}>
            <Field
              label="Calorias por dia (opcional)"
              value={metaInput}
              onChangeText={setMetaInput}
              onBlur={saveMeta}
              onSubmitEditing={saveMeta}
              keyboardType="number-pad"
              placeholder="Sem meta"
            />
            <Field
              label="Proteína por dia, em gramas (opcional)"
              value={metaProtInput}
              onChangeText={setMetaProtInput}
              onBlur={saveMetaProt}
              onSubmitEditing={saveMetaProt}
              keyboardType="number-pad"
              placeholder={proteinHabitGoal ? `Igual ao hábito: ${proteinHabitGoal} g` : 'Sem meta'}
            />
            <Field
              label="Limite de açúcar por dia, em gramas (opcional)"
              value={metaAcucarInput}
              onChangeText={setMetaAcucarInput}
              onBlur={saveMetaAcucar}
              onSubmitEditing={saveMetaAcucar}
              keyboardType="number-pad"
              placeholder="Sem limite"
            />
            <Text variant="micro" muted>
              Deixe vazio para não ter meta. Os números são só uma referência, sem certo ou errado. A proteína das refeições também soma no hábito de proteína do dia.
            </Text>
          </Card>
        ) : null}

        {usesOff ? <Text variant="micro" muted>{OFF_ATTRIBUTION}</Text> : null}

        <PrimaryButton label="Voltar" variant="ghost" onPress={() => safeBack(router, '/(tabs)/saude')} />
      </View>

      <BarcodeSheet
        visible={scanOpen}
        showCalories={showKcal}
        onClose={() => setScanOpen(false)}
        onAdd={(item) =>
        {
          setExtra((cur) => [...cur.filter((c) => c.key !== item.key), item])
          if (typeof item.kcal === 'number')
          {
            void rememberKcal(item.key, item.kcal, item.quantidade ?? null, { proteina: item.proteina ?? null, acucar: item.acucar ?? null })
          }
        }}
      />

      <KcalEditSheet
        item={editing?.item ?? null}
        onClose={() => setEditing(null)}
        onSave={(values) =>
        {
          if (!editing) return
          if (editing.mealId != null && editing.index != null)
          {
            void setItemKcal(editing.mealId, editing.index, values.kcal, { proteina: values.proteina, acucar: values.acucar })
          }
          else if (editing.draftKey)
          {
            const key = editing.draftKey
            setManualKcal((cur) => ({ ...cur, [key]: values }))
          }
        }}
      />
    </Screen>
  )
}
