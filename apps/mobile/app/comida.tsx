import { useEffect, useMemo, useState } from 'react'
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
  foodFrequency,
  foodFrequencyPhrase,
  foodKcalOfDay,
  foodMealTypeFromTime,
  foodMealsPerType,
  formatKcal,
  localTodayIso,
  parseFoodLog,
  type FoodItem,
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
import { useTheme } from '../src/theme/ThemeProvider'
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

function itemLine(it: FoodItem, showKcal: boolean): string
{
  const parts = [it.quantidade ? `${it.quantidade} ${it.nome}` : it.nome]
  if (showKcal && typeof it.kcal === 'number') parts.push(formatKcal(it.kcal))
  return parts.join(' · ')
}

/** Comida: registro por texto, frequência do mês e quanto custou. Sem contar pontos. */
export default function ComidaScreen()
{
  const { colors, space, radius } = useTheme()
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

  const [text, setText] = useState('')
  const [tipoOverride, setTipoOverride] = useState<FoodMealType | null>(null)
  const [removed, setRemoved] = useState<Set<string>>(new Set())
  const [extra, setExtra] = useState<FoodItem[]>([])
  const [scanOpen, setScanOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [metaInput, setMetaInput] = useState(prefs.metaKcal ? String(prefs.metaKcal) : '')

  useEffect(() =>
  {
    void hydrate({ userId: userId ?? null, isGuest })
    if (source === 'idle') void refreshAll({ isGuest })
  }, [hydrate, userId, isGuest, source, refreshAll])

  useEffect(() =>
  {
    setMetaInput(prefs.metaKcal ? String(prefs.metaKcal) : '')
  }, [prefs.metaKcal])

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
  }

  const save = async () =>
  {
    if (!previewItems.length || saving) return
    setSaving(true)
    const horaMin = parsed && (parsed.horaDita || !tipoOverride || tipoOverride === parsed.tipo)
      ? parsed.horaMinutos
      : FOOD_MEAL_DEFAULT_MINUTES[tipo]
    await addMeal({ data, hora: hhmm(horaMin), tipo, texto: text.trim() || previewItems.map((i) => i.nome).join(', '), itens: previewItems })
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

  const trendChip = (t: FoodTrend) => (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.brandMuted }}>
      <Text variant="micro" color={colors.brand}>{FOOD_TREND_LABELS[t]}</Text>
    </View>
  )

  const saveMeta = () =>
  {
    const n = Number(metaInput.replace(/\D/g, ''))
    void setPrefs({ metaKcal: Number.isFinite(n) && n > 0 ? n : null })
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
              style={{ padding: 10, borderRadius: radius.control }}
            >
              <Icon name="barcode-outline" size={22} color={colors.brand} />
            </Pressable>
          </View>

          {parsed || extra.length ? (
            <View style={{ gap: space.sm }}>
              <Text variant="caption" muted>
                {`Entendi assim · ${dayLabel(data, today)}${parsed?.horaDita ? ` às ${hhmm(parsed.horaMinutos)}` : ''}${parsed?.tipoInferido && !tipoOverride ? ' · refeição pelo horário' : ''}`}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {FOOD_MEAL_TYPES.map((t) => (
                  <SelectChip key={t} label={FOOD_MEAL_LABELS[t]} active={tipo === t} onPress={() => setTipoOverride(t)} />
                ))}
              </View>
              {previewItems.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {previewItems.map((it) => (
                    <View
                      key={it.key}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingLeft: 12,
                        paddingRight: 6,
                        paddingVertical: 6,
                        borderRadius: 12,
                        backgroundColor: colors.brandMuted,
                      }}
                    >
                      <Text variant="caption" color={colors.ink}>{itemLine(it, showKcal)}</Text>
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
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
            <Text variant="section" style={{ flex: 1 }}>Hoje</Text>
            {showKcal && kcalToday.comKcal > 0 ? (
              <Text variant="caption" muted>
                {prefs.metaKcal ? `${formatKcal(kcalToday.total)} de ${formatKcal(prefs.metaKcal)}` : `${formatKcal(kcalToday.total)} conhecidas`}
              </Text>
            ) : null}
          </View>
          {todayMeals.length === 0 ? (
            <Text variant="body" muted>Nada registrado ainda hoje. Quando quiser, é só escrever acima.</Text>
          ) : (
            todayMeals.map((m) => (
              <View key={m.id} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{`${FOOD_MEAL_LABELS[m.tipo]}${m.hora ? ` · ${m.hora}` : ''}`}</Text>
                  <Text variant="caption" muted>{m.itens.map((i) => itemLine(i, showKcal)).join(', ')}</Text>
                </View>
                <Pressable
                  onPress={() => confirmDestructive('Apagar refeição?', `${FOOD_MEAL_LABELS[m.tipo]} de hoje sai do registro.`, () => void removeMeal(m.id), 'Apagar')}
                  accessibilityRole="button"
                  accessibilityLabel={`Apagar ${FOOD_MEAL_LABELS[m.tipo]}`}
                  hitSlop={8}
                  style={{ padding: 4 }}
                >
                  <Icon name="trash-outline" size={18} color={colors.inkMuted} />
                </Pressable>
              </View>
            ))
          )}
          {showKcal && kcalToday.semKcal > 0 && kcalToday.comKcal > 0 ? (
            <Text variant="micro" muted>Só entram itens com caloria conhecida (lidos pelo código de barras).</Text>
          ) : null}
        </Card>

        {/* frequência do mês */}
        <Card tone="elevated" style={{ gap: space.sm }}>
          <Text variant="section">{`Em ${MONTHS[Number(month.slice(5, 7)) - 1]}`}</Text>
          {freq.length === 0 ? (
            <Text variant="body" muted>Conforme você registra, aparece aqui o que mais se repete no mês.</Text>
          ) : (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {FOOD_MEAL_TYPES.filter((t) => perType[t] > 0).map((t) => (
                  <View key={t} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.hairline }}>
                    <Text variant="micro">{`${FOOD_MEAL_LABELS[t]} · ${perType[t]}`}</Text>
                  </View>
                ))}
              </View>
              {(showAll ? freq : freq.slice(0, 8)).map((r) => (
                <View key={r.key} style={{ gap: 4, paddingVertical: 2 }}>
                  <Text variant="body">{foodFrequencyPhrase(r)}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
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
          title="Mostrar calorias"
          subtitle="Desligado por padrão. Aparecem só onde o dado existe."
          value={prefs.mostrarCalorias}
          onValueChange={(v) => void setPrefs({ mostrarCalorias: v })}
        />
        {prefs.mostrarCalorias ? (
          <Card tone="inset" style={{ gap: space.sm }}>
            <Field
              label="Meta diária (opcional)"
              value={metaInput}
              onChangeText={setMetaInput}
              onBlur={saveMeta}
              onSubmitEditing={saveMeta}
              keyboardType="number-pad"
              placeholder="Sem meta"
            />
            <Text variant="micro" muted>Deixe vazio para não ter meta. O número é só uma referência.</Text>
          </Card>
        ) : null}

        {usesOff ? <Text variant="micro" muted>{OFF_ATTRIBUTION}</Text> : null}

        <PrimaryButton label="Voltar" variant="ghost" onPress={() => safeBack(router, '/(tabs)/saude')} />
      </View>

      <BarcodeSheet
        visible={scanOpen}
        showCalories={showKcal}
        onClose={() => setScanOpen(false)}
        onAdd={(item) => setExtra((cur) => [...cur.filter((c) => c.key !== item.key), item])}
      />
    </Screen>
  )
}
