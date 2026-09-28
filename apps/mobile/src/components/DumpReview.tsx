import { useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import {
  DUMP_KIND_LABELS,
  DUMP_LOW_CONFIDENCE,
  localTodayIso,
  type DumpItem,
  type DumpKind,
} from '@simply-life/shared'
import { Text } from '../ui'
import { Icon, type IconName } from '../ui/Icon'
import { useTheme } from '../theme/ThemeProvider'

export const DUMP_KINDS: DumpKind[] = ['tarefa', 'lembrete', 'gasto', 'receita', 'conta']

const KIND_ICON: Record<DumpKind, IconName> = {
  tarefa: 'checkbox-outline',
  lembrete: 'notifications-outline',
  gasto: 'cart-outline',
  receita: 'cash-outline',
  conta: 'receipt-outline',
}

const PLURAL: Record<DumpKind, [string, string]> = {
  tarefa: ['tarefa', 'tarefas'],
  lembrete: ['lembrete', 'lembretes'],
  gasto: ['gasto', 'gastos'],
  receita: ['receita', 'receitas'],
  conta: ['conta a pagar', 'contas a pagar'],
}

const SHORT_PLURAL: Record<DumpKind, [string, string]> = {
  ...PLURAL,
  conta: ['conta', 'contas'],
}

export function isMoneyKind(kind: DumpKind): boolean
{
  return kind === 'gasto' || kind === 'receita' || kind === 'conta'
}

/** "2 tarefas, 1 conta a pagar e 1 lembrete" */
export function dumpSummary(counts: Partial<Record<DumpKind, number>>, short = false): string
{
  const words = short ? SHORT_PLURAL : PLURAL
  const parts = DUMP_KINDS
    .filter((k) => (counts[k] ?? 0) > 0)
    .map((k) =>
    {
      const n = counts[k] ?? 0
      return `${n} ${n === 1 ? words[k][0] : words[k][1]}`
    })
  if (parts.length <= 1) return parts[0] ?? ''
  return `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`
}

export function countDumpKinds(items: DumpItem[]): Record<DumpKind, number>
{
  const out: Record<DumpKind, number> = { tarefa: 0, lembrete: 0, gasto: 0, receita: 0, conta: 0 }
  for (const i of items) out[i.kind] += 1
  return out
}

/** Itens de dinheiro sem valor não podem ser salvos. */
export function dumpItemsMissingValue(items: DumpItem[]): number
{
  return items.filter((i) => isMoneyKind(i.kind) && !(i.valor != null && i.valor > 0)).length
}

const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function isoToLocalDate(iso: string): Date | null
{
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

/** "hoje", "amanhã", "ontem" ou "qua, 30 set" */
export function friendlyDumpDate(iso: string, ref = new Date()): string
{
  const d = isoToLocalDate(iso)
  const today = isoToLocalDate(localTodayIso(ref))
  if (!d || !today) return iso
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'amanhã'
  if (diff === -1) return 'ontem'
  return `${WEEKDAY_SHORT[d.getDay()]}, ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`
}

export function formatDumpHour(min: number): string
{
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function valorToText(v: number | null): string
{
  if (v == null || !(v > 0)) return ''
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function textToValor(t: string): number | null
{
  const clean = t.replace(/[^\d,.]/g, '')
  if (!clean) return null
  // "1.234,56" ou "1234,56" ou "12.5"
  const normalized = clean.includes(',')
    ? clean.replace(/\./g, '').replace(',', '.')
    : clean
  const n = Number(normalized)
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null
}

type MetaChipProps = {
  icon: IconName
  label: string
  accessibilityLabel: string
}

function MetaChip({ icon, label, accessibilityLabel }: MetaChipProps)
{
  const { colors, radius } = useTheme()
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        minHeight: 28,
        paddingHorizontal: 10,
        borderRadius: radius.pill,
        backgroundColor: colors.elevated,
      }}
    >
      <Icon name={icon} size={14} color={colors.inkMuted} />
      <Text variant="micro" color={colors.inkMuted}>{label}</Text>
    </View>
  )
}

type RowProps = {
  item: DumpItem
  onChange: (next: DumpItem) => void
  onRemove: () => void
}

function DumpReviewRow({ item, onChange, onRemove }: RowProps)
{
  const { colors, radius, space } = useTheme()
  const [picking, setPicking] = useState(false)
  const [valorText, setValorText] = useState(() => valorToText(item.valor))
  const money = isMoneyKind(item.kind)
  const doubtful = item.confianca < DUMP_LOW_CONFIDENCE
  const missingValue = money && !(item.valor != null && item.valor > 0)

  const setKind = (kind: DumpKind) =>
  {
    setPicking(false)
    if (kind === item.kind) return
    const nextMoney = isMoneyKind(kind)
    // virou dinheiro sem valor lido: tenta o número da própria linha ("pagar a vitória 8,11")
    const guessed = nextMoney && item.valor == null
      ? textToValor(/(\d+(?:[.,]\d{1,2})?)/.exec(item.linha)?.[1] ?? '')
      : null
    if (guessed != null) setValorText(valorToText(guessed))
    onChange({
      ...item,
      kind,
      valor: guessed ?? item.valor,
      // quem troca o tipo à mão já conferiu
      confianca: Math.max(item.confianca, 1),
      data: item.data ?? (nextMoney ? localTodayIso() : null),
    })
  }

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: doubtful ? colors.attentionMuted : colors.hairline,
        padding: space.md,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <Text variant="micro" color={colors.inkFaint} style={{ flex: 1 }} numberOfLines={2}>
          {item.linha}
        </Text>
        {doubtful ? (
          <View
            accessible
            accessibilityLabel="Leitura incerta, confere o tipo"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 8,
              minHeight: 22,
              borderRadius: radius.pill,
              backgroundColor: colors.attentionMuted,
            }}
          >
            <Icon name="help-outline" size={12} color={colors.attention} />
            <Text variant="micro" color={colors.attention}>Confere?</Text>
          </View>
        ) : null}
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Tirar "${item.titulo || item.linha}" da lista`}
          hitSlop={10}
          style={{
            width: 32,
            height: 32,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.elevated,
          }}
        >
          <Icon name="close" size={16} color={colors.inkMuted} />
        </Pressable>
      </View>

      <TextInput
        value={item.titulo}
        onChangeText={(titulo) => onChange({ ...item, titulo })}
        placeholder="Título"
        placeholderTextColor={colors.inkFaint}
        accessibilityLabel="Título do item"
        style={{
          fontFamily: 'Lexend_500Medium',
          fontSize: 16,
          color: colors.ink,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: radius.control,
          backgroundColor: colors.elevated,
        }}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <Pressable
          onPress={() => setPicking((p) => !p)}
          accessibilityRole="button"
          accessibilityLabel={`Tipo: ${DUMP_KIND_LABELS[item.kind]}. Toque para trocar`}
          accessibilityState={{ expanded: picking }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            minHeight: 32,
            paddingHorizontal: 12,
            borderRadius: radius.pill,
            backgroundColor: colors.brandMuted,
          }}
        >
          <Icon name={KIND_ICON[item.kind]} size={14} color={colors.ink} />
          <Text variant="micro" color={colors.ink}>{DUMP_KIND_LABELS[item.kind]}</Text>
          <Icon name={picking ? 'chevron-up' : 'chevron-down'} size={12} color={colors.inkMuted} />
        </Pressable>
        {/* sem data dita, tudo entra em hoje ao salvar */}
        <MetaChip
          icon="calendar-outline"
          label={friendlyDumpDate(item.data ?? localTodayIso())}
          accessibilityLabel={`${item.kind === 'conta' ? 'Vence' : 'Data'}: ${friendlyDumpDate(item.data ?? localTodayIso())}`}
        />
        {item.horaMinutos != null ? (
          <MetaChip
            icon="time-outline"
            label={formatDumpHour(item.horaMinutos)}
            accessibilityLabel={`Hora: ${formatDumpHour(item.horaMinutos)}`}
          />
        ) : null}
        {item.checklist.length > 0 ? (
          <MetaChip
            icon="list"
            label={`${item.checklist.length} ${item.checklist.length === 1 ? 'item' : 'itens'}`}
            accessibilityLabel={`Checklist com ${item.checklist.length} itens: ${item.checklist.join(', ')}`}
          />
        ) : null}
      </View>

      {picking ? (
        <View
          accessibilityRole="radiogroup"
          style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}
        >
          {DUMP_KINDS.map((k) =>
          {
            const active = k === item.kind
            return (
              <Pressable
                key={k}
                onPress={() => setKind(k)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={DUMP_KIND_LABELS[k]}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  minHeight: 36,
                  paddingHorizontal: 12,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: active ? colors.brand : colors.hairline,
                  backgroundColor: active ? colors.brandMuted : colors.surface,
                }}
              >
                <Icon name={KIND_ICON[k]} size={14} color={active ? colors.ink : colors.inkMuted} />
                <Text variant="micro" color={active ? colors.ink : colors.inkMuted}>{DUMP_KIND_LABELS[k]}</Text>
              </Pressable>
            )
          })}
        </View>
      ) : null}

      {money ? (
        <View style={{ gap: 4 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              borderRadius: radius.control,
              backgroundColor: colors.elevated,
              borderWidth: 1,
              borderColor: missingValue ? colors.attention : 'transparent',
            }}
          >
            <Text variant="caption" color={colors.inkMuted}>R$</Text>
            <TextInput
              value={valorText}
              onChangeText={(t) =>
              {
                setValorText(t)
                onChange({ ...item, valor: textToValor(t) })
              }}
              onBlur={() => setValorText(valorToText(item.valor))}
              placeholder="0,00"
              placeholderTextColor={colors.inkFaint}
              keyboardType="decimal-pad"
              inputMode="decimal"
              accessibilityLabel="Valor em reais"
              style={{
                flex: 1,
                fontFamily: 'Lexend_500Medium',
                fontSize: 16,
                color: colors.ink,
                paddingVertical: 8,
              }}
            />
          </View>
          {missingValue ? (
            <Text variant="micro" color={colors.attention}>Falta o valor</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

type Props = {
  items: DumpItem[]
  onChange: (items: DumpItem[]) => void
}

/** Revisão do Dump: o que o app entendeu, linha a linha, antes de salvar. */
export function DumpReview({ items, onChange }: Props)
{
  const { colors, space } = useTheme()
  const summary = dumpSummary(countDumpKinds(items))
  const doubtful = items.filter((i) => i.confianca < DUMP_LOW_CONFIDENCE).length

  return (
    <View style={{ gap: space.md }}>
      <View style={{ gap: 4 }}>
        <Text variant="section">Entendi assim</Text>
        <Text variant="caption" color={colors.inkMuted}>
          {items.length === 0 ? 'Nada na lista. Volte para escrever de novo.' : summary}
        </Text>
        {doubtful > 0 ? (
          <Text variant="micro" color={colors.inkMuted}>
            {doubtful === 1
              ? 'Uma linha ficou em dúvida. Toque no tipo para trocar, se precisar.'
              : `${doubtful} linhas ficaram em dúvida. Toque no tipo para trocar, se precisar.`}
          </Text>
        ) : null}
      </View>
      {items.map((item) => (
        <DumpReviewRow
          key={item.key}
          item={item}
          onChange={(next) => onChange(items.map((i) => (i.key === item.key ? next : i)))}
          onRemove={() => onChange(items.filter((i) => i.key !== item.key))}
        />
      ))}
    </View>
  )
}
