import { useEffect, useMemo, type ReactNode } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  billsDueOnIso,
  formatBRL,
  localTodayIso,
  monthExpenseTotal,
  rankCategoriesBySpend,
  type MobileTask,
} from '@simply-life/shared'
import { Text } from '../../../ui'
import { Icon, type IconName } from '../../../ui/Icon'
import { useTheme } from '../../../theme/ThemeProvider'
import { webBandColor } from '../../../theme/webPalette'
import { useDataStore } from '../../../store/dataStore'
import { useDuePaidStore } from '../../../store/duePaidStore'
import { useCategoryMetaStore } from '../../../store/categoryMetaStore'
import { colorMapFromMeta, labelMapFromMeta } from '../../../lib/categoryMeta'
import { WebHoverable } from './WebHoverable'
import { webStyle } from './webStyle'
import { WEB_DISPLAY_FONT } from './webTypography'
import { WEB_BOX } from './webBox'
import type { WebStatItem } from './WebStatRow'

/* Blocos da Home no computador: cabeçalho com título e ação, número em destaque e lista curta. */

/** Quantas linhas cada lista mostra: blocos da mesma faixa ficam com altura parecida. */
const ROWS = 4

function BlockHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void })
{
  const { colors } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <Text variant="section" style={{ fontSize: 17 }} numberOfLines={1}>
        {title}
      </Text>
      {action ? (
        <WebHoverable onPress={onAction} accessibilityLabel={action} style={webStyle({ cursor: 'pointer' })}>
          <Text variant="caption" style={{ color: colors.axel, fontWeight: '700' }}>
            {action}
          </Text>
        </WebHoverable>
      ) : null}
    </View>
  )
}

/** Número grande (serifado) com a unidade ao lado: "3 tarefas", "R$ 3.508". */
function BigFigure({ value, unit }: { value: string; unit?: string })
{
  const { colors } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
      <Text style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 28, lineHeight: 36, color: colors.ink }}>{value}</Text>
      {unit ? <Text variant="caption" muted>{unit}</Text> : null}
    </View>
  )
}

/** Quadradinho com ícone, na cor do módulo (fundo é a própria cor bem clara). */
function IconChip({ icon, color, size = 36 }: { icon: IconName; color: string; size?: number })
{
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        backgroundColor: `${color}1A`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={Math.round(size * 0.47)} color={color} />
    </View>
  )
}

function Row({ children, onPress, label }: { children: ReactNode; onPress?: () => void; label: string })
{
  const { colors } = useTheme()
  return (
    <WebHoverable
      onPress={onPress}
      accessibilityLabel={label}
      style={(hovered) => webStyle({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
        paddingHorizontal: 8,
        marginHorizontal: -8,
        borderRadius: 8,
        backgroundColor: hovered && onPress ? colors.surface : 'transparent',
        cursor: onPress ? 'pointer' : 'default',
      })}
    >
      {children}
    </WebHoverable>
  )
}

function Empty({ children }: { children: string })
{
  return (
    <Text variant="caption" muted style={{ paddingVertical: 8 }}>
      {children}
    </Text>
  )
}

