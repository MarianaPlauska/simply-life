import { useMemo, type ReactNode } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  AGUA_META_COPOS,
  buildAxelDayBrief,
  findHabit,
  formatSleepHours,
  humorDoDia,
  monthExpenseTotal,
  monthIncomeTotal,
  type MobileTask,
} from '@simply-life/shared'
import { Text } from '../../../ui'
import { Icon, type IconName } from '../../../ui/Icon'
import { ProgressRing } from '../../../ui/ProgressRing'
import { AxelSun } from '../../AxelSun'
import { useTheme } from '../../../theme/ThemeProvider'
import { webBandColor } from '../../../theme/webPalette'
import { useDataStore } from '../../../store/dataStore'
import { useCaptureStore } from '../../../store/captureStore'
import { useSectionNavStore } from '../../../store/sectionNavStore'
import { useElo } from '../../../hooks/useElo'
import { WebHoverable } from './WebHoverable'
import { webStyle } from './webStyle'
import { WEB_DISPLAY_FONT } from './webTypography'

/*
 * Início da web como painel de bem-estar (não a pilha do app): destaque grande do Axel
 * com ilustração e chamada, anel de progresso, cartões coloridos, ações rápidas,
 * linha do tempo e recomendações. Cada peça leva para a página de verdade.
 */

const CARD = { borderRadius: 16, padding: 20 } as const

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void })
{
  const { colors } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ fontFamily: 'Lexend_600SemiBold', fontSize: 16, lineHeight: 24, color: colors.ink }}>{title}</Text>
      {action ? (
        <WebHoverable onPress={onAction} accessibilityLabel={action} style={webStyle({ cursor: 'pointer' })}>
          {(hovered: boolean) => (
            <Text variant="caption" style={{ fontWeight: '700', color: colors.axel, textDecorationLine: hovered ? 'underline' : 'none' }}>
              {action}
            </Text>
          )}
        </WebHoverable>
      ) : null}
    </View>
  )
}

function WhiteCard({ children, style }: { children: ReactNode; style?: object })
{
  const { colors } = useTheme()
  return (
    <View
      style={[
        { ...CARD, gap: 12, backgroundColor: colors.elevated, borderWidth: 1, borderColor: colors.cardRim },
        style,
      ]}
    >
      {children}
    </View>
  )
}

/** Saudação leve no topo, sem faixa: "Boa tarde, nome" e a data. */
export function DashGreeting({ greet, name, dateLabel, onMore }: { greet: string; name: string; dateLabel: string; onMore: () => void })
{
  const { colors } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, paddingTop: 8 }}>
      <View style={{ gap: 4 }}>
        <Text variant="caption" muted>{greet},</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 26, lineHeight: 34, color: colors.ink }}>{name}</Text>
          <Icon name="sunny" size={20} color={colors.attention} />
        </View>
        <Text variant="caption" muted>Uma coisa de cada vez. Você está indo bem.</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.elevated, borderWidth: 1, borderColor: colors.cardRim }}>
          <Icon name="calendar-outline" size={15} color={colors.inkMuted} />
          <Text variant="caption">{dateLabel}</Text>
        </View>
        <WebHoverable
          onPress={onMore}
          accessibilityLabel="Mais opções"
          style={(hovered) => webStyle({
            width: 40,
            height: 40,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: hovered ? colors.surface : colors.elevated,
            borderWidth: 1,
            borderColor: colors.cardRim,
            cursor: 'pointer',
          })}
        >
          <Icon name="options-outline" size={16} color={colors.ink} />
        </WebHoverable>
      </View>
    </View>
  )
}

/**
 * Destaque do dia: a frase do Axel em letra grande sobre o petróleo, um passo
 * sugerido e a chamada para respirar; à direita o girassol em círculos.
 */
export function DashHero()
{
  const { colors, mode } = useTheme()
  const router = useRouter()
  const tasks = useDataStore((s) => s.tasks) ?? []
  const habits = useDataStore((s) => s.habits)
  const medicamentos = useDataStore((s) => s.medicamentos) ?? []
  const cash = useDataStore((s) => s.cashAccount)
  const finance = useDataStore((s) => s.finance) ?? []
  const fixas = useDataStore((s) => s.contasFixas) ?? []
  const lastAxelCare = useDataStore((s) => s.lastAxelCare)
  const humor = useDataStore((s) => s.humor) ?? []
  const moodLevel = humorDoDia(humor)?.humor ?? null
  const brief = useMemo(
    () => buildAxelDayBrief({ tasks, habits, medicamentos, finance, cash, fixas, lastAxelCare, moodLevel }),
    [tasks, habits, medicamentos, finance, cash, fixas, lastAxelCare, moodLevel],
  )
  const cream = colors.onBrand
  const creamSoft = `${colors.onBrand}C7`
  const step = brief.nextSteps[0]

  return (
    <View
      style={{
        ...CARD,
        padding: 24,
        overflow: 'hidden',
        backgroundColor: webBandColor(mode),
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
      }}
    >
      <View style={{ flex: 1, gap: 10, minWidth: 0, zIndex: 1 }}>
        <Text style={{ fontSize: 12, letterSpacing: 1.2, fontFamily: 'Lexend_600SemiBold', color: creamSoft }}>AXEL PARA HOJE</Text>
        <Text style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 26, lineHeight: 34, color: cream }}>{brief.headline}</Text>
        <Text numberOfLines={2} style={{ fontSize: 14, lineHeight: 21, fontFamily: 'Lexend_400Regular', color: creamSoft, maxWidth: 520 }}>
          {brief.voice}
        </Text>
        {step ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', maxWidth: '100%', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: `${colors.onBrand}1A` }}>
            <Icon name="flag-outline" size={14} color={creamSoft} />
            <Text numberOfLines={1} style={{ fontSize: 13, fontFamily: 'Lexend_500Medium', color: cream, flexShrink: 1 }}>{step}</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 12, paddingTop: 6 }}>
          <WebHoverable
            onPress={() => router.push('/calm/box-breathing')}
            accessibilityLabel="Respirar um minuto"
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
            <Icon name="play" size={14} color={colors.ink} />
            <Text style={{ fontSize: 14, fontFamily: 'Lexend_600SemiBold', color: colors.ink }}>Respirar um minuto</Text>
          </WebHoverable>
          <WebHoverable
            onPress={() => router.push('/(tabs)/kanban')}
            accessibilityLabel="Ver tarefas"
            style={(hovered) => webStyle({
              height: 38,
              paddingHorizontal: 16,
              borderRadius: 999,
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: `${colors.onBrand}59`,
              backgroundColor: hovered ? `${colors.onBrand}14` : 'transparent',
              cursor: 'pointer',
            })}
          >
            <Text style={{ fontSize: 14, fontFamily: 'Lexend_600SemiBold', color: cream }}>Ver tarefas</Text>
          </WebHoverable>
        </View>
      </View>

      {/* ilustração: o girassol do Axel em círculos concêntricos (no lugar da foto) */}
      <View style={{ width: 168, height: 168, alignItems: 'center', justifyContent: 'center' }}>
        {[168, 128, 88].map((d) => (
          <View
            key={d}
            style={{ position: 'absolute', width: d, height: d, borderRadius: 999, backgroundColor: `${colors.onBrand}0F` }}
          />
        ))}
        <AxelSun size={76} mood={moodLevel != null && moodLevel <= 2 ? 'care' : moodLevel != null && moodLevel >= 4 ? 'happy' : 'calm'} />
      </View>
    </View>
  )
}