/** Faixa de indicadores: ícone, selo opcional, número e nome. O último é o atalho para personalizar. */
export function WebKpiTiles({ items, onCustomize }: { items: WebStatItem[]; onCustomize?: () => void })
{
  const { colors } = useTheme()
  const cols = items.length + (onCustomize ? 1 : 0)
  return (
    <View style={webStyle({ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 16 })}>
      {items.map((item) => (
        <WebHoverable
          key={item.id}
          onPress={item.onPress}
          accessibilityLabel={`${item.label}: ${item.value}`}
          style={(hovered) => webStyle({
            gap: 12,
            borderRadius: WEB_BOX.radius,
            borderWidth: 1,
            borderColor: hovered && item.onPress ? colors.hairline : colors.cardRim,
            backgroundColor: colors.elevated,
            boxShadow: '0 1px 2px rgba(21, 32, 34, 0.04)',
            paddingHorizontal: 16,
            paddingVertical: 14,
            cursor: item.onPress ? 'pointer' : 'default',
            minWidth: 0,
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <IconChip icon={item.icon} color={item.color} size={32} />
            {item.hint ? (
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: `${item.color}1A` }}>
                <Text variant="micro" numberOfLines={1} style={{ color: item.color, fontWeight: '700' }}>
                  {item.hint}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={{ gap: 2, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 24, lineHeight: 32, color: colors.ink }}>
              {item.value}
            </Text>
            <Text variant="caption" muted numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        </WebHoverable>
      ))}
      {onCustomize ? (
        <WebHoverable
          onPress={onCustomize}
          accessibilityLabel="Personalizar Início"
          style={(hovered) => webStyle({
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderRadius: WEB_BOX.radius,
            borderWidth: 1,
            borderColor: hovered ? colors.hairline : colors.cardRim,
            backgroundColor: colors.elevated,
            paddingVertical: 14,
            cursor: 'pointer',
          })}
        >
          <View style={{ width: 32, height: 32, borderRadius: 999, borderWidth: 1, borderColor: colors.hairlineStrong, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="add" size={16} color={colors.inkMuted} />
          </View>
          <Text variant="caption" muted>Personalizar</Text>
        </WebHoverable>
      ) : null}
    </View>
  )
}

function timeLabel(mins: number | null): string
{
  if (mins == null) return 'Sem horário'
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

const PRIORITY: Record<1 | 2 | 3, string> = { 1: 'Alta', 2: 'Média', 3: 'Baixa' }

/** Tarefas de hoje: total em destaque e as próximas com hora e prioridade. */
export function WebAgendaBlock({ tasks, overdueCount }: { tasks: MobileTask[]; overdueCount: number })
{
  const { colors } = useTheme()
  const router = useRouter()
  const tint = (p: 1 | 2 | 3) => (p === 1 ? colors.danger : p === 2 ? colors.attention : colors.inkMuted)
  return (
    <View style={{ gap: 12 }}>
      <BlockHeader title="Agenda de hoje" action="Abrir" onAction={() => router.push('/(tabs)/kanban')} />
      <BigFigure
        value={String(tasks.length)}
        unit={`${tasks.length === 1 ? 'tarefa' : 'tarefas'}${overdueCount > 0 ? ` · ${overdueCount} atrasada${overdueCount === 1 ? '' : 's'}` : ''}`}
      />
      <View>
        {tasks.length === 0 ? (
          <Empty>Dê um horário a uma tarefa para ela aparecer aqui.</Empty>
        ) : (
          tasks.slice(0, ROWS).map((t) => (
            <Row key={t.id} label={t.titulo} onPress={() => router.push(`/task/${t.id}`)}>
              <IconChip icon="time-outline" color={tint(t.prioridade)} />
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text variant="bodyStrong" numberOfLines={1} style={{ fontSize: 14 }}>{t.titulo}</Text>
                <Text variant="caption" muted numberOfLines={1}>
                  {timeLabel(t.horaMinutos)} · {PRIORITY[t.prioridade]}
                </Text>
              </View>
            </Row>
          ))
        )}
      </View>
    </View>
  )
}

function shortDate(iso: string): string
{
  const [, m, d] = iso.split('-').map(Number)
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${d} ${months[m - 1]}`
}

/** Contas que vencem nos próximos dias, com a data num selo à direita. */
export function WebBillsBlock()
{
  const { colors } = useTheme()
  const router = useRouter()
  const fixas = useDataStore((s) => s.contasFixas) ?? []
  const bills = useDataStore((s) => s.contasAPagar) ?? []
  const cards = useDataStore((s) => s.financeCards) ?? []
  const hydratePaid = useDuePaidStore((s) => s.hydrate)
  const isPaid = useDuePaidStore((s) => s.isPaid)
  const paidKeys = useDuePaidStore((s) => s.keys)
  const today = localTodayIso()

  useEffect(() =>
  {
    hydratePaid()
  }, [hydratePaid])

  const due = useMemo(
    () => billsDueOnIso(today, fixas, bills, cards, isPaid, today).sort((a, b) => a.dueIso.localeCompare(b.dueIso)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today, fixas, bills, cards, isPaid, paidKeys],
  )
  const total = due.reduce((sum, b) => sum + (b.valor ?? 0), 0)

  return (
    <View style={{ gap: 12 }}>
      <BlockHeader title="Contas a vencer" action="Ver contas" onAction={() => router.push('/(tabs)/financeiro')} />
      <BigFigure value={formatBRL(total)} unit={due.length === 1 ? 'em 1 conta' : `em ${due.length} contas`} />
      <View>
        {due.length === 0 ? (
          <Empty>Nenhuma conta vence nos próximos dias.</Empty>
        ) : (
          due.slice(0, ROWS).map((b) => (
            <Row key={b.key} label={b.titulo}>
              <IconChip icon={b.kind === 'cartao' ? 'card-outline' : 'receipt-outline'} color={b.locked ? colors.danger : colors.finance} />
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text variant="bodyStrong" numberOfLines={1} style={{ fontSize: 14 }}>{b.titulo}</Text>
                <Text variant="caption" muted numberOfLines={1}>{formatBRL(b.valor)}</Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  backgroundColor: b.locked ? `${colors.danger}1A` : colors.surface,
                  borderWidth: 1,
                  borderColor: b.locked ? 'transparent' : colors.hairline,
                }}
              >
                <Text variant="micro" style={{ fontWeight: '700', color: b.locked ? colors.danger : colors.inkMuted }}>
                  {b.locked && b.dueIso < today ? 'Atrasada' : shortDate(b.dueIso)}
                </Text>
              </View>
            </Row>
          ))
        )}
      </View>
    </View>
  )
}

/** Gastos do mês: total, barra dividida por categoria e a legenda com valores. */
export function WebCategoryBlock()
{
  const { colors, chart } = useTheme()
  const router = useRouter()
  const finance = useDataStore((s) => s.finance) ?? []
  const hydrateCats = useCategoryMetaStore((s) => s.hydrate)
  const catMap = useCategoryMetaStore((s) => s.map)
  const total = monthExpenseTotal(finance) ?? 0
  const ranking = useMemo(
    () => rankCategoriesBySpend(finance, colorMapFromMeta(catMap), chart, labelMapFromMeta(catMap)),
    [finance, catMap, chart],
  )

  useEffect(() =>
  {
    void hydrateCats()
  }, [hydrateCats])

  // a barra mostra as maiores; o resto vira "Outras" para não picotar em fatias minúsculas
  const top = ranking.slice(0, ROWS)
  const rest = ranking.slice(ROWS).reduce((s, r) => s + r.total, 0)
  const sum = ranking.reduce((s, r) => s + r.total, 0) || 1

  return (
    <View style={{ gap: 12 }}>
      <BlockHeader title="Gastos do mês" action="Ver análise" onAction={() => router.push('/(tabs)/financeiro')} />
      <BigFigure value={formatBRL(total)} unit="em despesas" />
      {ranking.length === 0 ? (
        <Empty>Quando houver gastos no mês, as categorias aparecem aqui.</Empty>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 3, height: 10 }}>
            {top.map((r) => (
              <View key={r.categoria} style={{ flex: r.total / sum, borderRadius: 3, backgroundColor: r.color }} />
            ))}
            {rest > 0 ? <View style={{ flex: rest / sum, borderRadius: 3, backgroundColor: colors.hairline }} /> : null}
          </View>
          <View>
            {top.map((r) => (
              <View key={r.categoria} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 }}>
                <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: r.color }} />
                <Text variant="body" numberOfLines={1} style={{ flex: 1, fontSize: 14 }}>{r.label}</Text>
                <Text variant="caption" muted style={{ width: 40, textAlign: 'right' }}>
                  {Math.round((r.total / sum) * 100)}%
                </Text>
                <Text variant="bodyStrong" style={{ fontSize: 14, minWidth: 96, textAlign: 'right' }}>{formatBRL(r.total)}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  )
}

/**
 * Saudação da Home na faixa petróleo: continua o menu do topo, ocupa a largura toda
 * (sai do recuo da página) e deixa espaço embaixo para os indicadores subirem por cima.
 */
export function WebHomeHero({
  greet,
  name,
  dateLabel,
  onMore,
  padH,
  padTop,
}: {
  greet: string
  name: string
  dateLabel: string
  onMore: () => void
  /** recuo lateral e de cima da página, para a faixa encostar nas bordas */
  padH: number
  padTop: number
})
{
  const { colors, mode } = useTheme()
  const cream = colors.onBrand
  const creamSoft = `${colors.onBrand}C7`
  return (
    <View
      style={{
        marginHorizontal: -padH,
        marginTop: -padTop,
        paddingHorizontal: padH,
        paddingTop: 12,
        paddingBottom: HERO_OVERLAP + 28,
        backgroundColor: webBandColor(mode),
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 24,
      }}
    >
      <View style={{ gap: 2, minWidth: 0 }}>
        <Text style={{ fontSize: 14, lineHeight: 20, fontFamily: 'Lexend_500Medium', color: creamSoft }}>{greet},</Text>
        <Text numberOfLines={1} style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 34, lineHeight: 42, color: cream }}>
          {name}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 38,
            paddingHorizontal: 14,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: `${colors.onBrand}33`,
          }}
        >
          <Icon name="calendar-outline" size={15} color={creamSoft} />
          <Text style={{ fontSize: 14, fontFamily: 'Lexend_500Medium', color: cream }}>{dateLabel}</Text>
        </View>
        <WebHoverable
          onPress={onMore}
          accessibilityLabel="Mais opções"
          style={(hovered) => webStyle({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 38,
            paddingHorizontal: 16,
            borderRadius: 999,
            backgroundColor: hovered ? colors.surface : colors.elevated,
            cursor: 'pointer',
          })}
        >
          <Icon name="options-outline" size={15} color={colors.ink} />
          <Text style={{ fontSize: 14, fontFamily: 'Lexend_600SemiBold', color: colors.ink }}>Mais</Text>
        </WebHoverable>
      </View>
    </View>
  )
}

/** Quanto os indicadores sobem por cima da faixa da Home. */
export const HERO_OVERLAP = 56