/** Anel grande com o progresso do dia (feitas / do dia). */
export function DashProgress({ done, total }: { done: number; total: number })
{
  const { colors } = useTheme()
  const router = useRouter()
  const elo = useElo()
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const line = pct >= 100 ? 'Dia cumprido. Descanse sem culpa.' : pct >= 50 ? 'Você está no caminho.' : done > 0 ? 'Já começou. Siga no seu ritmo.' : 'Começar é o passo mais difícil.'
  return (
    <WhiteCard style={{ flex: 1 }}>
      <SectionTitle title="Progresso de hoje" action="Ver tarefas" onAction={() => router.push('/(tabs)/kanban')} />
      <View style={{ alignItems: 'center', gap: 12, paddingVertical: 4 }}>
        <ProgressRing
          progress={pct}
          size={116}
          strokeWidth={11}
          color={colors.health}
          trackColor={colors.hairline}
          centerLabel={`${pct}%`}
          labelColor={colors.ink}
        />
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text variant="bodyStrong">{line}</Text>
          <Text variant="caption" muted>
            {done} de {total} concluídas · elo de {elo.atual} {elo.atual === 1 ? 'dia' : 'dias'}
          </Text>
        </View>
      </View>
    </WhiteCard>
  )
}

type Wellness = { key: string; label: string; value: string; unit?: string; pct: number; icon: IconName; color: string; tint: string; onPress: () => void }

/** "Seu bem-estar hoje": quatro cartões coloridos com número e barra de meta. */
export function DashWellness({ doneToday, totalToday, onCustomize }: { doneToday: number; totalToday: number; onCustomize: () => void })
{
  const { colors } = useTheme()
  const router = useRouter()
  const habits = useDataStore((s) => s.habits)
  const finance = useDataStore((s) => s.finance) ?? []
  const agua = findHabit(habits, 'agua')
  const sono = findHabit(habits, 'sono')
  const aguaMeta = agua?.metaDiaria ?? AGUA_META_COPOS
  const aguaAtual = agua?.progressoAtual ?? 0
  const sonoH = sono?.progressoAtual ?? 0
  const gastos = monthExpenseTotal(finance) ?? 0
  const receitas = monthIncomeTotal(finance) ?? 0
  const openSaude = (section: string) =>
  {
    useSectionNavStore.getState().setActive('saude', section)
    router.push('/(tabs)/saude')
  }

  const items: Wellness[] = [
    {
      key: 'tasks', label: 'Tarefas de hoje', value: `${doneToday}/${totalToday}`, unit: 'feitas',
      pct: totalToday ? doneToday / totalToday : 0, icon: 'checkbox-outline', color: colors.tasks, tint: colors.tasksMuted,
      onPress: () => router.push('/(tabs)/kanban'),
    },
    {
      key: 'water', label: 'Água', value: `${aguaAtual}/${aguaMeta}`, unit: 'copos',
      pct: aguaMeta ? aguaAtual / aguaMeta : 0, icon: 'water-outline', color: colors.health, tint: colors.healthMuted,
      onPress: () => openSaude('cuidados'),
    },
    {
      key: 'sleep', label: 'Sono', value: sonoH > 0 ? formatSleepHours(sonoH) : 'Sem registro',
      pct: Math.min(1, sonoH / 8), icon: 'moon-outline', color: colors.brand, tint: colors.brandMuted,
      onPress: () => openSaude('cuidados'),
    },
    {
      key: 'spend', label: receitas ? 'Gastos · da renda' : 'Gastos do mês', value: gastos >= 1000 ? `${(gastos / 1000).toFixed(1).replace('.', ',')} mil` : `R$ ${Math.round(gastos)}`,
      unit: undefined,
      pct: receitas ? Math.min(1, gastos / receitas) : 0, icon: 'wallet-outline', color: colors.finance, tint: colors.financeMuted,
      onPress: () => router.push('/(tabs)/financeiro'),
    },
  ]

  return (
    <View style={{ gap: 14 }}>
      <SectionTitle title="Seu bem-estar hoje" action="Personalizar" onAction={onCustomize} />
      <View style={webStyle({ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 })}>
        {items.map((it) => (
          <WebHoverable
            key={it.key}
            onPress={it.onPress}
            accessibilityLabel={`${it.label}: ${it.value}`}
            style={(hovered) => webStyle({
              gap: 10,
              padding: 14,
              borderRadius: 14,
              backgroundColor: it.tint,
              transform: hovered ? 'translateY(-2px)' : 'none',
              transitionProperty: 'transform',
              transitionDuration: '150ms',
              cursor: 'pointer',
            })}
          >
            <View style={{ width: 30, height: 30, borderRadius: 999, backgroundColor: colors.elevated, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={it.icon} size={15} color={it.color} />
            </View>
            <View style={{ gap: 2 }}>
              <Text numberOfLines={1} style={{ fontFamily: WEB_DISPLAY_FONT, fontSize: 21, lineHeight: 28, color: colors.ink }}>{it.value}</Text>
              <Text variant="caption" muted numberOfLines={1}>{it.unit ? `${it.label} · ${it.unit}` : it.label}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: `${it.color}2E`, overflow: 'hidden' }}>
                <View style={{ width: `${Math.round(it.pct * 100)}%`, height: 6, borderRadius: 3, backgroundColor: it.color }} />
              </View>
              <Text variant="micro" style={{ fontWeight: '700', color: it.color }}>{Math.round(it.pct * 100)}%</Text>
            </View>
          </WebHoverable>
        ))}
      </View>
    </View>
  )
}

/** Ações rápidas em ladrilhos coloridos (2 x 2). */
export function DashQuickActions()
{
  const { colors } = useTheme()
  const router = useRouter()
  const openCapture = useCaptureStore((s) => s.openCapture)
  const actions: { label: string; icon: IconName; color: string; tint: string; onPress: () => void }[] = [
    { label: 'Nova tarefa', icon: 'add', color: colors.tasks, tint: colors.tasksMuted, onPress: () => openCapture('task', null, { studio: true }) },
    { label: 'Novo gasto', icon: 'receipt-outline', color: colors.finance, tint: colors.financeMuted, onPress: () => openCapture('expense', null, { studio: true }) },
    {
      label: 'Meu humor', icon: 'happy-outline', color: colors.health, tint: colors.healthMuted,
      onPress: () =>
      {
        useSectionNavStore.getState().setActive('saude', 'diario')
        router.push('/(tabs)/saude')
      },
    },
    { label: 'Respirar', icon: 'leaf-outline', color: colors.brand, tint: colors.brandMuted, onPress: () => router.push('/calm/box-breathing') },
  ]
  return (
    <WhiteCard>
      <SectionTitle title="Ações rápidas" />
      <View style={webStyle({ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 })}>
        {actions.map((a) => (
          <WebHoverable
            key={a.label}
            onPress={a.onPress}
            accessibilityLabel={a.label}
            style={(hovered) => webStyle({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              height: 46,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: a.tint,
              opacity: hovered ? 0.85 : 1,
              cursor: 'pointer',
            })}
          >
            <Icon name={a.icon} size={18} color={a.color} />
            <Text numberOfLines={1} style={{ fontSize: 14, fontFamily: 'Lexend_600SemiBold', color: colors.ink, flexShrink: 1 }}>{a.label}</Text>
          </WebHoverable>
        ))}
      </View>
    </WhiteCard>
  )
}

function hhmm(mins: number | null): string
{
  if (mins == null) return '--:--'
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

/** "Próximos": linha do tempo com bolinhas, o que tem hora hoje. */
export function DashUpcoming({ tasks }: { tasks: MobileTask[] })
{
  const { colors } = useTheme()
  const router = useRouter()
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const tint = (p: 1 | 2 | 3) => (p === 1 ? colors.danger : p === 2 ? colors.attention : colors.health)
  return (
    <WhiteCard>
      <SectionTitle title="Próximos" action="Agenda" onAction={() =>
      {
        useSectionNavStore.getState().setActive('kanban', 'calendario')
        router.push('/(tabs)/kanban')
      }} />
      {tasks.length === 0 ? (
        <Text variant="caption" muted>Nada com horário hoje.</Text>
      ) : (
        <View>
          {tasks.slice(0, 5).map((t, i, arr) =>
          {
            const past = t.horaMinutos != null && t.horaMinutos < nowMin
            return (
              <WebHoverable
                key={t.id}
                onPress={() => router.push(`/task/${t.id}`)}
                accessibilityLabel={t.titulo}
                style={webStyle({ flexDirection: 'row', gap: 12, cursor: 'pointer', opacity: past ? 0.55 : 1 })}
              >
                <View style={{ width: 12, alignItems: 'center' }}>
                  <View style={{ width: 10, height: 10, borderRadius: 999, marginTop: 5, backgroundColor: tint(t.prioridade) }} />
                  {i < arr.length - 1 ? <View style={{ width: 2, flex: 1, backgroundColor: colors.hairline, marginVertical: 4 }} /> : null}
                </View>
                <Text variant="caption" muted style={{ width: 44, paddingTop: 1 }}>{hhmm(t.horaMinutos)}</Text>
                <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1, fontSize: 14, paddingBottom: 18 }}>{t.titulo}</Text>
              </WebHoverable>
            )
          })}
        </View>
      )}
    </WhiteCard>
  )
}

/** "Para você": atalhos recomendados com área colorida e ícone grande. */
export function DashForYou()
{
  const { colors } = useTheme()
  const router = useRouter()
  const cards: { title: string; text: string; icon: IconName; color: string; tint: string; onPress: () => void }[] = [
    { title: 'Planejar amanhã', text: 'Três coisas para amanhã, em dois minutos.', icon: 'moon-outline', color: colors.brand, tint: colors.brandMuted, onPress: () => router.push('/planejar-amanha') },
    { title: 'Modo foco', text: 'Um timer e uma tarefa só, sem distração.', icon: 'timer-outline', color: colors.tasks, tint: colors.tasksMuted, onPress: () => router.push('/foco') },
    {
      title: 'Seu diário', text: 'Como você tem se sentido nos últimos dias.', icon: 'book-outline', color: colors.health, tint: colors.healthMuted,
      onPress: () =>
      {
        useSectionNavStore.getState().setActive('saude', 'diario')
        router.push('/(tabs)/saude')
      },
    },
    { title: 'Relatório em PDF', text: 'Tudo de um período, para guardar ou mostrar.', icon: 'document-text-outline', color: colors.finance, tint: colors.financeMuted, onPress: () => router.push('/relatorio') },
  ]
  return (
    <View style={{ gap: 14 }}>
      <SectionTitle title="Para você" />
      <View style={webStyle({ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 })}>
        {cards.map((c) => (
          <WebHoverable
            key={c.title}
            onPress={c.onPress}
            accessibilityLabel={c.title}
            style={(hovered) => webStyle({
              borderRadius: 14,
              overflow: 'hidden',
              backgroundColor: colors.elevated,
              borderWidth: 1,
              borderColor: hovered ? colors.hairline : colors.cardRim,
              cursor: 'pointer',
            })}
          >
            <View style={{ height: 64, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={c.icon} size={26} color={c.color} />
            </View>
            <View style={{ padding: 14, gap: 4, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="bodyStrong" style={{ fontSize: 15 }}>{c.title}</Text>
                <Text variant="caption" muted numberOfLines={2}>{c.text}</Text>
              </View>
              <Icon name="chevron-forward" size={16} color={colors.inkMuted} />
            </View>
          </WebHoverable>
        ))}
      </View>
    </View>
  )
}

/** Rodapé discreto: versão da web e autoria. */
export function DashFooter()
{
  const { colors } = useTheme()
  return (
    <View style={{ marginTop: 24, paddingVertical: 20, borderTopWidth: 1, borderTopColor: colors.hairline, alignItems: 'center' }}>
      <Text variant="caption" muted>SunFy web · versão 2.0 · feito por Mariana Plauska</Text>
    </View>
  )
}
